import * as THREE from "three"

export interface TrackSample {
  pos: THREE.Vector3
  dir: THREE.Vector3 // tangent (normalized, XZ)
  right: THREE.Vector3 // perpendicular to dir in XZ (points to track right side)
  cumLen: number
}

export interface Track {
  samples: TrackSample[]
  totalLength: number
  halfWidth: number
  startPos: THREE.Vector3
  startAngle: number
  boundsRadius: number
}

/** Shape parameters that make each level's circuit distinct. */
export interface TrackShape {
  seed: number
  baseR: number
  controlCount: number
  xStretch: number
  halfWidth: number
  // radial modulation amplitudes (higher = sharper hairpins / sweepers)
  mod: [number, number, number]
}

const DEFAULT_SHAPE: TrackShape = {
  seed: 1,
  baseR: 78,
  controlCount: 22,
  xStretch: 1.28,
  halfWidth: 7,
  mod: [0.3, 0.16, 0.08],
}

/**
 * Generate a smooth, closed, non-self-intersecting circuit using a radial
 * function. A star-convex radius guarantees the loop never crosses itself.
 */
export function createTrack(shape: Partial<TrackShape> = {}): Track {
  const cfg = { ...DEFAULT_SHAPE, ...shape }
  const controls: THREE.Vector3[] = []
  // seed offsets the modulation phases so each level draws a unique layout
  const p = cfg.seed * 1.7

  for (let i = 0; i < cfg.controlCount; i++) {
    const t = (i / cfg.controlCount) * Math.PI * 2
    const r =
      cfg.baseR *
      (1 +
        cfg.mod[0] * Math.sin(3 * t + 0.6 + p) +
        cfg.mod[1] * Math.cos(2 * t + p * 0.5) +
        cfg.mod[2] * Math.sin(5 * t + p))
    const x = Math.cos(t) * r * cfg.xStretch
    const z = Math.sin(t) * r
    controls.push(new THREE.Vector3(x, 0, z))
  }

  const curve = new THREE.CatmullRomCurve3(controls, true, "catmullrom", 0.5)

  const N = 700
  const rawPoints = curve.getSpacedPoints(N) // N+1 pts, last ~= first

  const samples: TrackSample[] = []
  let cumLen = 0
  let boundsRadius = 0

  for (let i = 0; i < N; i++) {
    const pos = rawPoints[i].clone()
    const next = rawPoints[(i + 1) % N]
    const dir = new THREE.Vector3().subVectors(next, pos)
    dir.y = 0
    dir.normalize()
    // right-hand perpendicular in XZ plane
    const right = new THREE.Vector3(dir.z, 0, -dir.x)

    if (i > 0) {
      cumLen += pos.distanceTo(samples[i - 1].pos)
    }
    boundsRadius = Math.max(boundsRadius, Math.hypot(pos.x, pos.z))
    samples.push({ pos, dir, right, cumLen })
  }
  const totalLength = cumLen + samples[N - 1].pos.distanceTo(samples[0].pos)

  const startAngle = Math.atan2(samples[0].dir.x, samples[0].dir.z)

  return {
    samples,
    totalLength,
    halfWidth: cfg.halfWidth,
    startPos: samples[0].pos.clone(),
    startAngle,
    boundsRadius: boundsRadius + 60,
  }
}

export interface TrackQuery {
  index: number
  frac: number // 0..1 progress around loop
  lateral: number // signed distance from centerline (right positive)
  offTrack: boolean
}

/**
 * Find the nearest centerline sample and the signed lateral offset.
 * A linear scan over the samples is cheap enough for one car per frame.
 */
export function queryTrack(track: Track, x: number, z: number): TrackQuery {
  const { samples } = track
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < samples.length; i++) {
    const dx = x - samples[i].pos.x
    const dz = z - samples[i].pos.z
    const d = dx * dx + dz * dz
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  const s = samples[best]
  const dx = x - s.pos.x
  const dz = z - s.pos.z
  const lateral = dx * s.right.x + dz * s.right.z
  return {
    index: best,
    frac: best / samples.length,
    lateral,
    offTrack: Math.abs(lateral) > track.halfWidth,
  }
}

/**
 * Sample an interpolated point along the loop by fractional progress (0..1).
 * Used by AI traffic to advance smoothly around the circuit.
 */
export function sampleAtFrac(
  track: Track,
  frac: number,
): { pos: THREE.Vector3; dir: THREE.Vector3; right: THREE.Vector3 } {
  const n = track.samples.length
  const wrapped = ((frac % 1) + 1) % 1
  const f = wrapped * n
  const i0 = Math.floor(f) % n
  const i1 = (i0 + 1) % n
  const t = f - Math.floor(f)
  const a = track.samples[i0]
  const b = track.samples[i1]
  const pos = a.pos.clone().lerp(b.pos, t)
  const dir = a.dir.clone().lerp(b.dir, t).normalize()
  const right = new THREE.Vector3(dir.z, 0, -dir.x)
  return { pos, dir, right }
}
