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
 * - Ignores wave progression when game is paused/over
 * - Resumes wave progression when game is resumed
 */
export class WaveTransitionSystem {
  private waveCompleteListener?: (event: WorldEvent) => void;
  private gamePausedListener?: (event: WorldEvent) => void;
  private gameResumedListener?: (event: WorldEvent) => void;
  private isGameOver: boolean = false;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };

    this.gamePausedListener = (event) => {
      this.onGamePaused(world, event);
    };

    this.gameResumedListener = (event) => {
      this.onGameResumed(world, event);
    };

    world.onEvent("wave_complete", this.waveCompleteListener);
    world.onEvent("game_paused", this.gamePausedListener);
    world.onEvent("game_resumed", this.gameResumedListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle game pause/over event
   * Prevents further wave progression when game is no longer active
   */
  private onGamePaused(_world: World, event: WorldEvent): void {
    const reason = (event.data as Record<string, unknown>).reason;
    if (reason === "game_over") {
      this.isGameOver = true;
      console.log("[WaveTransitionSystem] Game over detected - preventing further wave transitions");
    }
  }

  /**
   * Handle game resumed event
   * Re-enables wave progression when a new game starts
   */
  private onGameResumed(_world: World, _event: WorldEvent): void {
    this.isGameOver = false;
    console.log("[WaveTransitionSystem] Game resumed - wave transitions re-enabled");
  }

  /**
   * Handle wave completion and transition to next wave
   * Skips processing if game is over
   */
  private onWaveComplete(world: World, event: WorldEvent): void {
    // Ignore wave completion if game is over - prevents new waves from spawning
    if (this.isGameOver) {
      console.log("[WaveTransitionSystem] Ignoring wave_complete - game is over");
      return;
    }

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
    this.gamePausedListener = undefined;
    this.gameResumedListener = undefined;
    // Reset game over flag for next game
    this.isGameOver = false;
  }
}
