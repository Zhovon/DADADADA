export interface CarInput {
  throttle: boolean
  brake: boolean
  steer: number // -1 (left) .. 1 (right)
  handbrake: boolean
}

export interface CarTuning {
  accel: number
  maxSpeed: number
  grip: number
  driftGrip: number
}

const DEFAULT_TUNING: CarTuning = { accel: 1, maxSpeed: 1, grip: 1, driftGrip: 1 }

// --- Tuning constants (arcade feel) ---
const ENGINE_ACCEL = 80 // forward acceleration (u/s^2)
const BRAKE_DECEL = 250 // much stronger hard brakes!
const HANDBRAKE_DECEL = 100 // handbrake slows you down while sliding
const REVERSE_ACCEL = 25
const MAX_SPEED = 107 // ~320 km/h (107 * 3.0)
const MAX_REVERSE = 20
const ROLLING_RESIST = 0.45 // coasting slow-down
const STEER_RATE = 2.5 // base yaw rate (rad/s)
const GRIP = 7.5 // lateral grip (higher = sticks to nose)
const DRIFT_GRIP = 1.15 // grip while handbraking (low = slides)
const OFFTRACK_GRIP = 4
const ASSIST = 2.2 // countersteer / self-align assist
const HANDBRAKE_TURN_BOOST = 1.5

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export class CarPhysics {
  x = 0
  z = 0
  angle = 0 // yaw, forward = (sin, cos)
  vx = 0
  vz = 0

  // derived / readable state
  speed = 0
  driftAngle = 0
  drifting = false

  // scoring
  driftScore = 0 // banked
  pendingScore = 0 // live current drift chain
  multiplier = 1
  private driftTimer = 0
  private cooldown = 0

  // crashing state
  crashed = false
  crashTimer = 0

  tuning: CarTuning

  constructor(tuning: Partial<CarTuning> = {}) {
    this.tuning = { ...DEFAULT_TUNING, ...tuning }
  }

  reset(x: number, z: number, angle: number) {
    this.x = x
    this.z = z
    this.angle = angle
    this.vx = 0
    this.vz = 0
    this.speed = 0
    this.driftAngle = 0
    this.drifting = false
    this.driftScore = 0
    this.pendingScore = 0
    this.multiplier = 1
    this.driftTimer = 0
    this.cooldown = 0
    this.crashed = false
    this.crashTimer = 0
  }

  step(dt: number, input: CarInput, offTrack: boolean) {
    const sinA = Math.sin(this.angle)
    const cosA = Math.cos(this.angle)
    // basis vectors
    const fx = sinA
    const fz = cosA
    const rx = cosA
    const rz = -sinA

    let vForward = this.vx * fx + this.vz * fz
    let vRight = this.vx * rx + this.vz * rz
    const speed = Math.hypot(this.vx, this.vz)

    // --- Engine / braking (scaled by this car's tuning) ---
    const topSpeed = MAX_SPEED * this.tuning.maxSpeed
    const maxSpeed = offTrack ? topSpeed * 0.5 : topSpeed
    // --- Crashed State ---
    if (this.crashed) {
      this.crashTimer -= dt
      if (this.crashTimer <= 0) {
        this.crashed = false
      } else {
        // wildly spin and scrub speed
        this.angle += 12 * dt
        vForward *= Math.exp(-3 * dt)
        vRight *= Math.exp(-3 * dt)
      }
    }

    if (!this.crashed && input.throttle) {
      vForward += ENGINE_ACCEL * this.tuning.accel * dt
    }
    if (!this.crashed && input.brake) {
      if (vForward > 0.4) {
        vForward -= BRAKE_DECEL * dt
      } else {
        vForward -= REVERSE_ACCEL * dt
      }
    }
    if (!this.crashed && input.handbrake) {
      if (vForward > 0) {
        vForward -= HANDBRAKE_DECEL * dt
      }
    }
    if (!this.crashed && !input.throttle && !input.brake && !input.handbrake) {
      vForward -= vForward * ROLLING_RESIST * dt
    }
    if (vForward > maxSpeed) vForward = maxSpeed
    if (vForward < -MAX_REVERSE) vForward = -MAX_REVERSE

    if (offTrack) {
      // grass drags on everything
      vForward -= vForward * 1.4 * dt
    }

    // --- Steering -> yaw ---
    const speedFactor = Math.min(speed / 7, 1) // need some speed to rotate
    const topSpeedEase = 1 - Math.min(speed / (MAX_SPEED * 1.5), 1) * 0.5
    let steerAuthority = STEER_RATE * topSpeedEase
    if (input.handbrake) steerAuthority *= HANDBRAKE_TURN_BOOST
    // negate: with the chase camera looking down +z, world +x is screen-left,
    // so steering right (+1) must rotate toward -x.
    let yaw = -input.steer * steerAuthority * speedFactor
    if (vForward < 0) yaw = -yaw // invert when reversing
    if (!this.crashed) {
      this.angle += yaw * dt
    }

    // --- Lateral grip (this is where drift lives) ---
    let grip = input.handbrake
      ? DRIFT_GRIP * this.tuning.driftGrip
      : GRIP * this.tuning.grip
    if (offTrack) grip = Math.min(grip, OFFTRACK_GRIP)
    vRight *= Math.exp(-grip * dt)

    // --- Reconstruct velocity from (possibly rotated) basis ---
    const nSin = Math.sin(this.angle)
    const nCos = Math.cos(this.angle)
    this.vx = nSin * vForward + nCos * vRight
    this.vz = nCos * vForward - nSin * vRight

    // --- Self-align / countersteer assist (forgiving drifts) ---
    this.speed = Math.hypot(this.vx, this.vz)
    if (this.speed > 4) {
      const velDir = Math.atan2(this.vx, this.vz)
      let da = normalizeAngle(this.angle - velDir)
      // if travelling mostly backwards, measure against reverse heading
      if (Math.abs(da) > Math.PI / 2) {
        da = normalizeAngle(da - Math.PI)
      }
      this.driftAngle = da
      // gently pull heading back toward travel direction
      this.angle -= da * ASSIST * dt
    } else {
      this.driftAngle = 0
    }

    // --- Integrate position ---
    this.x += this.vx * dt
    this.z += this.vz * dt

    // --- Drift scoring ---
    const isDrifting = this.speed > 9 && Math.abs(this.driftAngle) > 0.16
    if (isDrifting) {
      this.drifting = true
      this.cooldown = 0.6
      this.driftTimer += dt
      this.multiplier = Math.min(1 + Math.floor(this.driftTimer / 1.6), 6)
      this.pendingScore += this.speed * Math.abs(this.driftAngle) * this.multiplier * dt * 6
    } else {
      if (this.cooldown > 0) {
        this.cooldown -= dt
        if (this.cooldown <= 0) {
          // bank the chain
          this.driftScore += Math.round(this.pendingScore)
          this.pendingScore = 0
          this.driftTimer = 0
          this.multiplier = 1
          this.drifting = false
        }
      } else {
        this.drifting = false
      }
    }
  }

  liveScore() {
    return this.driftScore + Math.round(this.pendingScore)
  }

  /**
   * Resolve a collision by pushing the car out along a normal and scrubbing
   * speed. Also cancels the active drift chain so hits cost you your combo.
   */
  bump(nx: number, nz: number, push: number, speedKill: number) {
    this.x += nx * push
    this.z += nz * push
    this.vx *= speedKill
    this.vz *= speedKill
    // knock a little velocity outward so cars separate cleanly
    this.vx += nx * 4
    this.vz += nz * 4
    // lose the pending drift chain on impact
    this.pendingScore = 0
    this.driftTimer = 0
    this.multiplier = 1
    this.drifting = false
    this.cooldown = 0
    
    // Check if it's a hard crash
    if (speedKill < 0.8) {
      this.crashed = true
      this.crashTimer = 1.0 // spin out for 1 second
    }
  }
}
