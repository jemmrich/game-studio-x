import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";

// Components
export {
  ShipComponent,
  type ShipComponentOptions,
  Velocity,
  BoundingBox,
  ShipGeometry,
} from "./components/mod.ts";

// Systems
export {
  PlayerInputSystem,
  ShipMovementSystem,
  CollisionHandlingSystem,
  ShipThrustVisualSystem,
  ShipRenderSystem,
} from "./systems/mod.ts";

// Factories
export { spawnPlayerShip } from "./factories/mod.ts";

// Utils
export { PlayerShipGeometry } from "./utils/player-ship-geometry.ts";

import { PlayerInputSystem } from "./systems/player-input-system.ts";
import { ShipMovementSystem } from "./systems/ship-movement-system.ts";
import { ShipThrustVisualSystem } from "./systems/ship-thrust-visual-system.ts";
import { CollisionHandlingSystem } from "./systems/collision-handling-system.ts";

/**
 * Install the Ship Plugin
 * Sets up all systems needed for ship control and movement
 * Note: Must be called after scene is loaded to connect systems to ship entity
 */
export function installShipPlugin(world: World): ShipPluginContext {
  // Create and register systems (except collision handling - order matters!)
  const playerInputSystem = new PlayerInputSystem();
  const shipMovementSystem = new ShipMovementSystem();
  const shipThrustVisualSystem = new ShipThrustVisualSystem();
  const collisionHandlingSystem = new CollisionHandlingSystem();

  // Connect playerInputSystem to collision handler so it can clear input on collision
  collisionHandlingSystem.setPlayerInputSystem(playerInputSystem);

  // Add input, movement, and visual systems
  world.addSystem(playerInputSystem);
  world.addSystem(shipMovementSystem);
  world.addSystem(shipThrustVisualSystem);
  // Note: CollisionHandlingSystem is added later (after collision detection systems)
  // to ensure it processes events emitted by AsteroidCollisionSystem and MissileCollisionSystem

  return {
    playerInputSystem,
    shipMovementSystem,
    shipThrustVisualSystem,
    collisionHandlingSystem,
    setShipEntityId(id: GUID) {
      playerInputSystem.setShipEntityId(id);
      collisionHandlingSystem.setShipEntityId(id);
    },
  };
}

/**
 * Context returned from installShipPlugin
 * Allows scenes to connect the plugin systems to ship entities
 */
export interface ShipPluginContext {
  playerInputSystem: PlayerInputSystem;
  shipMovementSystem: ShipMovementSystem;
  shipThrustVisualSystem: ShipThrustVisualSystem;
  collisionHandlingSystem: CollisionHandlingSystem;
  setShipEntityId(id: GUID): void;
}
