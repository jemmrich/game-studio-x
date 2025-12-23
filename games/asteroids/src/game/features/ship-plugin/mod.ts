import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";

// Components
export {
  ShipComponent,
  Velocity,
  BoundingBox,
  ShipGeometry,
} from "./components/mod.ts";

// Systems
export {
  PlayerInputSystem,
  ShipMovementSystem,
  MissileSpawningSystem,
  CollisionHandlingSystem,
  ShipThrustVisualSystem,
  ShipRenderSystem,
} from "./systems/mod.ts";

// Utils
export { spawnPlayerShip, PlayerShipGeometry } from "./utils/mod.ts";

import { PlayerInputSystem } from "./systems/player-input-system.ts";
import { ShipMovementSystem } from "./systems/ship-movement-system.ts";
import { ShipThrustVisualSystem } from "./systems/ship-thrust-visual-system.ts";
import { MissileSpawningSystem } from "./systems/missile-spawning-system.ts";
import { CollisionHandlingSystem } from "./systems/collision-handling-system.ts";

/**
 * Install the Ship Plugin
 * Sets up all systems needed for ship control and movement
 * Note: Must be called after scene is loaded to connect systems to ship entity
 */
export function installShipPlugin(world: World): ShipPluginContext {
  // Create and register systems
  const playerInputSystem = new PlayerInputSystem();
  const shipMovementSystem = new ShipMovementSystem();
  const shipThrustVisualSystem = new ShipThrustVisualSystem();
  const missileSpawningSystem = new MissileSpawningSystem();
  const collisionHandlingSystem = new CollisionHandlingSystem();

  world.addSystem(playerInputSystem);
  world.addSystem(shipMovementSystem);
  world.addSystem(shipThrustVisualSystem);
  world.addSystem(missileSpawningSystem);
  world.addSystem(collisionHandlingSystem);

  return {
    playerInputSystem,
    shipMovementSystem,
    shipThrustVisualSystem,
    missileSpawningSystem,
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
  missileSpawningSystem: MissileSpawningSystem;
  collisionHandlingSystem: CollisionHandlingSystem;
  setShipEntityId(id: GUID): void;
}
