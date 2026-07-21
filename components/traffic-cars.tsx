"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"
import type { Traffic } from "@/lib/traffic"
import { CarBody } from "./car"

/**
 * Renders AI traffic. The `Traffic` instance is advanced by the Scene each
 * frame; here we simply mirror the stored world transforms onto the meshes.
 */
export function TrafficCars({ traffic }: { traffic: Traffic }) {
  const groups = useRef<(Group | null)[]>([])

  useFrame(() => {
    for (let i = 0; i < traffic.cars.length; i++) {
      const g = groups.current[i]
      const c = traffic.cars[i]
      if (g) {
        g.position.set(c.x, 0, c.z)
        g.rotation.y = c.angle
      }
    }
  })

  return (
    <group>
      {traffic.cars.map((c, i) => (
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
