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
      "three": resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "node_modules/three/build/three.module.js",
      ),
    },
  },
  server: {
    port: 8000,
    host: "localhost",
  },
  build: {
    sourcemap: true,
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
  },
  ssr: {
    external: ["@dimforge/rapier3d-compat"],
  },
});
