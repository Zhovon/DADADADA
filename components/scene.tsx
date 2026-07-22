"use client"

import { useMemo, useRef, useEffect, useState, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { createTrack, queryTrack } from "@/lib/track"
import { CarPhysics } from "@/lib/car-physics"
import { loadBestLap, saveBestLap, type HudState } from "@/lib/game-store"
import { useControls } from "@/lib/use-controls"
import { Car } from "./car"
import { TrackMesh } from "./track-mesh"
import { EnvironmentDecor } from "./environment-decor"
import { Environment } from "@react-three/drei"
import { getLevel } from "@/lib/levels"
import { getCar } from "@/lib/cars"
import { Traffic } from "@/lib/traffic"
import { TrafficCars } from "./traffic-cars"
import { Opponents } from "@/lib/opponents"
import { OpponentCars } from "./opponent-cars"

interface SceneProps {
  phase: "menu" | "playing" | "win"
  runId: number
  hud: RefObject<HudState>
  levelId: string
  carId: string
  onWin?: () => void
}

const GATES = [0.25, 0.5, 0.75]
const LAPS_TO_WIN = 3

export function Scene({ phase, runId, hud, levelId, carId, onWin }: SceneProps) {
  const level = useMemo(() => getLevel(levelId), [levelId])
  const carModel = useMemo(() => getCar(carId), [carId])
  const track = useMemo(() => createTrack(level.shape), [level])
  const traffic = useMemo(
    () => new Traffic(track, level.trafficCount, level.trafficSpeed, level.shape.seed),
    [track, level],
  )
  const opponents = useMemo(
    () => new Opponents(track, level.shape.seed),
    [track, level],
  )
  const car = useMemo(() => new CarPhysics(carModel.tuning), [carModel])
  const readInput = useControls()
  const camera = useThree((s) => s.camera)

  const carGroup = useRef<THREE.Group>(null)
  const steerRef = useRef(0)
  const speedRef = useRef(0)

  // lap / timing state (kept in refs, no re-render churn)
  const gameTime = useRef(0)
  const lapStartMs = useRef(0)
  const nextGate = useRef(0)
  const prevFrac = useRef(0)
  // continuous laps+frac progress for ranking; the gate-based lap counter
  // can't be used because it only advances at the finish line
  const playerProgress = useRef(0)
  const accumulator = useRef(0)
  const started = useRef(false)

  // camera mode toggle
  const [cameraMode, setCameraMode] = useState<"chase" | "pov">("pov")
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyV") setCameraMode(m => m === "chase" ? "pov" : "chase")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // (re)initialise on run change
  useEffect(() => {
    car.reset(track.startPos.x, track.startPos.z, track.startAngle)
    gameTime.current = 0
    lapStartMs.current = 0
    nextGate.current = 0
    started.current = true // Start immediately
    prevFrac.current = queryTrack(track, car.x, car.z).frac
    playerProgress.current = 0
    hud.current.lap = 1 // Start on lap 1
    hud.current.totalLaps = LAPS_TO_WIN
    hud.current.racers = opponents.cars.length + 1
    hud.current.position = opponents.cars.length + 1 // grid start: opponents ahead
    hud.current.currentLapMs = 0
    hud.current.lastLapMs = 0
    hud.current.bestLapMs = loadBestLap(level.id)
    hud.current.driftScore = 0
    hud.current.multiplier = 1
    hud.current.speed = 0
    hud.current.drifting = false
    traffic.reset()
    opponents.reset()

    if (carGroup.current) {
      carGroup.current.position.set(car.x, 0, car.z)
      carGroup.current.rotation.set(0, car.angle, 0)
    }
    // place camera immediately behind the car
    const fwd = new THREE.Vector3(Math.sin(car.angle), 0, Math.cos(car.angle))
    camera.position.set(
      car.x - fwd.x * 14,
      9,
      car.z - fwd.z * 14,
    )
    camera.lookAt(car.x, 1.5, car.z)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)

    if (phase === "playing") {
      const input = readInput()
      steerRef.current = input.steer

      // fixed-timestep physics for stability
      accumulator.current += delta
      const fixed = 1 / 120
      let steps = 0
      while (accumulator.current >= fixed && steps < 6) {
        const q = queryTrack(track, car.x, car.z)
        car.step(fixed, input, q.offTrack)
        accumulator.current -= fixed
        steps++
      }
      
      traffic.update(delta)
      opponents.update(delta)

      // --- Collisions ---
      const collideDist = 2.4
      for (const t of traffic.cars) {
        const dx = car.x - t.x
        const dz = car.z - t.z
        const dist = Math.hypot(dx, dz)
        if (dist < collideDist) {
          const tVx = Math.sin(t.angle) * t.speed
          const tVz = Math.cos(t.angle) * t.speed
          const relV = Math.hypot(car.vx - tVx, car.vz - tVz)
          const speedKill = relV > 45 ? 0.4 : 0.85 // only hard crash on high speed diff
          car.bump(dx / dist, dz / dist, collideDist - dist, speedKill)
        }
      }
      for (let i = 0; i < opponents.cars.length; i++) {
        const o = opponents.cars[i]
        const dx = car.x - o.x
        const dz = car.z - o.z
        const dist = Math.hypot(dx, dz)
        if (dist < collideDist) {
          const oVx = Math.sin(o.angle) * o.speed
          const oVz = Math.cos(o.angle) * o.speed
          const relV = Math.hypot(car.vx - oVx, car.vz - oVz)
          const speedKill = relV > 45 ? 0.6 : 0.9 // only hard crash on high speed diff
          car.bump(dx / dist, dz / dist, collideDist - dist, speedKill)
          opponents.bump(i, speedKill)
        }
      }

      gameTime.current += delta * 1000
      speedRef.current = car.speed

      // --- lap / gate tracking ---
      const q = queryTrack(track, car.x, car.z)
      const frac = q.frac
      const pf = prevFrac.current
      const moving = car.speed > 2

      // wrap-corrected delta keeps progress continuous across the finish line
      let df = frac - pf
      if (df > 0.5) df -= 1
      else if (df < -0.5) df += 1
      playerProgress.current += df
      if (moving) {
        if (nextGate.current < GATES.length) {
          const g = GATES[nextGate.current]
          if (pf < g && frac >= g && frac - pf < 0.5) {
            nextGate.current++
          }
        } else {
          // waiting to cross the finish line (wrap from high frac to low)
          if (pf > 0.7 && frac < 0.3) {
            const lapMs = gameTime.current - lapStartMs.current
            hud.current.lastLapMs = lapMs
            if (hud.current.bestLapMs === 0 || lapMs < hud.current.bestLapMs) {
              hud.current.bestLapMs = lapMs
              saveBestLap(level.id, lapMs)
            }
            hud.current.lap += 1
            if (hud.current.lap > LAPS_TO_WIN) {
              onWin?.()
            }
            
            lapStartMs.current = gameTime.current
            nextGate.current = 0
          }
        }
      }
      prevFrac.current = frac

      // publish HUD values
      hud.current.speed = car.speed * 3.0 // arcade "km/h"
      hud.current.currentLapMs = started.current
        ? gameTime.current - lapStartMs.current
        : 0
      hud.current.driftScore = car.liveScore()
      hud.current.multiplier = car.multiplier
      hud.current.drifting = car.drifting

      let position = 1
      for (const o of opponents.cars) {
        if (o.laps + o.frac > playerProgress.current) position++
      }
      hud.current.position = position
    } else {
      speedRef.current = 0
    }

    // --- update car mesh transform ---
    if (carGroup.current) {
      carGroup.current.position.set(car.x, 0, car.z)
      carGroup.current.rotation.y = car.angle
      // body roll into the drift + subtle
      const targetRoll = THREE.MathUtils.clamp(-car.driftAngle * 0.35, -0.28, 0.28)
      carGroup.current.rotation.z +=
        (targetRoll - carGroup.current.rotation.z) * Math.min(1, delta * 8)
    }

    // --- Camera ---
    const fwd = new THREE.Vector3(Math.sin(car.angle), 0, Math.cos(car.angle))
    if (cameraMode === "chase") {
      const speedPull = Math.min(car.speed / 48, 1) * 3
      const desired = new THREE.Vector3(
        car.x - fwd.x * (13 + speedPull),
        8.5,
        car.z - fwd.z * (13 + speedPull),
      )
      const k = 1 - Math.exp(-6 * delta)
      camera.position.lerp(desired, k)
      const look = new THREE.Vector3(car.x + fwd.x * 6, 1.6, car.z + fwd.z * 6)
      camera.lookAt(look)
    } else {
      // POV
      const lx = -0.35 // driver seat left
      const lz = -0.7  // push back into the seat
      const headX = car.x + Math.cos(car.angle) * lx + fwd.x * lz
      const headZ = car.z - Math.sin(car.angle) * lx + fwd.z * lz
      const head = new THREE.Vector3(headX, 0.8, headZ)
      camera.position.copy(head)
      const look = new THREE.Vector3(car.x + fwd.x * 10, 0.7, car.z + fwd.z * 10)
      camera.lookAt(look)
    }
  })

  return (
    <group>
      <color attach="background" args={[level.palette.sky]} />
      <fogExp2 attach="fog" args={[level.palette.sky, 0.0016]} />

      <hemisphereLight args={[level.palette.hemiSky, level.palette.hemiGround, 0.85]} />
      <directionalLight
        castShadow
        position={[60, 90, 30]}
        intensity={2.1}
        color={level.palette.sunColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-bias={-0.0004}
      />
      <ambientLight intensity={0.35} />
      <Environment preset="city" />

      <TrackMesh track={track} palette={level.palette} />
      <EnvironmentDecor track={track} palette={level.palette} />
      <TrafficCars traffic={traffic} />
      <OpponentCars opponents={opponents} />

      <group ref={carGroup}>
        <Car
          steerRef={steerRef}
          speedRef={speedRef}
          variant={carModel.variant}
          colors={{ body: carModel.body, cabin: carModel.cabin, accent: carModel.accent }}
          povMode={cameraMode === "pov"}
        />
      </group>
    </group>
  )
}
