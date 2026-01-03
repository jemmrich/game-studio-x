import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { AsteroidComponent } from "../components/asteroid.ts";
import { ShipComponent } from "../../ship-plugin/components/mod.ts";
import { BoundingBox } from "../../ship-plugin/components/bounding-box.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { getCollisionRadius } from "../config/asteroid-size-config.ts";

/**
 * AsteroidCollisionSystem
 * Handles collisions between asteroids and projectiles/ship.
 * - Detects asteroid-projectile collisions
 * - Detects asteroid-ship collisions
 * - Emits destruction events for hit asteroids
 * - Removes projectiles on impact
 */
export class AsteroidCollisionSystem {
  update(world: World, _dt: number): void {
    // Check for collision events from missile system
    const collisionEvents = world.getEvents("asteroid_projectile_collision");

    for (const event of collisionEvents) {
      this.handleProjectileCollision(world, event.data as { asteroidId: GUID; projectileId: GUID });
    }

    // Check for direct ship-asteroid collisions
    this.checkShipAsteroidCollisions(world);
  }

  private handleProjectileCollision(
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

  private checkShipAsteroidCollisions(world: World): void {
    // Create fresh queries every frame to ensure we catch the ship entity
    // This is critical because the ship respawns and we need to detect it in collisions
    const asteroidQuery = world.query(AsteroidComponent, Transform);
    let shipQuery: Query | null = null;

    try {
      shipQuery = world.query(ShipComponent, Transform);
    } catch {
      // Ship query may not be available yet
      return;
    }

    const asteroids = asteroidQuery.entities();
    const ships = shipQuery.entities();

    // If no ships or asteroids, nothing to collide
    if (ships.length === 0 || asteroids.length === 0) {
      return;
    }

    for (const shipEntity of ships) {
      const ship = world.get<ShipComponent>(shipEntity, ShipComponent);
      const shipTransform = world.get<Transform>(shipEntity, Transform);
      const shipBBox = world.get<BoundingBox>(shipEntity, BoundingBox);

      if (!ship || !shipTransform) continue;

      // Skip collision detection if ship is invincible
      if (ship.isInvincible) {
        continue;
      }

      // Calculate ship radius from bounding box (half diagonal)
      let shipRadius = 8; // Default fallback
      if (shipBBox) {
        // Use the bounding box to calculate ship radius
        // The radius is the distance from center to corner
        const halfWidth = shipBBox.width / 2;
        const halfHeight = shipBBox.height / 2;
        shipRadius = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
        // Account for ship scale
        shipRadius *= shipTransform.scale[0];
      }

      for (const asteroidEntity of asteroids) {
        const asteroid = world.get<AsteroidComponent>(asteroidEntity, AsteroidComponent);
        const asteroidTransform = world.get<Transform>(asteroidEntity, Transform);

        if (!asteroid || !asteroidTransform) continue;

        // Calculate distance between ship and asteroid
        const dx = shipTransform.position[0] - asteroidTransform.position[0];
        const dy = shipTransform.position[1] - asteroidTransform.position[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Get collision radius for this asteroid size
        const asteroidRadius = getCollisionRadius(asteroid.sizeTier);

        // Check if collision occurred
        if (distance < asteroidRadius + shipRadius) {
          // Emit collision event for ship collision handling system
          world.emitEvent("ship_asteroid_collision", {
            shipId: shipEntity,
            asteroidId: asteroidEntity,
          });
        }
      }
    }
  }
}
