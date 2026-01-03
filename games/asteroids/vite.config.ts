import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@engine": resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../../engine/src",
      ),
    },
  },
  server: {
    port: 8000,
    host: "localhost",
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ["three", "three/examples/jsm/controls/OrbitControls.js"],
    },
  },
  // WebAssembly configuration for Rapier physics engine
  wasm: {
    asyncWebAssembly: true,
    rollupPluginWasmOptions: {
      getModule: true,
    },
  },
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d-compat"],
    include: ["three/examples/jsm/controls/OrbitControls.js"],
  },
  ssr: {
    external: ["@dimforge/rapier3d-compat"],
  },
});
