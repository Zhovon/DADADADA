"use client"

import { useMemo } from "react"
import { queryTrack, type Track } from "@/lib/track"

// small deterministic PRNG so decor placement is stable across renders
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Item {
  x: number
  z: number
  s: number
  kind: "tree" | "rock"
  tint: number
}

import type { LevelPalette } from "@/lib/levels"

export function EnvironmentDecor({ track, palette }: { track: Track; palette: LevelPalette }) {
  const items = useMemo<Item[]>(() => {
    const rand = mulberry32(1337)
    const out: Item[] = []
    const R = track.boundsRadius
    let attempts = 0
    while (out.length < 150 && attempts < 4000) {
      attempts++
      const x = (rand() * 2 - 1) * R
      const z = (rand() * 2 - 1) * R
      if (Math.hypot(x, z) > R) continue
      const q = queryTrack(track, x, z)
      // keep clear of the road + curbs
      if (Math.abs(q.lateral) < track.halfWidth + 4) continue
      const kind = rand() > 0.28 ? "tree" : "rock"
      out.push({
        x,
        z,
        s: 0.7 + rand() * 1.5,
        kind,
        tint: Math.floor(rand() * 4),
      })
    }
    return out
  }, [track])

  return (
    <group>
      {items.map((it, i) =>
        it.kind === "tree" ? (
          <group key={i} position={[it.x, 0, it.z]} scale={it.s}>
            <mesh castShadow position={[0, 0.7, 0]}>
              <cylinderGeometry args={[0.18, 0.24, 1.4, 6]} />
              <meshStandardMaterial color="#9c6b4a" flatShading />
            </mesh>
            <mesh castShadow position={[0, 1.9, 0]}>
              <coneGeometry args={[1.1, 1.8, 7]} />
              <meshStandardMaterial color={palette.treeTops[it.tint % palette.treeTops.length]} flatShading />
            </mesh>
            <mesh castShadow position={[0, 2.8, 0]}>
              <coneGeometry args={[0.8, 1.3, 7]} />
              <meshStandardMaterial color={palette.treeTops[(it.tint + 1) % palette.treeTops.length]} flatShading />
            </mesh>
          </group>
        ) : (
          <mesh
            key={i}
            castShadow
            position={[it.x, 0.35 * it.s, it.z]}
            scale={it.s}
            rotation={[0, it.tint, 0]}
          >
            <icosahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial
              color={palette.rocks[it.tint % palette.rocks.length]}
              flatShading
              roughness={0.9}
            />
          </mesh>
        ),
      )}
    </group>
  )
}
