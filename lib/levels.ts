import type { TrackShape } from "./track"

/** Colors that theme a level's world and track dressing. */
export interface LevelPalette {
  sky: string // background + fog
  ground: string
  road: string
  centerLine: [string, string]
  curb: [string, string]
  treeTops: string[]
  rocks: string[]
  hemiSky: string
  hemiGround: string
  sunColor: string
}

export interface Level {
  id: string
  name: string
  tagline: string
  difficulty: "Easy" | "Medium" | "Hard"
  shape: TrackShape
  palette: LevelPalette
  trafficCount: number
  trafficSpeed: [number, number] // min/max arc speed (u/s)
  decorDensity: number
}

export const LEVELS: Level[] = [
  {
    id: "sakura",
    name: "Sakura Loop",
    tagline: "A breezy, wide-open circuit to warm up your drifts.",
    difficulty: "Easy",
    shape: { seed: 1, baseR: 80, controlCount: 20, xStretch: 1.28, halfWidth: 8, mod: [0.24, 0.12, 0.05] },
    palette: {
      sky: "#cfe8f2",
      ground: "#b7e2b1",
      road: "#8f8aa8",
      centerLine: ["#f7f4ef", "#c9c3e0"],
      curb: ["#ff7a8a", "#f7f4ef"],
      treeTops: ["#f7b7d2", "#f9c9dd", "#8fd39a", "#c9e79c"],
      rocks: ["#c7c2d6", "#b9b4c9", "#d4cfe0"],
      hemiSky: "#eaf4ff",
      hemiGround: "#9fd39a",
      sunColor: "#fff4e0",
    },
    trafficCount: 5,
    trafficSpeed: [16, 22],
    decorDensity: 150,
  },
  {
    id: "mint",
    name: "Mint Sweepers",
    tagline: "Tighter sweepers and denser traffic. Keep your line clean.",
    difficulty: "Medium",
    shape: { seed: 5, baseR: 74, controlCount: 24, xStretch: 1.12, halfWidth: 7, mod: [0.34, 0.18, 0.1] },
    palette: {
      sky: "#d6f0ea",
      ground: "#a8e0c8",
      road: "#7f88a0",
      centerLine: ["#fbfaf5", "#a9d8cf"],
      curb: ["#4fbfa5", "#fbfaf5"],
      treeTops: ["#7ececa", "#8fd39a", "#a7dda0", "#bfe7d4"],
      rocks: ["#c2cdc9", "#b0bcbb", "#d2dbd7"],
      hemiSky: "#e6fbff",
      hemiGround: "#8fd3b8",
      sunColor: "#fff1dc",
    },
    trafficCount: 8,
    trafficSpeed: [18, 26],
    decorDensity: 170,
  },
  {
    id: "dusk",
    name: "Dusk Circuit",
    tagline: "Narrow, twisty and packed. Only the boldest drifters survive.",
    difficulty: "Hard",
    shape: { seed: 11, baseR: 70, controlCount: 26, xStretch: 1.34, halfWidth: 6.2, mod: [0.4, 0.2, 0.13] },
    palette: {
      sky: "#e7d6ec",
      ground: "#c3b2d0",
      road: "#6b647f",
      centerLine: ["#fdeede", "#e0b7c9"],
      curb: ["#ff9a6b", "#fdeede"],
      treeTops: ["#d8a7e0", "#c58fd3", "#f4b78a", "#e79cc9"],
      rocks: ["#b7add0", "#a99ec4", "#cabfe0"],
      hemiSky: "#f6e8ff",
      hemiGround: "#b89fd3",
      sunColor: "#ffdcc0",
    },
    trafficCount: 11,
    trafficSpeed: [20, 30],
    decorDensity: 190,
  },
]

export function getLevel(id: string): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}
