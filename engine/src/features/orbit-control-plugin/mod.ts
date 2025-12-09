import type { World } from "../../core/world.ts";
import type { HTMLCanvasElement } from "../render-plugin/types.ts";
import { OrbitControlConfig } from "./resources/orbit-control-config.ts";
import { OrbitControlSystem } from "./systems/orbit-control-system.ts";

// Export all resources
export { OrbitControlConfig } from "./resources/mod.ts";

// Export all systems
export { OrbitControlSystem } from "./systems/mod.ts";

// Export types
export type { HTMLCanvasElement } from "../render-plugin/types.ts";

/**
 * Create an OrbitControls plugin for the game engine
 *
 * This plugin provides Three.js OrbitControls integration, allowing users to
 * interactively manipulate the camera through orbiting, panning, and zooming.
 *
 * IMPORTANT: The render plugin must be initialized before this plugin, as it
 * requires the CameraState resource to be present in the world.
 *
 * @param canvas - The HTML canvas element where input events will be detected
 * @param options - Optional configuration overrides for OrbitControlConfig
 * @returns A plugin function that can be passed to world.addSystem()
 *
 * @example
 * ```typescript
 * import { createOrbitControlPlugin } from "../engine/features/orbit-control-plugin/mod.ts";
 *
 * const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
 * const orbitPlugin = createOrbitControlPlugin(canvas, {
 *   minDistance: 5,
 *   maxDistance: 50,
 *   autoRotate: true,
 * });
 *
 * world.addSystem(orbitPlugin);
 * ```
 */
export function createOrbitControlPlugin(
  canvas: HTMLCanvasElement,
  options?: Partial<OrbitControlConfig>
) {
  // Create the plugin function
  return (world: World) => {
    // Validate that required resources exist
    try {
      world.getResource("CameraState");
    } catch {
      console.error(
        "[OrbitControlPlugin] CameraState resource not found. " +
          "Ensure the render plugin is initialized before adding the orbit control plugin."
      );
      return;
    }

    // Create and configure the resource
    const config = new OrbitControlConfig(options);
    world.addResource("OrbitControlConfig", config);

    // Create and add the system
    const system = new OrbitControlSystem(canvas);
    world.addSystem(system);

    // Store the system as a resource so it can be accessed for operations like reset
    world.addResource("OrbitControlSystem", system);

    // Initialize the system immediately so it sets up event listeners
    system.init(world);
  };
}

/**
 * Alternative: Direct system and resource registration
 *
 * If you prefer more granular control, you can register the system and resource separately:
 *
 * @example
 * ```typescript
 * const config = new OrbitControlConfig({ autoRotate: true });
 * world.addResource("OrbitControlConfig", config);
 * world.addSystem(new OrbitControlSystem(canvas));
 * ```
 */
