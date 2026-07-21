"use client"

import { useMemo } from "react"
import * as THREE from "three"
import type { Track } from "@/lib/track"
import type { LevelPalette } from "@/lib/levels"

function buildRibbon(
  track: Track,
  innerOffset: number,
  outerOffset: number,
  y: number,
  stripe?: [THREE.ColorRepresentation, THREE.ColorRepresentation],
): THREE.BufferGeometry {
  const { samples } = track
  const n = samples.length
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  const cA = stripe ? new THREE.Color(stripe[0]) : null
  const cB = stripe ? new THREE.Color(stripe[1]) : null

  for (let i = 0; i < n; i++) {
    const s = samples[i]
    positions.push(
      s.pos.x + s.right.x * innerOffset,
      y,
      s.pos.z + s.right.z * innerOffset,
    )
    positions.push(
      s.pos.x + s.right.x * outerOffset,
      y,
      s.pos.z + s.right.z * outerOffset,
    )
    if (stripe) {
      const c = i % 2 === 0 ? cA! : cB!
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b)
    }
  }

  for (let i = 0; i < n; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = ((i + 1) % n) * 2
    const d = ((i + 1) % n) * 2 + 1
    indices.push(a, c, d, a, d, b)
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  if (stripe) {
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  }
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

export function TrackMesh({ track, palette }: { track: Track; palette: LevelPalette }) {
  const hw = track.halfWidth

  const roadGeom = useMemo(
    () => buildRibbon(track, -hw, hw, 0.03),
    [track, hw],
  )
  const centerLineGeom = useMemo(
    () => buildRibbon(track, -0.18, 0.18, 0.05, palette.centerLine),
    [track, palette],
  )
  const curbLeftGeom = useMemo(
    () => buildRibbon(track, -hw - 1, -hw, 0.06, palette.curb),
    [track, hw, palette],
  )
  const curbRightGeom = useMemo(
    () => buildRibbon(track, hw, hw + 1, 0.06, palette.curb),
    [track, hw, palette],
  )

  const startLineGeom = useMemo(() => {
    // checkered band across the road at the start line (non-indexed for per-quad color)
    const s0 = track.samples[0]
    const s1 = track.samples[3]
    const positions: number[] = []
    const colors: number[] = []
    const cols = 8
    const white = new THREE.Color(palette.centerLine[0])
    const dark = new THREE.Color("#3a3550")

    const point = (base: (typeof track.samples)[number], off: number) =>
      [base.pos.x + base.right.x * off, 0.07, base.pos.z + base.right.z * off] as const

    for (let c = 0; c < cols; c++) {
      const o0 = -hw + (c / cols) * hw * 2
      const o1 = -hw + ((c + 1) / cols) * hw * 2
      const a = point(s0, o0)
      const b = point(s0, o1)
      const d = point(s1, o0)
      const e = point(s1, o1)
      // two triangles: a,d,e and a,e,b
      positions.push(...a, ...d, ...e, ...a, ...e, ...b)
      const col = c % 2 === 0 ? dark : white
      for (let k = 0; k < 6; k++) colors.push(col.r, col.g, col.b)
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [track, hw, palette])

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[track.boundsRadius, 48]} />
        <meshStandardMaterial color={palette.ground} flatShading />
      </mesh>

      {/* road */}
      <mesh geometry={roadGeom} receiveShadow>
        <meshStandardMaterial color={palette.road} flatShading roughness={0.95} />
      </mesh>

      {/* dashed-ish center line */}
      <mesh geometry={centerLineGeom}>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} />
      </mesh>

      {/* curbs */}
      <mesh geometry={curbLeftGeom}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
      <mesh geometry={curbRightGeom}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>

      {/* start / finish */}
      <mesh geometry={startLineGeom}>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} />
      </mesh>
    </group>
  )
}
