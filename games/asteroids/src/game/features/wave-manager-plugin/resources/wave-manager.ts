/**
 * WaveManager Resource
 * Tracks wave state, entity counts, and progression through waves
 */
export interface WaveManagerOptions {
  startingWaveNumber?: number;
  startingDifficultyMultiplier?: number;
}

export class WaveManager {
  // Wave state
  currentWaveNumber: number = 1;
  totalWavesCompleted: number = 0;

  // Entity counts (updated by WaveTrackingSystem each frame)
  asteroidCount: number = 0;
  alienCount: number = 0;

  // Destruction tracking
  asteroidsDestroyedThisWave: number = 0;
  aliensDestroyedThisWave: number = 0;

  // Wave state flags
  isAsteroidsCleared: boolean = false;
  isWaveComplete: boolean = false;

  // Difficulty
  difficultyMultiplier: number = 1.0;

  // Timing
  waveStartTime: number = 0;
  previousWaveDuration: number = 0;

  // Debug
  lastEventEmitted: string = "";

  constructor(options?: WaveManagerOptions) {
    const {
      startingWaveNumber = 1,
      startingDifficultyMultiplier = 1.0,
    } = options || {};
    
    this.currentWaveNumber = startingWaveNumber;
    this.totalWavesCompleted = startingWaveNumber - 1;
    this.difficultyMultiplier = startingDifficultyMultiplier;
  }

  /**
   * Reset counters and flags for a new wave
   */
  resetForNewWave(currentTime: number): void {
    this.asteroidCount = 0;
    this.alienCount = 0;
    this.asteroidsDestroyedThisWave = 0;
    this.aliensDestroyedThisWave = 0;
    this.isAsteroidsCleared = false;
    this.isWaveComplete = false;
    this.waveStartTime = currentTime;
  }

  /**
   * Record an asteroid destruction
   */
  recordAsteroidDestroyed(): void {
    this.asteroidsDestroyedThisWave++;
  }

  /**
   * Record an alien destruction
   */
  recordAlienDestroyed(): void {
    this.aliensDestroyedThisWave++;
  }
}
