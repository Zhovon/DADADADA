// Mutable, ref-shared HUD state. The scene writes to it every frame and the
// HUD reads it on its own animation frame, avoiding React re-renders at 60fps.
export interface HudState {
  speed: number // km/h-ish display value
  lap: number
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
    currentLapMs: 0,
    lastLapMs: 0,
    bestLapMs: 0,
    driftScore: 0,
    multiplier: 1,
    drifting: false,
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
