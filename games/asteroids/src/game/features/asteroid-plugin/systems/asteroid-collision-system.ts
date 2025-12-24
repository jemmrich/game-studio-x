import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { AsteroidComponent } from "../components/asteroid.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";

/**
 * AsteroidCollisionSystem
 * Handles collisions between asteroids and projectiles.
 * - Detects asteroid-projectile collisions
 * - Emits destruction events for hit asteroids
 * - Removes projectiles on impact
 */
export class AsteroidCollisionSystem {
  update(world: World, _dt: number): void {
    // Check for collision events from physics/collision system
    const collisionEvents = world.getEvents("asteroid_projectile_collision");

    for (const event of collisionEvents) {
      this.handleCollision(world, event.data as { asteroidId: GUID; projectileId: GUID });
    }
  }

  private handleCollision(
    world: World,
    event: { asteroidId: GUID; projectileId: GUID },
  ): void {
    const { asteroidId, projectileId } = event;

    // Verify asteroid exists and has AsteroidComponent
    if (!world.entityExists(asteroidId)) {
        return;
    }

    const asteroidComponent = world.get<AsteroidComponent>(
      asteroidId,
      AsteroidComponent,
    );

    if (!asteroidComponent) {
      return;
    }

    // Get asteroid position for destruction event
    const transform = world.get<Transform>(asteroidId, Transform);
    const position = transform
      ? (transform.position as [number, number, number])
      : [0, 0, 0];

    // Emit destruction event (handled by AsteroidDestructionSystem)
    world.emitEvent("asteroid_destroyed", { asteroidId, position });

    // Remove projectile from world
    if (world.entityExists(projectileId)) {
      world.destroyEntity(projectileId);
    }
  }
}
