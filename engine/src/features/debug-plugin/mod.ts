import type { World } from "../../core/world.ts";
import { DebugContext } from "./resources/debug-context.ts";
import { DebugBoundsRenderSystem } from "./systems/debug-bounds-render-system.ts";
import { DebugGridRenderSystem } from "./systems/debug-grid-render-system.ts";
import { DebugLabelRenderSystem } from "./systems/debug-label-render-system.ts";
import { DebugPerformanceSystem } from "./systems/debug-performance-system.ts";

// Export all components
export {
  DebugBounds,
  DebugGridOverlay,
  DebugLabel,
  DebugPerformance,
} from "./components/mod.ts";

// Export all resources
export {
  DebugContext,
} from "./resources/mod.ts";

// Export all systems
export {
  DebugBoundsRenderSystem,
  DebugGridRenderSystem,
  DebugLabelRenderSystem,
  DebugPerformanceSystem,
} from "./systems/mod.ts";

/**
 * Configuration interface for the DebugPlugin
 */
export interface DebugPluginConfig {
  /** Whether debug features are enabled by default */
  enabled?: boolean;

  /** Which debug layers to enable by default */
  enabledLayers?: string[];
}

/**
 * Install the DebugPlugin into the ECS world
 *
 * This plugin provides:
 * - DebugBounds: Visual bounds/collision visualization
 * - DebugGridOverlay: Grid overlay for spatial reference
 * - DebugLabel: Text labels attached to entities
 * - DebugPerformance: Performance metrics tracking
 *
 * Dependencies:
 * - Transform plugin must be installed first (provides Transform component)
 *
 * Usage:
 * ```typescript
 * const world = new World();
 * installTransformPlugin(world);
 * installDebugPlugin(world, {
 *   enabled: true,
 *   enabledLayers: ["bounds", "grid", "labels", "performance"]
 * });
 * ```
 *
 * @param world - The ECS world to install the plugin into
 * @param config - Optional configuration for the debug plugin
 */
export function installDebugPlugin(world: World, config: DebugPluginConfig = {}): void {
  // Note: Transform plugin dependency check skipped to avoid circular imports
  // Ensure installTransformPlugin(world) is called before installDebugPlugin(world)

  // Create debug context
  const debugContext = new DebugContext();
  debugContext.enabled = config.enabled ?? true;

  // Set enabled layers
  if (config.enabledLayers) {
    debugContext.visibleLayers = new Set(config.enabledLayers);
  }

  // Add resource to world
  world.addResource("DebugContext", debugContext);

  // Register systems in execution order
  world.addSystem(new DebugPerformanceSystem());
  world.addSystem(new DebugBoundsRenderSystem());
  world.addSystem(new DebugGridRenderSystem());
  world.addSystem(new DebugLabelRenderSystem());

  console.log("DebugPlugin installed successfully");
}

/**
 * Dispose of the DebugPlugin resources
 * Call this when shutting down the game to clean up debug overlays
 *
 * @param world - The ECS world to dispose resources from
 */
export function disposeDebugPlugin(world: World): void {
  try {
    // Get systems and dispose them
    const systems = [
      world.getResource<DebugBoundsRenderSystem>("DebugBoundsRenderSystem"),
      world.getResource<DebugGridRenderSystem>("DebugGridRenderSystem"),
      world.getResource<DebugLabelRenderSystem>("DebugLabelRenderSystem"),
    ];

    for (const system of systems) {
      if (system && typeof system.dispose === "function") {
        system.dispose();
      }
    }
  } catch {
    // Resources may not be installed, gracefully handle this
    // This allows disposeDebugPlugin to be called even if the plugin wasn't properly installed
  }
}