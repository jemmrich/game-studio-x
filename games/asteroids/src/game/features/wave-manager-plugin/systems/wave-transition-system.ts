import type { World } from "@engine/core/world.ts";
import { WaveManager } from "../resources/wave-manager.ts";
import { calculateDifficultyMultiplier } from "../../../../shared/config.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * WaveTransitionSystem
 * Handles progression to the next wave with difficulty scaling.
 * - Listens for wave_complete event
 * - Increments wave number and calculates difficulty
 * - Emits wave_transition event for spawn system
 * - Optionally emits entering_zone event for scene effects
 */
export class WaveTransitionSystem {
  private waveCompleteListener?: (event: WorldEvent) => void;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };

    world.onEvent("wave_complete", this.waveCompleteListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle wave completion and transition to next wave
   */
  private onWaveComplete(world: World, event: WorldEvent): void {
    const waveManager = world.getResource<WaveManager>("waveManager");

    // Increment wave counter
    waveManager.currentWaveNumber++;
    waveManager.totalWavesCompleted++;

    // Calculate new difficulty multiplier
    waveManager.difficultyMultiplier = calculateDifficultyMultiplier(
      waveManager.currentWaveNumber,
    );

    // Log wave transition with detailed information
    // Emit wave_transition event (consumed by spawn systems)
    world.emitEvent("wave_transition", {
      fromWave: (event.data as Record<string, unknown>).waveNumber,
      toWave: waveManager.currentWaveNumber,
      difficultyMultiplier: waveManager.difficultyMultiplier,
    });

    waveManager.lastEventEmitted = "wave_transition";

    // Emit entering_zone event for scene transition effects
    world.emitEvent("entering_zone", {
      zoneNumber: waveManager.currentWaveNumber,
      displayDuration: 3000, // 3 seconds
    });
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    // Event listeners are automatically cleaned up by world
    this.waveCompleteListener = undefined;
  }
}
