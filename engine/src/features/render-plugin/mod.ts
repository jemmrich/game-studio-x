import type { World } from "../../core/world.ts";
import type { HTMLCanvasElement } from "./types.ts";
import { RenderContext } from "./resources/render-context.ts";
import { GeometryBufferCache } from "./resources/geometry-buffer-cache.ts";
import { ShaderLibrary } from "./resources/shader-library.ts";
import { LightingState } from "./resources/lighting-state.ts";
import { CameraState } from "./resources/camera-state.ts";
import { RenderInitializationSystem } from "./systems/render-initialization-system.ts";
import { GeometryBufferSystem } from "./systems/geometry-buffer-system.ts";
import { CameraUpdateSystem } from "./systems/camera-update-system.ts";
import { MeshRenderSystem } from "./systems/mesh-render-system.ts";

// Export all components
export {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Material,
  PlaneGeometry,
  SphereGeometry,
  Visible,
} from "./components/mod.ts";

// Export all resources
export {
  CameraState,
  GeometryBufferCache,
  LightingState,
  RenderContext,
  ShaderLibrary,
} from "./resources/mod.ts";

// Export all systems
export {
  CameraUpdateSystem,
  GeometryBufferSystem,
  MeshRenderSystem,
  RenderInitializationSystem,
} from "./systems/mod.ts";

/**
 * Configuration interface for the RenderPlugin
 */
export interface RenderPluginConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  shadowsEnabled?: boolean;
  rendererType?: "webgl2" | "webgpu";
  clearColor?: [number, number, number, number];
}

/**
 * Install the RenderPlugin into the ECS world
 *
 * This plugin provides:
 * - Components for 3D geometry primitives (Box, Sphere, Cylinder, Plane, Cone)
 * - Material system for customizing appearance
 * - WebGL rendering context and resource management
 * - Systems for buffer management, camera updates, and rendering
 *
 * Dependencies:
 * - Transform plugin must be installed first (provides Transform component)
 *
 * Usage:
 * ```typescript
 * const world = new World();
 * installTransformPlugin(world);
 * installRenderPlugin(world, {
 *   canvas: document.querySelector('canvas')!,
 *   antialias: true,
 *   clearColor: [0, 0, 0, 1]
 * });
 * ```
 *
 * @param world - The ECS world to install the plugin into
 * @param config - Optional configuration for the render plugin
 */
export function installRenderPlugin(world: World, config: RenderPluginConfig = {}): void {
  // Note: Transform plugin dependency check skipped to avoid circular imports
  // Ensure installTransformPlugin(world) is called before installRenderPlugin(world)

  // Get or create canvas
  let canvas = config.canvas;
  if (!canvas) {
    // Try to get canvas from DOM if available in browser environment
    const g = globalThis as unknown as {
      document?: { querySelector?(s: string): HTMLCanvasElement | null };
    };
    if (g.document?.querySelector) {
      canvas = g.document.querySelector("canvas") ?? undefined;
    }
  }
  if (!canvas) {
    throw new Error(
      "RenderPlugin requires a canvas element. Provide one in config.canvas or ensure a <canvas> exists in the DOM.",
    );
  }

  // Initialize resources
  const renderContext = new RenderContext(canvas);
  const geometryBufferCache = new GeometryBufferCache();
  const shaderLibrary = new ShaderLibrary();
  const lightingState = new LightingState();
  const cameraState = new CameraState();

  // Add resources to world
  world.addResource("RenderContext", renderContext);
  world.addResource("GeometryBufferCache", geometryBufferCache);
  world.addResource("ShaderLibrary", shaderLibrary);
  world.addResource("LightingState", lightingState);
  world.addResource("CameraState", cameraState);

  // Register systems in execution order
  world.addSystem(new RenderInitializationSystem(config));
  world.addSystem(new GeometryBufferSystem());
  world.addSystem(new CameraUpdateSystem());
  world.addSystem(new MeshRenderSystem());

  console.log("RenderPlugin installed successfully");
}

/**
 * Dispose of the RenderPlugin resources
 * Call this when shutting down the game to clean up WebGL resources
 *
 * @param world - The ECS world to dispose resources from
 */
export function disposeRenderPlugin(world: World): void {
  try {
    const renderContext = world.getResource<RenderContext>("RenderContext");
    const geometryBufferCache = world.getResource<GeometryBufferCache>("GeometryBufferCache");
    const shaderLibrary = world.getResource<ShaderLibrary>("ShaderLibrary");

    if (renderContext && renderContext.gl) {
      geometryBufferCache.dispose(renderContext.gl);
      shaderLibrary.dispose(renderContext.gl);
      renderContext.dispose();
    }
  } catch {
    // Resources may not be installed, gracefully handle this
    // This allows disposeRenderPlugin to be called even if the plugin wasn't properly installed
  }
}
