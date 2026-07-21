"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"
import type { Opponents } from "@/lib/opponents"
import { CarBody } from "./car"

export function OpponentCars({ opponents }: { opponents: Opponents }) {
  const groups = useRef<(Group | null)[]>([])

  useFrame(() => {
    for (let i = 0; i < opponents.cars.length; i++) {
      const g = groups.current[i]
      const c = opponents.cars[i]
      if (g) {
        g.position.set(c.x, 0, c.z)
        g.rotation.y = c.angle
      }
    }
  })

  return (
    <group>
      {opponents.cars.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
        >
          <CarBody
            variant={c.variant}
            colors={{ body: c.body, cabin: c.cabin, accent: c.accent }}
          />
        </group>
      ))}
    </group>
  )
}
