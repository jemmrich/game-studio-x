import type { World } from "@engine/core/world.ts";
import { MissileComponent } from "../components/mod.ts";
import { MissileManager } from "../resources/mod.ts";

/**
 * MissileLifetimeSystem
 *
 * Manages missile lifetime and automatic cleanup.
 *
 * Behavior:
 * - Each frame, decrements the lifetime value of all missiles
 * - When a missile's lifetime reaches 0 or below, the missile is removed
 * - Updates the MissileManager to clean up references when missiles are destroyed
 * - Can emit events on missile destruction (for future effects/sounds)
 *
 * Dependencies:
 * - Requires MissileComponent on the entity
 * - Requires MissileManager resource in the world
 *
 * System Phases:
 * - Runs in the Update phase
 * - Should run before other systems that might reference missile entities
 */
export class MissileLifetimeSystem {
  update(world: World, deltaTime: number): void {
    // Query for all entities with MissileComponent
    const query = world.query(MissileComponent);
    const missiles = query.entities();

    const manager = world.getResource<MissileManager>("MissileManager");

    // Iterate in reverse to safely remove entities during iteration
    for (let i = missiles.length - 1; i >= 0; i--) {
      const missileId = missiles[i];
      const missile = world.get<MissileComponent>(missileId, MissileComponent);

      if (!missile) continue;

      // Decrement lifetime
      missile.lifetime -= deltaTime;

      // Check if lifetime has expired
      if (missile.lifetime <= 0) {
        // Clean up missile tracking in MissileManager if available
        if (manager) {
          manager.removeMissile(missile.spawnerId, missileId);
        }

        // Remove the entity from the world
        world.destroyEntity(missileId);

        // TODO: Emit event on missile destruction for effects/sounds
        // emitEvent('missileDestroyed', { missileId: entity.id, spawnerId: missile.spawnerId });
      }
    }
  }
}
