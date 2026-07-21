import { sampleAtFrac, type Track } from "./track"
import type { CarVariant } from "./cars"

export interface TrafficCar {
  frac: number // progress around loop (0..1)
  lane: number // signed lateral offset from centerline
  speed: number // arc speed in world units / s
  variant: CarVariant
  body: string
  cabin: string
  accent: string
  // world transform, refreshed each update()
  x: number
  z: number
  angle: number
}

const VARIANTS: CarVariant[] = ["hypercar", "hypercar", "hypercar", "hypercar"]
const BODIES = ["#f6a5c0", "#8fb8e0", "#f2c879", "#9fd9b6", "#c9a7e6", "#e69a9a", "#7fd0cf"]
const CABIN = "#f4f1ea"
const ACCENT = "#3a3550"

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Traffic {
  cars: TrafficCar[] = []
  private track: Track
  private count: number
  private speedRange: [number, number]
  private seed: number

  constructor(track: Track, count: number, speedRange: [number, number], seed: number) {
    this.track = track
    this.count = count
    this.speedRange = speedRange
    this.seed = seed
    this.reset()
  }

  reset() {
    const rand = mulberry32(this.seed)
    const hw = this.track.halfWidth
    this.cars = []
    for (let i = 0; i < this.count; i++) {
      // spread cars around the loop, starting past the player's grid slot
      const frac = 0.12 + (i / this.count) * 0.86 + (rand() - 0.5) * 0.02
      // alternate lanes so a slalom of traffic forms
      const laneSign = i % 2 === 0 ? -1 : 1
      const lane = laneSign * hw * (0.32 + rand() * 0.28)
      const [smin, smax] = this.speedRange
      const speed = smin + rand() * (smax - smin)
      const car: TrafficCar = {
        frac: ((frac % 1) + 1) % 1,
        lane,
        speed,
        variant: VARIANTS[Math.floor(rand() * VARIANTS.length)],
        body: BODIES[Math.floor(rand() * BODIES.length)],
        cabin: CABIN,
        accent: ACCENT,
        x: 0,
        z: 0,
        angle: 0,
      }
      this.place(car)
      this.cars.push(car)
    }
  }

  private place(car: TrafficCar) {
    const s = sampleAtFrac(this.track, car.frac)
    car.x = s.pos.x + s.right.x * car.lane
    car.z = s.pos.z + s.right.z * car.lane
    car.angle = Math.atan2(s.dir.x, s.dir.z)
  }

  update(dt: number) {
    const len = this.track.totalLength
    for (const car of this.cars) {
      car.frac = (car.frac + (car.speed * dt) / len) % 1
      this.place(car)
    }
  }
}
