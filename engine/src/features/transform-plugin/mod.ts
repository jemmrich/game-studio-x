import type { World } from "../../../src/core/world.ts";
import { Transform } from "./components/mod.ts";

export { Transform } from "./components/mod.ts";

/**
 * Installer function for the Transform plugin.
 * Registers the Transform component for use in the ECS world.
 *
 * Must be called before other plugins that depend on Transform.
 * @param world - The ECS world to install the plugin into
 */
export function installTransformPlugin(world: World): void {
  // Transform plugin is minimal - it just provides the component
  // No resources or systems needed for basic transform functionality
}
