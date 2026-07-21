export type CarVariant = "coupe" | "roadster" | "van" | "buggy" | "hypercar"

/** Multipliers applied on top of the base arcade physics. */
export interface CarTuning {
  accel: number
  maxSpeed: number
  grip: number
  driftGrip: number
}

export interface CarModel {
  id: string
  name: string
  variant: CarVariant
  body: string
  cabin: string
  accent: string
  tuning: CarTuning
  // 0..5 bar ratings for the menu
  stats: { speed: number; accel: number; grip: number; drift: number }
}

export const CARS: CarModel[] = [
  {
    id: "blossom",
    name: "Blossom GT",
    variant: "coupe",
    body: "#ff8fb1",
    cabin: "#fff1f6",
    accent: "#3a3550",
    tuning: { accel: 1, maxSpeed: 1, grip: 1, driftGrip: 1 },
    stats: { speed: 4, accel: 4, grip: 4, drift: 4 },
  },
  {
    id: "zephyr",
    name: "Zephyr Roadster",
    variant: "roadster",
    body: "#7ec8e3",
    cabin: "#eafaff",
    accent: "#2a3550",
    tuning: { accel: 1.12, maxSpeed: 1.14, grip: 0.92, driftGrip: 0.9 },
    stats: { speed: 5, accel: 5, grip: 3, drift: 5 },
  },
  {
    id: "meadow",
    name: "Meadow Van",
    variant: "van",
    body: "#a7dda0",
    cabin: "#f2fbee",
    accent: "#3a4535",
    tuning: { accel: 0.86, maxSpeed: 0.9, grip: 1.2, driftGrip: 1.25 },
    stats: { speed: 3, accel: 3, grip: 5, drift: 2 },
  },
  {
    id: "sunny",
    name: "Sunny Buggy",
    variant: "buggy",
    body: "#ffcf6b",
    cabin: "#fff6df",
    accent: "#4a3a2a",
    tuning: { accel: 1.05, maxSpeed: 0.98, grip: 0.85, driftGrip: 0.78 },
    stats: { speed: 4, accel: 4, grip: 2, drift: 5 },
  },
  {
    id: "lambo",
    name: "Veloce Hypercar",
    variant: "hypercar",
    body: "#e6c300",
    cabin: "#111111",
    accent: "#050505",
    tuning: { accel: 1.25, maxSpeed: 1.2, grip: 1.1, driftGrip: 0.95 },
    stats: { speed: 5, accel: 5, grip: 5, drift: 4 },
  },
]

export function getCar(id: string): CarModel {
  return CARS.find((c) => c.id === id) ?? CARS[0]
}
