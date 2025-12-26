import type { World } from "@engine/core/world.ts";
import * as THREE from "three";
import { EnteringZoneEffectSystem } from "./systems/entering-zone-effect-system.ts";

export { EnteringZoneEffectComponent } from "./components/entering-zone-effect.ts";
export {
  EnteringZoneEffectSystem,
  type EnteringZoneEffectConfig,
} from "./systems/entering-zone-effect-system.ts";

/**
 * Install the Entering Zone Effect Plugin
 * Sets up the system that handles zone transition visual effects
 */
export function installEnteringZoneEffectPlugin(
  world: World,
  threeScene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): void {
  const system = new EnteringZoneEffectSystem(threeScene, camera);
  system.setup(world);
  world.addSystem(system);
}
