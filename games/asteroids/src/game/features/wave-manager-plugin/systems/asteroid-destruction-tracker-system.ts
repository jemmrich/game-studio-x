import type { World } from "@engine/core/world.ts";
import { WaveManager } from "../resources/wave-manager.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * AsteroidDestructionTrackerSystem
 * Tracks asteroid destruction and updates the wave manager counter.
 * - Listens for asteroid_destroyed events
 * - Increments asteroidsDestroyedThisWave counter
 */
export class AsteroidDestructionTrackerSystem {
  private asteroidDestroyedListener?: (event: WorldEvent) => void;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.asteroidDestroyedListener = (event) => {
      this.onAsteroidDestroyed(world, event);
    };

    world.onEvent("asteroid_destroyed", this.asteroidDestroyedListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle asteroid destruction - increment counter
   */
  private onAsteroidDestroyed(world: World, event: WorldEvent): void {
    const waveManager = world.getResource<WaveManager>("waveManager");
    waveManager.recordAsteroidDestroyed();
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.asteroidDestroyedListener = undefined;
  }
}
