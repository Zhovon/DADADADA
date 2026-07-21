import { sampleAtFrac, type Track } from "./track"
import type { CarVariant } from "./cars"

export interface OpponentCar {
  frac: number // progress around loop (0..1)
  lane: number // signed lateral offset from centerline
  baseSpeed: number
  speed: number // current speed
  variant: CarVariant
  body: string
  cabin: string
  accent: string
  x: number
  z: number
  angle: number
  crashed: boolean
  crashTimer: number
}

const VARIANTS: CarVariant[] = ["hypercar", "roadster", "hypercar"]
const BODIES = ["#ff2a2a", "#2a2aff", "#2aff2a", "#ffff2a"]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Opponents {
  cars: OpponentCar[] = []
  private track: Track
  private seed: number

  constructor(track: Track, seed: number) {
    this.track = track
    this.seed = seed
    this.reset()
  }

  reset() {
    const rand = mulberry32(this.seed + 100)
    this.cars = []
    
    // Spawn 3 competitive racers
    for (let i = 0; i < 3; i++) {
      // Start them just ahead of the player on the grid
      const frac = 0.02 + (i * 0.01)
      const lane = (i % 2 === 0 ? -1 : 1) * 3
      
      const car: OpponentCar = {
        frac,
        lane,
        // High speeds! (in world units, 90 u/s is ~270 km/h)
        baseSpeed: 85 + rand() * 15,
        speed: 0,
        variant: VARIANTS[Math.floor(rand() * VARIANTS.length)],
        body: BODIES[i % BODIES.length],
        cabin: "#111111",
        accent: "#ffffff",
        x: 0,
        z: 0,
        angle: 0,
        crashed: false,
        crashTimer: 0
      }
      this.place(car)
      this.cars.push(car)
    }
  }

  private place(car: OpponentCar) {
    const s = sampleAtFrac(this.track, car.frac)
    car.x = s.pos.x + s.right.x * car.lane
    car.z = s.pos.z + s.right.z * car.lane
    car.angle = Math.atan2(s.dir.x, s.dir.z)
  }

  update(dt: number) {
    const len = this.track.totalLength
    
    for (const car of this.cars) {
      if (car.crashed) {
        car.crashTimer -= dt
        if (car.crashTimer <= 0) {
          car.crashed = false
        } else {
          // Spinning out
          car.angle += 10 * dt
          car.speed *= Math.exp(-2 * dt)
          car.frac = (car.frac + (car.speed * dt) / len) % 1
          this.place(car)
          continue
        }
      }
      
      // Accelerate towards base speed
      if (car.speed < car.baseSpeed) {
        car.speed += 30 * dt
      }
      
      // Move towards racing line (center of track, lane = 0)
      if (Math.abs(car.lane) > 0.1) {
        car.lane -= Math.sign(car.lane) * 2 * dt
      }
      
      car.frac = (car.frac + (car.speed * dt) / len) % 1
      this.place(car)
    }
  }

  bump(index: number, speedKill: number) {
    const car = this.cars[index]
    if (!car) return
    car.speed *= speedKill
    if (speedKill < 0.8) {
      car.crashed = true
      car.crashTimer = 1.2
    }
  }
}
