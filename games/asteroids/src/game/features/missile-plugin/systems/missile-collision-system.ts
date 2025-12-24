import type { World } from "@engine/core/world.ts";
import type { Query } from "@engine/core/query.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { MissileComponent } from "../components/mod.ts";
import { MissileManager } from "../resources/mod.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/mod.ts";
import { getCollisionRadius } from "../../asteroid-plugin/config/asteroid-size-config.ts";

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
  private asteroidQuery: Query | null = null;

  update(world: World, _deltaTime: number): void {
    // Lazy initialize queries on first update
    if (!this.missileQuery || !this.asteroidQuery) {
      this.missileQuery = world.query(MissileComponent, Transform);
      this.asteroidQuery = world.query(AsteroidComponent, Transform);
    }

    const manager = world.getResource<MissileManager>("MissileManager");

    // Get all missile entities
    const missiles = this.missileQuery.entities();
    const asteroids = this.asteroidQuery.entities();

    for (const missileEntity of missiles) {
      const missile = world.get<MissileComponent>(missileEntity, MissileComponent);
      const missileTransform = world.get<Transform>(missileEntity, Transform);
      
      if (!missile || !missileTransform) continue;

      // Check for collisions with asteroids
      let collided = false;

      for (const asteroidEntity of asteroids) {
        const asteroid = world.get<AsteroidComponent>(asteroidEntity, AsteroidComponent);
        const asteroidTransform = world.get<Transform>(asteroidEntity, Transform);
        
        if (!asteroid || !asteroidTransform) continue;

        // Calculate distance between missile and asteroid
        const dx = missileTransform.position[0] - asteroidTransform.position[0];
        const dy = missileTransform.position[1] - asteroidTransform.position[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Get collision radius for this asteroid size
        const collisionRadius = getCollisionRadius(asteroid.sizeTier);

        // Missile collision radius (small, ~1 unit)
        const missileRadius = 1;

        // Check if collision occurred
        if (distance < collisionRadius + missileRadius) {
          // Emit collision event for asteroid destruction system
          world.emitEvent("asteroid_projectile_collision", {
            asteroidId: asteroidEntity,
            projectileId: missileEntity,
          });

          // Remove the missile
          if (manager) {
            manager.removeMissile(missile.spawnerId, missileEntity);
          }
          world.destroyEntity(missileEntity);
          collided = true;
          break;
        }
      }

      if (collided) continue;

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
