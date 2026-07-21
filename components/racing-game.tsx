"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { createHudState, formatTime } from "@/lib/game-store"
import { LEVELS } from "@/lib/levels"
import { Scene } from "./scene"
import { Hud } from "./hud"

type Phase = "menu" | "playing" | "win"

export function RacingGame() {
  const [phase, setPhase] = useState<Phase>("menu")
  const [levelId, setLevelId] = useState("sakura")
  const [runId, setRunId] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false)
  const hud = useRef(createHudState())

  const start = useCallback(() => {
    setRunId((id) => id + 1)
    setPhase("playing")
    setHasPlayed(true)
  }, [])

  const handleWin = useCallback(() => {
    setPhase("win")
  }, [])

  const toMenu = useCallback(() => setPhase("menu"), [])

  // Esc -> menu, R -> quick restart while playing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setPhase((p) => (p === "playing" ? "menu" : p))
      if (e.code === "KeyR" && phase === "playing") start()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, start])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#cfe8f2]">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 60, near: 0.5, far: 600, position: [0, 12, 20] }}
      >
        <Scene phase={phase} runId={runId} hud={hud} levelId={levelId} onWin={handleWin} />
      </Canvas>

      {phase === "playing" && (
        <>
          <Hud hud={hud} />
          <button
            onClick={toMenu}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-[#2a2f45]/70 px-3 py-2 font-mono text-xs uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-[#2a2f45]/90"
          >
            Menu
          </button>
        </>
      )}

      {phase === "menu" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#2a2f45]/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-white/50 bg-[#fff1f6]/95 p-8 text-center shadow-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff6f91]">
              Low-Poly Arcade
            </p>
            <h1 className="mt-2 text-balance font-mono text-4xl font-black tracking-tight text-[#2a2f45]">
              PASTEL DRIFT
            </h1>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-[#5b5470]">
              Chain drifts to stack your score multiplier and hunt for the fastest lap
              on the circuit.
            </p>

            {hasPlayed && (
              <div className="mt-6 grid grid-cols-2 gap-3 font-mono">
                <div className="rounded-2xl bg-[#2a2f45] px-4 py-3 text-left text-white">
                  <div className="text-[10px] uppercase tracking-widest text-[#9be7c4]">
                    Best Lap
                  </div>
                  <div className="text-lg font-bold tabular-nums">
                    {formatTime(hud.current.bestLapMs)}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#2a2f45] px-4 py-3 text-left text-white">
                  <div className="text-[10px] uppercase tracking-widest text-[#ffd0dc]">
                    Drift Score
                  </div>
                  <div className="text-lg font-bold tabular-nums">
                    {hud.current.driftScore.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 text-left">
              <div className="text-[10px] uppercase tracking-widest text-[#5b5470] font-bold">Select Track</div>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevelId(l.id)}
                    className={`rounded-xl border-2 px-2 py-3 transition ${
                      levelId === l.id
                        ? "border-[#ff6f91] bg-[#ff6f91]/10"
                        : "border-transparent bg-white/50 hover:bg-white/80"
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-[#2a2f45]">{l.name}</div>
                    <div className="mt-1 text-[9px] text-[#5b5470] line-clamp-2">{l.tagline}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={start}
              className="mt-7 w-full rounded-2xl bg-[#ff6f91] px-6 py-4 font-mono text-lg font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#ff5580] active:scale-[0.98]"
            >
              {hasPlayed ? "Restart" : "Start Race"}
            </button>

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-left font-mono text-xs text-[#5b5470]">
              <div>
                <span className="font-bold text-[#2a2f45]">W / ↑</span> accelerate
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">S / ↓</span> brake / reverse
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">A D / ← →</span> steer
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">Space</span> handbrake drift
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">V</span> camera
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">R</span> restart
              </div>
              <div>
                <span className="font-bold text-[#2a2f45]">Esc</span> menu
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
