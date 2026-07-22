"use client"

import { useEffect, useRef, type RefObject } from "react"
import { formatTime, type HudState } from "@/lib/game-store"

export function ordinal(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"
  return `${n}${suffix}`
}

export function Hud({ hud }: { hud: RefObject<HudState> }) {
  const position = useRef<HTMLSpanElement>(null)
  const speed = useRef<HTMLSpanElement>(null)
  const gear = useRef<HTMLSpanElement>(null)
  const lap = useRef<HTMLSpanElement>(null)
  const current = useRef<HTMLSpanElement>(null)
  const last = useRef<HTMLSpanElement>(null)
  const best = useRef<HTMLSpanElement>(null)
  const score = useRef<HTMLSpanElement>(null)
  const mult = useRef<HTMLDivElement>(null)
  const multVal = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const s = hud.current
      if (speed.current) speed.current.textContent = Math.round(s.speed).toString()
      if (gear.current) {
        let g = "1"
        if (s.speed < 20) g = "1"
        else if (s.speed < 60) g = "2"
        else if (s.speed < 120) g = "3"
        else if (s.speed < 200) g = "4"
        else if (s.speed < 270) g = "5"
        else g = "6"
        gear.current.textContent = g
      }
      if (lap.current)
        lap.current.textContent = `${Math.min(s.lap, s.totalLaps)}/${s.totalLaps}`
      if (position.current)
        position.current.textContent = `${ordinal(s.position)} / ${s.racers}`
      if (current.current) current.current.textContent = formatTime(s.currentLapMs)
      if (last.current) last.current.textContent = formatTime(s.lastLapMs)
      if (best.current) best.current.textContent = formatTime(s.bestLapMs)
      if (score.current) score.current.textContent = s.driftScore.toLocaleString()
      if (multVal.current) multVal.current.textContent = s.multiplier.toString()
      if (mult.current) {
        mult.current.style.opacity = s.drifting ? "1" : "0"
        mult.current.style.transform = s.drifting ? "scale(1)" : "scale(0.85)"
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [hud])

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-mono">
      {/* top-left: lap timing */}
      <div className="absolute left-4 top-4 rounded-2xl border border-white/40 bg-[#2a2f45]/70 px-5 py-4 text-white backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-[#9be7c4]">Pos</span>
          <span ref={position} className="text-2xl font-bold tabular-nums">
            -
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-[#ffd0dc]">Lap</span>
          <span ref={lap} className="text-2xl font-bold tabular-nums">
            0
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="w-14 text-xs uppercase tracking-wider text-white/60">Time</span>
          <span ref={current} className="text-xl font-semibold tabular-nums">
            {formatTime(0)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="w-14 text-xs uppercase tracking-wider text-white/60">Last</span>
          <span ref={last} className="text-sm tabular-nums text-white/80">
            {formatTime(0)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="w-14 text-xs uppercase tracking-wider text-[#9be7c4]">Best</span>
          <span ref={best} className="text-sm font-semibold tabular-nums text-[#9be7c4]">
            {formatTime(0)}
          </span>
        </div>
      </div>

      {/* top-right: drift score */}
      <div className="absolute right-4 top-4 rounded-2xl border border-white/40 bg-[#2a2f45]/70 px-5 py-4 text-right text-white backdrop-blur-sm">
        <div className="text-xs uppercase tracking-widest text-[#ffd0dc]">Drift Score</div>
        <div className="mt-1 flex items-baseline justify-end gap-1">
          <span ref={score} className="text-3xl font-bold tabular-nums">
            0
          </span>
        </div>
        <div
          ref={mult}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ff8fb1] px-3 py-1 text-sm font-bold text-[#2a2f45] transition-all duration-150"
          style={{ opacity: 0 }}
        >
          <span>DRIFT</span>
          <span className="tabular-nums">
            x<span ref={multVal}>1</span>
          </span>
        </div>
      </div>

      {/* bottom-right: speedometer */}
      <div className="absolute bottom-4 right-4 rounded-2xl border border-white/40 bg-[#2a2f45]/70 px-5 py-3 text-white backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span ref={speed} className="text-4xl font-bold tabular-nums">
            0
          </span>
          <span className="text-sm text-white/60">km/h</span>
        </div>
        <div className="mt-1 flex items-baseline justify-end gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#ffd0dc]">Gear</span>
          <span ref={gear} className="text-lg font-bold tabular-nums">1</span>
        </div>
      </div>

      {/* bottom-left: controls hint */}
      <div className="absolute bottom-4 left-4 rounded-xl bg-[#2a2f45]/50 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
        <span className="font-semibold text-white">WASD</span> steer ·{" "}
        <span className="font-semibold text-white">Space</span> handbrake drift
      </div>
    </div>
  )
}
