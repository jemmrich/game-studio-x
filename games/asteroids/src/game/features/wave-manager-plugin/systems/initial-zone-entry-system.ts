import type { World } from "@engine/core/world.ts";
import { WaveManager } from "../resources/wave-manager.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * InitialZoneEntrySystem
 * Emits entering_zone event for Wave 1 (the initial game start).
 * - Listens for start_wave event
 * - Emits entering_zone event to trigger the warp effect
 * - Ensures players see the warp effect as they enter the first asteroid field
 */
export class InitialZoneEntrySystem {
  private startWaveListener?: (event: WorldEvent) => void;
  private hasEmittedInitialZone: boolean = false;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.startWaveListener = (event) => {
      this.onStartWave(world, event);
    };

    // Listen for start_wave event (Wave 1 initialization)
    world.onEvent("start_wave", this.startWaveListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle start_wave event - emit entering_zone for the warp effect
   */
  private onStartWave(world: World, _event: WorldEvent): void {
    // Guard against emitting multiple times
    if (this.hasEmittedInitialZone) {
      return;
    }

    this.hasEmittedInitialZone = true;

    const waveManager = world.getResource<WaveManager>("waveManager");

    console.log(
      `[InitialZoneEntrySystem] Emitting entering_zone event for Wave ${waveManager.currentWaveNumber}`,
    );

    // Emit entering_zone event to trigger the warp effect
    world.emitEvent("entering_zone", {
      zoneNumber: waveManager.currentWaveNumber,
      displayDuration: 3000, // 3 seconds
    });
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.startWaveListener = undefined;
  }
}
