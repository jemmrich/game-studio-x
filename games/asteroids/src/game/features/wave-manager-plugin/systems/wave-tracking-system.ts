import type { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "../resources/wave-manager.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";
import { AlienComponent } from "../../alien-plugin/components/alien.ts";

/**
 * WaveTrackingSystem
 * Monitors entity counts and detects wave completion states.
 * - Updates active asteroid and alien counts each frame
 * - Detects when asteroids are cleared (interim state)
 * - Detects when wave is complete (no asteroids AND no aliens)
 * - Emits wave_complete event when appropriate
 * - Listens for wave_transition to reset counts
 */
export class WaveTrackingSystem {
  update(world: World): void {
    const waveManager = world.getResource<WaveManager>("waveManager");
    const time = world.getResource<Time>("time");

    // Update entity counts via queries
    const asteroids = world.query(AsteroidComponent);
    const aliens = world.query(AlienComponent);

    const prevAsteroidCount = waveManager.asteroidCount;
    const prevAlienCount = waveManager.alienCount;

    waveManager.asteroidCount = asteroids.entities().length;
    waveManager.alienCount = aliens.entities().length;

    // Detect asteroids cleared (interim state)
    if (waveManager.asteroidCount === 0 && !waveManager.isAsteroidsCleared) {
      waveManager.isAsteroidsCleared = true;
      console.log(
        `[Wave ${waveManager.currentWaveNumber}] ✓ All asteroids destroyed, awaiting alien completion...`,
      );
    }

    // Detect wave completion (no asteroids AND no aliens)
    if (
      waveManager.asteroidCount === 0 &&
      waveManager.alienCount === 0 &&
      waveManager.hasSpawnedAsteroidsThisWave &&
      !waveManager.isWaveComplete
    ) {
      waveManager.isWaveComplete = true;

      // Calculate wave duration
      const waveDuration = time.elapsed - waveManager.waveStartTime;
      waveManager.previousWaveDuration = waveDuration;

      // Capture destroyed counts BEFORE emitting events (they will be reset)
      const asteroidsDestroyed = waveManager.asteroidsDestroyedThisWave;
      const aliensDestroyed = waveManager.aliensDestroyedThisWave;
      const completedWaveNumber = waveManager.currentWaveNumber;

      // Emit wave_complete event
      world.emitEvent("wave_complete", {
        waveNumber: waveManager.currentWaveNumber,
        asteroidsDestroyed: asteroidsDestroyed,
        aliensDestroyed: aliensDestroyed,
        waveDuration: waveDuration,
        waveStartTime: waveManager.waveStartTime,
      });

      waveManager.lastEventEmitted = "wave_complete";
    }
  }
}

// Listen for wave_transition event to reset counts
export function setupWaveTrackingEventListeners(world: World): void {
  const waveManager = world.getResource<WaveManager>("waveManager");
  const time = world.getResource<Time>("time");

  world.onEvent("wave_transition", () => {
    waveManager.resetForNewWave(time.elapsed);
    console.log(
      `[Wave Tracking] Ready for Wave ${waveManager.currentWaveNumber}`,
    );
  });
}
