/**
 * WaveManager Resource
 * Tracks wave state, entity counts, and game progression.
 * Persists across scene transitions and provides single source of truth for wave data.
 */

export interface WaveManagerOptions {
  startingWaveNumber?: number;
  startingDifficultyMultiplier?: number;
}

export class WaveManager {
  // Wave Progression
  currentWaveNumber: number;
  totalWavesCompleted: number;

  // Entity Tracking
  asteroidCount: number;
  alienCount: number;

  // Timing
  waveStartTime: number;
  previousWaveDuration?: number;

  // State
  isWaveComplete: boolean;
  isAsteroidsCleared: boolean;
  difficultyMultiplier: number;

  // Metadata
  lastEventEmitted: string;

  constructor(options?: WaveManagerOptions) {
    const {
      startingWaveNumber = 1,
      startingDifficultyMultiplier = 1.0,
    } = options || {};

    this.currentWaveNumber = startingWaveNumber;
    this.totalWavesCompleted = startingWaveNumber - 1;
    this.asteroidCount = 0;
    this.alienCount = 0;
    this.waveStartTime = 0; // Will be set when wave starts
    this.isWaveComplete = false;
    this.isAsteroidsCleared = false;
    this.difficultyMultiplier = startingDifficultyMultiplier;
    this.lastEventEmitted = "initialized";
  }

  /**
   * Reset counts for a new wave
   * Called when transitioning to next wave
   */
  resetForNewWave(currentTime: number): void {
    this.asteroidCount = 0;
    this.alienCount = 0;
    this.isWaveComplete = false;
    this.isAsteroidsCleared = false;
    this.waveStartTime = currentTime;
  }
}
