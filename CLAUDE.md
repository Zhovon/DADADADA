# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Pastel Drift" — a low-poly arcade drift racing web game built with Next.js (App Router) and React Three Fiber. Single page (`app/page.tsx` renders `components/racing-game.tsx`); everything happens client-side in one `<Canvas>`.

## Commands

Use npm (package-lock.json is the canonical lockfile; pnpm is not installed on this machine).

- `npm run dev` — run the dev server (localhost:3000)
- `npm run build` — production build (type-checks; `npx tsc --noEmit` for types only)
- `npm run lint` — eslint (flat config in `eslint.config.mjs`; the `react-hooks/refs` and `react-hooks/immutability` rules are intentionally off because the game loop mutates refs inside R3F's `useFrame`)
- `npm install` needs `--allow-remote=all`: npm 12's default `allow-remote=none` rejects the `@tailwindcss/oxide-wasm32-wasi` tarball dependency.

There are no tests.

## Architecture

The core design principle: **the game loop never triggers React re-renders.** Game state lives in plain mutable objects/classes held in refs; React state is only used for coarse phase changes (menu / playing / win) and camera mode.

Data flow per frame (all inside `useFrame` in `components/scene.tsx`):

1. `lib/use-controls.ts` — keyboard state collected in a ref; `readInput()` is called inside the frame loop, never causing renders.
2. `lib/car-physics.ts` — `CarPhysics` class, pure 2D (XZ-plane) arcade physics stepped at a **fixed 120 Hz timestep** via an accumulator in `scene.tsx`. All feel/tuning constants (grip, drift grip, accel, steer rate, drift-scoring thresholds) live at the top of this file. Drift scoring (chain, multiplier, banking on cooldown) and crash/spin-out state are also in this class. Collisions call `bump()`, which cancels the drift chain.
3. `lib/track.ts` — procedural closed circuits: a seeded star-convex radial function → Catmull-Rom curve → 700 precomputed samples (`pos`/`dir`/`right`/`cumLen`). `queryTrack()` (nearest-sample linear scan) gives lap fraction, signed lateral offset, and off-track detection; `sampleAtFrac()` drives AI cars along the centerline.
4. `lib/traffic.ts` / `lib/opponents.ts` — AI cars are plain classes updated imperatively each frame; their renderers (`components/traffic-cars.tsx`, `components/opponent-cars.tsx`) copy positions into meshes inside their own `useFrame`.
5. `lib/game-store.ts` — `HudState` is a mutable object shared by ref: `scene.tsx` writes to it every frame, `components/hud.tsx` reads it on its own animation frame. Do not convert HUD values to React state.

Lap tracking (in `scene.tsx`) uses ordered gates at track fractions 0.25/0.5/0.75 plus a wrap-detection finish line, so shortcuts don't count.

Content is data-driven:

- `lib/levels.ts` — `LEVELS` array; each level = track shape params (seed + radial modulation), a full color palette (sky/ground/road/decor/lighting), traffic count/speed, and decor density. Adding a level means adding an entry here — the track, visuals, and AI all derive from it.
- `lib/cars.ts` — `CARS` array of selectable car models: variant geometry key, colors, physics tuning multipliers (applied on top of the base constants in `car-physics.ts`), and menu stat bars.

Coordinate conventions worth knowing before touching physics or cameras: yaw `angle` has forward = `(sin(angle), cos(angle))` in XZ; steering input is negated when applied to yaw because with the chase camera looking down +z, world +x is screen-left (see comment in `car-physics.ts`).
