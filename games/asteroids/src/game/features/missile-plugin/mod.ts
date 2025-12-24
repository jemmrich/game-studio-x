import type { World } from "@engine/core/world.ts";
import { MissileManager } from "./resources/mod.ts";
import { MissileLifetimeSystem, MissileCollisionSystem, MissileRenderSystem, MissileMovementSystem, MissileSpawningSystem } from "./systems/mod.ts";

export { MissileComponent } from "./components/mod.ts";
export { MissileGeometry } from "./components/mod.ts";
export { MissileManager } from "./resources/mod.ts";
export { MissileLifetimeSystem, MissileCollisionSystem, MissileRenderSystem, MissileMovementSystem, MissileSpawningSystem } from "./systems/mod.ts";
export { spawnMissile } from "./factories/mod.ts";

/**
 * Install the Missile Plugin into the ECS world
 *
 * This plugin provides a reusable missile/projectile system that can be used
 * by any entity (player ship, aliens, etc.) to spawn missiles for combat.
 *
 * Features:
 * - Missiles travel in a direction with constant velocity
 * - Auto-destroy after defined lifetime
 * - Missile count limiting per spawner (default: 10)
 * - Support for player and alien missiles
 * - Screen wrapping for toroidal space
 * - Point rendering with BufferGeometry
 *
 * Provides:
 * - MissileComponent: Data for individual missiles
 * - MissileManager: Resource for tracking active missiles
 * - MissileLifetimeSystem: Handles missile expiration and cleanup
 * - MissileCollisionSystem: Base system for collision handling (game-specific override)
 * - spawnMissile(): Utility function for spawning missiles with limit checking
 *
 * Dependencies:
 * - Transform plugin (provides Transform component)
 * - Render plugin (provides Mesh and Collider components)
 *
 * Installation Order:
 * ```typescript
 * const world = new World();
 * installTransformPlugin(world);
 * installRenderPlugin(world, { canvas: ... });
 * installMissilePlugin(world);
 * ```
 *
 * Usage:
 * ```typescript
 * import { spawnMissile } from "./missile-plugin/mod.ts";
 *
 * // Spawn a missile from a position in a direction
 * const missileId = spawnMissile(
 *   world,
 *   [0, 0, 0],           // position
 *   [1, 0, 0],           // direction (normalized)
 *   playerId,            // spawnerId
 *   100,                 // speed
 *   3.0,                 // lifetime in seconds
 *   10                   // max missiles per spawner
 * );
 *
 * if (missileId === null) {
 *   console.log("Missile limit reached");
 * }
 * ```
 *
 * @param world - The ECS world to install the plugin into
 */
export function installMissilePlugin(world: World): void {
  // Register the MissileManager resource
  const manager = new MissileManager();
  world.addResource("MissileManager", manager);

  // Register systems
  world.addSystem(new MissileSpawningSystem());
  world.addSystem(new MissileLifetimeSystem());
  world.addSystem(new MissileCollisionSystem());
  world.addSystem(new MissileMovementSystem());
}
