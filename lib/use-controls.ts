"use client"

import { useEffect, useRef } from "react"
import type { CarInput } from "./car-physics"

const KEY_MAP: Record<string, keyof KeyState> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "space",
}

interface KeyState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  space: boolean
}

/**
 * Tracks raw key state and exposes a ref that maps to CarInput.
 * Reading happens inside the render loop so there is no React churn.
 */
export function useControls() {
  const keys = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  })
  const input = useRef<CarInput>({
    throttle: false,
    brake: false,
    steer: 0,
    handbrake: false,
  })

  useEffect(() => {
    const setKey = (code: string, value: boolean) => {
      const mapped = KEY_MAP[code]
      if (!mapped) return false
      keys.current[mapped] = value
      return true
    }
    const onDown = (e: KeyboardEvent) => {
      if (setKey(e.code, true)) e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => {
      if (setKey(e.code, false)) e.preventDefault()
    }
    const onBlur = () => {
      keys.current.up = false
      keys.current.down = false
      keys.current.left = false
      keys.current.right = false
      keys.current.space = false
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  const read = (): CarInput => {
    const k = keys.current
    input.current.throttle = k.up
    input.current.brake = k.down
    input.current.steer = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    input.current.handbrake = k.space
    return input.current
  }

  return read
}
