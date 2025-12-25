import type { World } from "@engine/core/world.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * AsteroidClearSystem
 * Destroys all active asteroids when a wave completes.
 * - Listens for wave_complete event
 * - Queries for all AsteroidComponent entities
 * - Destroys each asteroid entity
 */
export class AsteroidClearSystem {
  private waveCompleteListener?: (event: WorldEvent) => void;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };

    // Listen for both start_wave (Wave 1) and wave_transition (Wave 2+) to clear old asteroids before spawning new ones
    world.onEvent("start_wave", this.waveCompleteListener);
    world.onEvent("wave_transition", this.waveCompleteListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle wave completion - destroy all active asteroids
   */
  private onWaveComplete(world: World, _event: WorldEvent): void {
    // Query for all asteroid entities
    const asteroids = world.query(AsteroidComponent);
    const asteroidEntities = asteroids.entities();

    if (asteroidEntities.length === 0) {
      console.log("[AsteroidClearSystem] No asteroids to clear");
      return;
    }

    // Destroy each asteroid entity
    for (const asteroidEntity of asteroidEntities) {
      if (world.entityExists(asteroidEntity)) {
        world.destroyEntity(asteroidEntity);
      }
    }

    console.log(
      `[AsteroidClearSystem] Cleared ${asteroidEntities.length} asteroids for wave completion`,
    );
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.waveCompleteListener = undefined;
  }
}
