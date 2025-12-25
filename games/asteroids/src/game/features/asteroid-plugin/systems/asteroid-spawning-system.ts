import type { World } from "@engine/core/world.ts";
import type { AsteroidSizeTier } from "../components/asteroid.ts";
import { spawnAsteroid } from "../factories/spawn-asteroid.ts";

/**
 * AsteroidSpawningSystem
 * Listens for spawn_asteroid events and creates new asteroid entities.
 * Used by AsteroidDestructionSystem to spawn smaller asteroids when parents are destroyed.
 */
export class AsteroidSpawningSystem {
  update(world: World, _dt: number): void {
    // Check for spawn asteroid events
    const spawnEvents = world.getEvents("spawn_asteroid");

    for (const event of spawnEvents) {
      const eventData = event.data as {
        position: [number, number, number];
        sizeTier: AsteroidSizeTier;
      };

      // Validate event data
      if (!eventData.position || !eventData.sizeTier) {
        console.warn(`[SPAWNING SYSTEM] Invalid spawn event data:`, eventData);
        continue;
      }

      const sizeTier = eventData.sizeTier as AsteroidSizeTier;

      // Spawn the asteroid at the requested position with the requested size
      spawnAsteroid(world, eventData.position, sizeTier);
    }
  }
}
