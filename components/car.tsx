import { useRef, type RefObject } from "react"
import { useFrame } from "@react-three/fiber"
import { RoundedBox, useGLTF } from "@react-three/drei"
import type { Group, Mesh } from "three"
import type { CarVariant } from "@/lib/cars"

interface CarColors {
  body: string
  cabin: string
  accent: string
}

interface VariantSpec {
  bodyW: number
  bodyH: number
  bodyLen: number
  bodyY: number
  wheelR: number
  wheelBase: number // |z| of each axle
  trackW: number // |x| of each wheel
}

const SPECS: Record<CarVariant, VariantSpec> = {
  coupe: { bodyW: 1.9, bodyH: 0.55, bodyLen: 4, bodyY: 0.55, wheelR: 0.55, wheelBase: 1.35, trackW: 1.02 },
  roadster: { bodyW: 1.82, bodyH: 0.45, bodyLen: 4.1, bodyY: 0.48, wheelR: 0.52, wheelBase: 1.42, trackW: 1.0 },
  van: { bodyW: 2.02, bodyH: 0.8, bodyLen: 4.2, bodyY: 0.62, wheelR: 0.56, wheelBase: 1.5, trackW: 1.06 },
  buggy: { bodyW: 1.78, bodyH: 0.5, bodyLen: 3.7, bodyY: 0.62, wheelR: 0.66, wheelBase: 1.32, trackW: 1.08 },
  hypercar: { bodyW: 2.0, bodyH: 0.35, bodyLen: 4.4, bodyY: 0.42, wheelR: 0.35, wheelBase: 1.45, trackW: 1.05 },
}

export function FerrariModel({ povMode, frontAxleRef, wheelRefs = [], steeringWheelRef }: any) {
  const { nodes, materials } = useGLTF('/ferrari.glb') as any

  return (
    <group rotation={[0, Math.PI, 0]} position={[0, -0.3, 0.3]} scale={0.9}>
      <group position={[0, 0.676, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <mesh geometry={nodes.trim.geometry} material={materials.Leather_red} position={[-0.379, -0.004, -0.016]} />
        <mesh geometry={nodes.lights_red.geometry} material={materials.Taillight_Glass} position={[0.913, -0.004, -0.006]} />
        <mesh geometry={nodes.plastic_gray.geometry} material={materials.plastic_gray} position={[0.108, -0.001, -0.029]} />
        <mesh geometry={nodes.metal.geometry} material={materials.metal_gray} position={[0.218, -0.005, -0.002]} />
        <mesh geometry={nodes.lights.geometry} material={materials.Projector_Glass} position={[-1.845, -0.002, -0.067]} />
        <mesh geometry={nodes.leds.geometry} material={materials.Turn_Signal_LED} position={[-1.265, -0.001, 0.022]} />
        <mesh geometry={nodes.leather.geometry} material={materials.Leather} position={[-0.348, -0.002, -0.031]} />
        <mesh geometry={nodes.interior_light.geometry} material={materials.Interior_dark} position={[0.005, -0.004, -0.004]} />
        <mesh geometry={nodes.grills.geometry} material={materials.Tires} position={[0.048, -0.007, -0.033]} />
        {!povMode && <mesh geometry={nodes.glass.geometry} material={materials.Glass_Gray} position={[0.001, -0.002, 0.194]} />}
        <mesh geometry={nodes.chrome.geometry} material={materials.metal_chrome} position={[0.033, 0, 0.007]} />
        <mesh geometry={nodes.carpet.geometry} material={materials.Carpet} position={[-0.281, -0.004, -0.235]} />
        <mesh geometry={nodes.carbon_fibre_trim.geometry} material={materials.Carbon_Fiber} position={[-0.177, -0.002, -0.04]} />
        <mesh geometry={nodes.carbon_fibre.geometry} material={materials.Carbon_Fiber} position={[-0.438, -0.346, 0.118]} />
        <mesh geometry={nodes.brakes.geometry} material={materials.Taillight_Glass} position={[1.989, -0.004, 0.2]} />
        <mesh geometry={nodes.interior_dark.geometry} material={materials.Interior_light} position={[0.003, 0, 0.011]} />
        <mesh geometry={nodes.body.geometry} material={materials.Body_Color} position={[-0.005, 0, 0.022]} />
        <mesh geometry={nodes.blue.geometry} material={materials._0098_DodgerBlue} position={[-0.35, -0.435, 0.068]} />
        <mesh geometry={nodes.wipers.geometry} material={materials.Tires} position={[-1.089, 0.006, 0.11]} />
        <mesh geometry={nodes.yellow_trim.geometry} material={materials.Ferrari_Yellow} position={[-1.397, -0.003, 0.047]} />
      </group>
      
      {/* Rear Left */}
      <group position={[-0.821, 0.358, 1.495]} rotation={[-Math.PI / 2, 0, 0]} ref={wheelRefs[0]}>
        <mesh geometry={nodes.tire_1.geometry} material={materials.Tires} position={[0.006, 0, 0]} />
        <mesh geometry={nodes.brake_1.geometry} material={materials.metal_gray} position={[-0.018, -0.001, -0.001]} />
        <mesh geometry={nodes.centre_1.geometry} material={materials.Ferrari_Yellow} position={[-0.113, 0, -0.001]} />
        <mesh geometry={nodes.wheel_1.geometry} material={materials.metal_gray} position={[0, 0, -0.001]} />
        <mesh geometry={nodes.rim_rl.geometry} material={materials.metal_gray} position={[-0.125, 0, -0.001]} />
        <mesh geometry={nodes.nuts_1.geometry} material={materials.Interior_dark} position={[-0.103, 0, 0.006]} />
      </group>

      {/* Rear Right */}
      <group position={[0.824, 0.358, 1.496]} rotation={[-Math.PI / 2, 0, 0]} ref={wheelRefs[1]}>
        <mesh geometry={nodes.wheel.geometry} material={materials.metal_gray} position={[0, 0, -0.001]} />
        <mesh geometry={nodes.tire.geometry} material={materials.Tires} position={[-0.005, 0, 0]} />
        <mesh geometry={nodes.rim_rr.geometry} material={materials.metal_gray} position={[0.125, 0, -0.001]} />
        <mesh geometry={nodes.centre.geometry} material={materials.Ferrari_Yellow} position={[0.113, 0, -0.001]} />
        <mesh geometry={nodes.brake.geometry} material={materials.metal_gray} position={[0.009, 0.001, -0.001]} />
        <mesh geometry={nodes.nuts.geometry} material={materials.Interior_dark} position={[0.103, 0, 0.006]} />
      </group>

      {/* Front Axle (Steering) */}
      <group ref={frontAxleRef} position={[0, 0.358, -1.155]}>
        {/* Front Left */}
        <group position={[-0.843, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={wheelRefs[2]}>
          <mesh geometry={nodes.rim_fl.geometry} material={materials.metal_gray} position={[-0.114, 0, -0.001]} />
          <mesh geometry={nodes.brake_2.geometry} material={materials.metal_gray} position={[-0.002, -0.001, -0.001]} />
          <mesh geometry={nodes.centre_2.geometry} material={materials.Ferrari_Yellow} position={[-0.102, 0, -0.001]} />
          <mesh geometry={nodes.nuts_2.geometry} material={materials.Interior_dark} position={[-0.094, 0, 0.006]} />
          <mesh geometry={nodes.wheel_2.geometry} material={materials.metal_gray} position={[0, 0, -0.001]} />
          <mesh geometry={nodes.tire_2.geometry} material={materials.Tires} position={[0.005, 0, 0]} />
        </group>
        {/* Front Right */}
        <group position={[0.829, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={wheelRefs[3]}>
          <mesh geometry={nodes.brake_3.geometry} material={materials.metal_gray} position={[0.001, 0, -0.001]} />
          <mesh geometry={nodes.centre_3.geometry} material={materials.Ferrari_Yellow} position={[0.102, 0, -0.001]} />
          <mesh geometry={nodes.wheel_3.geometry} material={materials.metal_gray} position={[0, 0, -0.001]} />
          <mesh geometry={nodes.rim_fr.geometry} material={materials.metal_gray} position={[0.114, 0, -0.001]} />
          <mesh geometry={nodes.tire_3.geometry} material={materials.Tires} position={[-0.005, 0, 0]} />
          <mesh geometry={nodes.nuts_3.geometry} material={materials.Interior_dark} position={[0.094, 0, 0.006]} />
        </group>
      </group>

      {/* Steering wheel (POV) */}
      <group position={[-0.346, 0.799, -0.346]} rotation={[-1.92, 0, 0]}>
        <group ref={steeringWheelRef}>
          <mesh geometry={nodes.steering_carbon.geometry} material={materials.Carbon_Fiber} position={[0, 0.016, 0.006]} rotation={[Math.PI / 9, 0, 0]} />
          <mesh geometry={nodes.steering_centre.geometry} material={materials.Ferrari_Yellow} rotation={[0, 0, Math.PI]} />
          <mesh geometry={nodes.steering_column.geometry} material={materials.Interior_dark} position={[0, 0.068, -0.015]} rotation={[Math.PI / 9, 0, 0]} />
          <mesh geometry={nodes.steering_leather.geometry} material={materials.Leather} position={[0, 0.015, 0.007]} rotation={[Math.PI / 9, 0, 0]} />
          <mesh geometry={nodes.steering_metal.geometry} material={materials.metal_gray} position={[0.086, 0.021, -0.066]} rotation={[Math.PI / 9, 0, 0]} />
          <mesh geometry={nodes.steering_red_lights.geometry} material={materials.Taillight_Glass} position={[0.006, 0.02, -0.072]} rotation={[Math.PI / 9, 0, 0]} />
          <mesh geometry={nodes.steering_trim.geometry} material={materials.Leather_red} position={[0, 0.016, -0.075]} rotation={[Math.PI / 9, 0, 0]} />
        </group>
      </group>
    </group>
  )
}
useGLTF.preload('/ferrari.glb')

function Wheel({
  spec,
  x,
  refObj,
}: {
  spec: VariantSpec
  x: number
  refObj?: RefObject<Mesh | null>
}) {
  return (
    <mesh ref={refObj} castShadow position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[spec.wheelR, spec.wheelR, 0.42, 10]} />
      <meshStandardMaterial color="#2f2b42" flatShading roughness={0.85} />
    </mesh>
  )
}

interface CarBodyProps {
  variant: CarVariant
  colors: CarColors
  povMode?: boolean
  frontAxleRef?: RefObject<Group | null>
  wheelRefs?: [
    RefObject<Mesh | null>,
    RefObject<Mesh | null>,
    RefObject<Mesh | null>,
    RefObject<Mesh | null>,
  ]
  steeringWheelRef?: RefObject<Group | null>
}

/** Pure presentational low-poly car; shared by the player and AI traffic. */
export function CarBody({ variant, colors, povMode, frontAxleRef, wheelRefs, steeringWheelRef }: CarBodyProps) {
  const spec = SPECS[variant]
  const { body, cabin, accent } = colors
  const halfLen = spec.bodyLen / 2

  return (
    <group>
      {/* hypercar specific aggressive shape */}
      {variant === "hypercar" && (
        <FerrariModel povMode={povMode} frontAxleRef={frontAxleRef} wheelRefs={wheelRefs} steeringWheelRef={steeringWheelRef} />
      )}

      {/* main body (standard variants) */}
      {variant !== "hypercar" && (
        <group>
          <RoundedBox castShadow position={[0, spec.bodyY, -0.1]} args={[spec.bodyW, spec.bodyH, spec.bodyLen]} radius={0.15} smoothness={4}>
            <meshPhysicalMaterial color={body} metalness={0.8} roughness={0.2} clearcoat={1.0} />
          </RoundedBox>
          <RoundedBox castShadow position={[0, spec.bodyY - 0.05, halfLen - 0.1]} args={[spec.bodyW - 0.2, spec.bodyH - 0.15, 0.9]} radius={0.12} smoothness={4}>
            <meshPhysicalMaterial color={body} metalness={0.8} roughness={0.2} clearcoat={1.0} />
          </RoundedBox>
        </group>
      )}

      {/* cabin — shape differs per variant */}
      {variant === "van" ? (
        <mesh castShadow position={[0, spec.bodyY + 0.55, -0.3]}>
          <boxGeometry args={[spec.bodyW - 0.15, 0.85, 2.7]} />
          {!povMode && <meshPhysicalMaterial color={cabin} transmission={0.9} opacity={1} metalness={0.1} roughness={0.1} ior={1.5} thickness={0.5} transparent />}
        </mesh>
      ) : variant === "buggy" ? (
        // exposed roll cage
        <group position={[0, spec.bodyY + 0.5, -0.3]}>
          {[
            [0.7, 0.7],
            [-0.7, 0.7],
            [0.7, -0.7],
            [-0.7, -0.7],
          ].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0, z]}>
              <boxGeometry args={[0.12, 0.9, 0.12]} />
              <meshStandardMaterial color={accent} metalness={0.8} roughness={0.4} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[1.5, 0.12, 1.5]} />
            <meshStandardMaterial color={accent} metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      ) : variant === "hypercar" ? null : (
        <mesh castShadow position={[0, spec.bodyY + 0.47, variant === "roadster" ? -0.5 : -0.3]}>
          <boxGeometry args={[spec.bodyW - 0.35, variant === "roadster" ? 0.42 : 0.6, variant === "roadster" ? 1.4 : 1.9]} />
          {!povMode && <meshPhysicalMaterial color={cabin} transmission={0.9} opacity={1} metalness={0.1} roughness={0.1} ior={1.5} thickness={0.5} transparent />}
        </mesh>
      )}

      {/* windshield tint (not on buggy or hypercar) */}
      {variant !== "buggy" && variant !== "hypercar" && !povMode && (
        <mesh position={[0, spec.bodyY + 0.5, 0.72]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[spec.bodyW - 0.5, 0.5, 0.12]} />
          <meshPhysicalMaterial color="#111" transmission={0.5} transparent metalness={0.1} roughness={0.1} />
        </mesh>
      )}

      {variant !== "hypercar" && (
        <>
          {/* rear spoiler (coupe + roadster) */}
          {(variant === "coupe" || variant === "roadster") && (
            <>
              <mesh castShadow position={[0, spec.bodyY + 0.45, -halfLen - 0.05]}>
                <boxGeometry args={[spec.bodyW - 0.1, 0.1, 0.5]} />
                <meshStandardMaterial color={accent} flatShading />
              </mesh>
              <mesh position={[0.7, spec.bodyY + 0.23, -halfLen - 0.05]}>
                <boxGeometry args={[0.12, 0.35, 0.2]} />
                <meshStandardMaterial color={accent} flatShading />
              </mesh>
              <mesh position={[-0.7, spec.bodyY + 0.23, -halfLen - 0.05]}>
                <boxGeometry args={[0.12, 0.35, 0.2]} />
                <meshStandardMaterial color={accent} flatShading />
              </mesh>
            </>
          )}

          {/* headlights */}
          <mesh position={[0.6, spec.bodyY, halfLen + 0.32]}>
            <boxGeometry args={[0.35, 0.22, 0.1]} />
            <meshStandardMaterial color="#fffbe6" emissive="#fff2a8" emissiveIntensity={0.6} flatShading />
          </mesh>
          <mesh position={[-0.6, spec.bodyY, halfLen + 0.32]}>
            <boxGeometry args={[0.35, 0.22, 0.1]} />
            <meshStandardMaterial color="#fffbe6" emissive="#fff2a8" emissiveIntensity={0.6} flatShading />
          </mesh>

          {/* tail lights */}
          <mesh position={[0.6, spec.bodyY + 0.05, -halfLen - 0.12]}>
            <boxGeometry args={[0.35, 0.2, 0.1]} />
            <meshStandardMaterial color="#ff5a6e" emissive="#ff2338" emissiveIntensity={0.5} flatShading />
          </mesh>
          <mesh position={[-0.6, spec.bodyY + 0.05, -halfLen - 0.12]}>
            <boxGeometry args={[0.35, 0.2, 0.1]} />
            <meshStandardMaterial color="#ff5a6e" emissive="#ff2338" emissiveIntensity={0.5} flatShading />
          </mesh>
          {/* rear wheels */}
          <group position={[0, spec.wheelR - 0.05, -spec.wheelBase]}>
            <Wheel spec={spec} x={-spec.trackW} refObj={wheelRefs?.[0]} />
            <Wheel spec={spec} x={spec.trackW} refObj={wheelRefs?.[1]} />
          </group>
    
          {/* front steering axle */}
          <group ref={frontAxleRef} position={[0, spec.wheelR - 0.05, spec.wheelBase]}>
            <Wheel spec={spec} x={-spec.trackW} refObj={wheelRefs?.[2]} />
            <Wheel spec={spec} x={spec.trackW} refObj={wheelRefs?.[3]} />
          </group>
        </>
      )}
    </group>
  )
}

interface CarProps {
  steerRef: RefObject<number>
  speedRef: RefObject<number>
  variant: CarVariant
  colors: CarColors
  povMode?: boolean
}

export function Car({ steerRef, speedRef, variant, colors, povMode }: CarProps) {
  const frontAxle = useRef<Group>(null)
  const flWheel = useRef<Mesh>(null)
  const frWheel = useRef<Mesh>(null)
  const rlWheel = useRef<Mesh>(null)
  const rrWheel = useRef<Mesh>(null)

  const wheelRef = useRef<Group>(null)

  useFrame((_, delta) => {
    const steer = steerRef.current ?? 0
    const speed = speedRef.current ?? 0
    if (frontAxle.current) {
      frontAxle.current.rotation.y +=
        (steer * 0.5 - frontAxle.current.rotation.y) * Math.min(1, delta * 10)
    }
    if (wheelRef.current) {
      wheelRef.current.rotation.z = -steer * 1.5
    }
    const spin = speed * delta * 1.6
    for (const w of [flWheel, frWheel, rlWheel, rrWheel]) {
      if (w.current) w.current.rotation.x -= spin
    }
  })

  return (
    <group>
      <CarBody
        variant={variant}
        colors={colors}
        povMode={povMode}
        frontAxleRef={frontAxle}
        wheelRefs={[rlWheel, rrWheel, flWheel, frWheel]}
        steeringWheelRef={wheelRef}
      />
      {povMode && variant !== "hypercar" && (
        <group position={[0, SPECS[variant].bodyY + 0.2, 0.1]}>
          <mesh position={[0, -0.15, 0.4]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <group position={[0.3, -0.05, 0.35]} rotation={[-0.3, 0, 0]} ref={wheelRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.15, 0.02, 16, 32]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh>
              <boxGeometry args={[0.3, 0.02, 0.02]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}
