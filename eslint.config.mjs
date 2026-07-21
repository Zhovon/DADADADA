import { defineConfig } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"

export default defineConfig([
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    // The game loop mutates refs/shared objects inside R3F's useFrame (not
    // render), which these compiler-era rules can't distinguish from render.
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
])
