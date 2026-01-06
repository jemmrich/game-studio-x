import type { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "../resources/wave-manager.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";
import { AlienComponent } from "../../alien-plugin/components/alien.ts";
import type { GameStats } from "../../game-stats-plugin/resources/game-stats.ts";

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

    // Update high water mark for asteroid count in GameStats
    const gameStats = world.getResource<GameStats>("gameStats");
    if (gameStats) {
      gameStats.updateHighWaterMark(waveManager.asteroidCount);
      if (waveManager.asteroidCount > 0) {
        console.log(
          `[Wave Tracking] Asteroids: ${waveManager.asteroidCount}, High Water Mark: ${gameStats.highWaterMarkAsteroidsInWave}`
        );
      }
    }

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

      // Capture destroyed counts from GameStats
      const gameStats = world.getResource<GameStats>("gameStats");
      const asteroidsDestroyed = gameStats
        ? gameStats.totalLargeAsteroidsDestroyed +
          gameStats.totalMediumAsteroidsDestroyed +
          gameStats.totalSmallAsteroidsDestroyed
        : 0;
      const aliensDestroyed = gameStats
        ? gameStats.totalLargeAliensKilled + gameStats.totalSmallAliensKilled
        : 0;
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
  const gameStats = world.getResource<GameStats>("gameStats");

  // Listen for start_wave (Wave 1) - Reset high water mark for actual gameplay
  world.onEvent("start_wave", () => {
    if (gameStats) {
      gameStats.highWaterMarkAsteroidsInWave = 0;
    }
    console.log("[Wave Tracking] Starting Wave 1 - High water mark reset");
  });

  // Listen for wave_transition (Wave 2+)
  // Note: resetForNewWave is called by WaveInitializationSystem when asteroids are spawned
  world.onEvent("wave_transition", () => {
    console.log(
      `[Wave Tracking] Ready for Wave ${waveManager.currentWaveNumber}`,
    );
  });
}
