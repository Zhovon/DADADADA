// Mutable, ref-shared HUD state. The scene writes to it every frame and the
// HUD reads it on its own animation frame, avoiding React re-renders at 60fps.
export interface HudState {
  speed: number // km/h-ish display value
  lap: number
  totalLaps: number
  position: number // 1-based race position
  racers: number // total cars in the race (player + opponents)
  currentLapMs: number
  lastLapMs: number
  bestLapMs: number
  driftScore: number
  multiplier: number
  drifting: boolean
}

export function createHudState(): HudState {
  return {
    speed: 0,
    lap: 0,
    totalLaps: 1,
    position: 1,
    racers: 1,
    currentLapMs: 0,
    lastLapMs: 0,
    bestLapMs: 0,
    driftScore: 0,
    multiplier: 1,
    drifting: false,
  }
}

// Best lap times persist per track. Guarded for SSR and private-mode storage.
const bestLapKey = (levelId: string) => `pastel-drift:best-lap:${levelId}`

export function loadBestLap(levelId: string): number {
  if (typeof window === "undefined") return 0
  try {
    const v = Number(window.localStorage.getItem(bestLapKey(levelId)))
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch {
    return 0
  }
}

export function saveBestLap(levelId: string, ms: number) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(bestLapKey(levelId), String(Math.round(ms)))
  } catch {
    // storage unavailable; best lap just won't persist
  }
}

export function formatTime(ms: number): string {
  if (!ms || ms <= 0) return "--:--.---"
  const totalMs = Math.floor(ms)
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const millis = totalMs % 1000
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis
    .toString()
    .padStart(3, "0")}`
}
