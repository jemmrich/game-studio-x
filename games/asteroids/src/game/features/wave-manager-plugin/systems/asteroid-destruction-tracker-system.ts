import type { World } from "@engine/core/world.ts";
import { WaveManager } from "../resources/wave-manager.ts";

/**
 * AsteroidDestructionTrackerSystem
 * Deprecated: Asteroid destruction is now tracked via GameStats resource
 * This system is kept for compatibility but no longer performs any functions.
 * - GameStats now centralizes all destruction tracking
 * - WaveTrackingSystem reads destruction counts directly from GameStats
 */
export class AsteroidDestructionTrackerSystem {
  private asteroidDestroyedListener?: any;

  /**
   * Setup event listeners during initialization (deprecated, now a no-op)
   */
  setup(): void {
    // Asteroid destruction tracking is now handled by GameStats
    // No tracking needed here anymore
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.asteroidDestroyedListener = undefined;
  }
}
