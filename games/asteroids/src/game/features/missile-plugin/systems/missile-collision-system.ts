import type { World } from "@engine/core/world.ts";
import type { Query } from "@engine/core/query.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { MissileComponent } from "../components/mod.ts";
import { MissileManager } from "../resources/mod.ts";

/**
 * MissileCollisionSystem
 *
 * Handles collision interactions between missiles and other game objects.
 *
 * Design:
 * This system is designed to be extended by game-specific implementations.
 * The Asteroids game will extend this to implement:
 * - Player missiles colliding with asteroids and alien ships
 * - Alien missiles colliding with asteroids and the player ship
 * - Damage application and entity destruction on collision
 * - Point/score awarding for destroyed targets
 *
 * Base System Responsibilities:
 * - Provide collision detection hooks
 * - Manage missile cleanup after collision
 * - Track missile-to-target relationships
 *
 * Usage Pattern:
 * Game-specific implementations should override the collision handler methods
 * to define custom behavior for different missile types and targets.
 *
 * Note: Actual collision detection depends on the physics/collision system.
 * This system assumes that collider components and collision events are
 * provided by the render or physics plugin.
 *
 * Phase: Runs in the PhysicsUpdate or Update phase
 */
export class MissileCollisionSystem {
  private missileQuery: Query | null = null;

  onAttach(world: World): void {
    // Initialize the query to find all entities with MissileComponent
    this.missileQuery = world.query(MissileComponent);
  }

  update(world: World, _deltaTime: number): void {
    if (!this.missileQuery) return;

    const manager = world.getResource<MissileManager>("MissileManager");
    if (!manager) return;

    // Get all missile entities
    const missiles = this.missileQuery.entities();

    for (const missileEntity of missiles) {
      const missile = world.get<MissileComponent>(missileEntity, MissileComponent);
      if (!missile) continue;

      // TODO: Integrate with collision system
      // This stub will be implemented by checking collider state
      // and detecting collisions with other entities

      // Get spawner entity to determine missile type (player or alien)
      if (!world.entityExists(missile.spawnerId)) {
        // Spawner no longer exists, remove missile
        manager.removeMissile(missile.spawnerId, missileEntity);
        world.destroyEntity(missileEntity);
        continue;
      }

      // Collision handling will be implemented in game-specific subclasses
      // or through collision event listeners
    }
  }

  /**
   * Called when a missile collides with a target
   * Subclasses should override to implement custom behavior
   */
  protected onMissileCollision(
    _world: World,
    _missileId: GUID,
    _targetId: GUID
  ): void {
    // To be implemented by subclasses
  }
}
