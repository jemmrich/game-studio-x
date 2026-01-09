/**
 * GameStats Resource
 * Centralized tracking of all game statistics and player state
 * Single source of truth for game progress and performance metrics
 */
export interface GameStatsOptions {
  startingLives?: number;
  startingScore?: number;
}

export class GameStats {
  // Lives System
  currentLives: number;
  bonusLives: number;
  totalDeaths: number;

  // Score
  currentScore: number;
  highScore: number;

  // Weapon Stats
  totalMissilesFired: number;
  totalMissileHits: number;
  totalHyperjumpsUsed: number;

  // Bonus Life Tracking
  bonusLifeThreshold: number = 10000; // Extra life every 10,000 points
  lastBonusLifeScore: number = 0;

  // Death Tracking
  deathsByAsteroid: number;
  deathsBySmallAlien: number;
  deathsByLargeAlien: number;

  // Destruction Tracking
  totalLargeAliensKilled: number;
  totalSmallAliensKilled: number;
  totalLargeAsteroidsDestroyed: number;
  totalMediumAsteroidsDestroyed: number;
  totalSmallAsteroidsDestroyed: number;

  // Wave Metrics
  highWaterMarkAsteroidsInWave: number;

  // Timing
  gameStartTimestamp: number;
  gameEndTimestamp: number | null;

  constructor(options?: GameStatsOptions) {
    const {
      startingLives = 3,
      startingScore = 0,
    } = options || {};

    this.currentLives = startingLives;
    this.bonusLives = 0;
    this.totalDeaths = 0;
    this.currentScore = startingScore;
    this.highScore = this.loadHighScoreFromLocalStorage();
    this.totalMissilesFired = 0;
    this.totalMissileHits = 0;
    this.totalHyperjumpsUsed = 0;

    this.deathsByAsteroid = 0;
    this.deathsBySmallAlien = 0;
    this.deathsByLargeAlien = 0;

    this.totalLargeAliensKilled = 0;
    this.totalSmallAliensKilled = 0;
    this.totalLargeAsteroidsDestroyed = 0;
    this.totalMediumAsteroidsDestroyed = 0;
    this.totalSmallAsteroidsDestroyed = 0;

    this.highWaterMarkAsteroidsInWave = 0;

    this.gameStartTimestamp = Date.now();
    this.gameEndTimestamp = null;
  }

  // Life Management
  loseLife(): void {
    if (this.currentLives > 0) {
      this.currentLives--;
      this.totalDeaths++;
    }
  }

  gainLife(): void {
    this.currentLives++;
  }

  gainBonusLife(): void {
    this.bonusLives++;
    this.gainLife();
  }

  isGameOver(): boolean {
    return this.currentLives <= 0;
  }

  // Score Management
  addScore(points: number): void {
    this.currentScore += points;
    this.checkBonusLifeThreshold();
  }

  checkBonusLifeThreshold(): void {
    while (this.currentScore >= this.lastBonusLifeScore + this.bonusLifeThreshold) {
      this.lastBonusLifeScore += this.bonusLifeThreshold;
      this.gainBonusLife();
    }
  }

  // Destruction with automatic scoring
  destroyLargeAsteroid(): void {
    this.recordLargeAsteroidDestroyed();
    this.addScore(20); // Base points for large asteroid
  }

  destroyMediumAsteroid(): void {
    this.recordMediumAsteroidDestroyed();
    this.addScore(50); // More points for medium
  }

  destroySmallAsteroid(): void {
    this.recordSmallAsteroidDestroyed();
    this.addScore(100); // Most points for small
  }

  killLargeAlien(): void {
    this.recordLargeAlienKilled();
    this.addScore(200); // High value target
  }

  killSmallAlien(): void {
    this.recordSmallAlienKilled();
    this.addScore(1000); // Very high value, harder to hit
  }

  // Tracking Methods
  recordMissileFired(): void {
    this.totalMissilesFired++;
  }

  recordMissileHit(): void {
    this.totalMissileHits++;
  }

  getAccuracy(): number {
    if (this.totalMissilesFired === 0) return 0;
    return (this.totalMissileHits / this.totalMissilesFired) * 100;
  }

  recordHyperjump(): void {
    this.totalHyperjumpsUsed++;
  }

  recordDeathByAsteroid(): void {
    this.deathsByAsteroid++;
    this.loseLife();
  }

  recordDeathBySmallAlien(): void {
    this.deathsBySmallAlien++;
    this.loseLife();
  }

  recordDeathByLargeAlien(): void {
    this.deathsByLargeAlien++;
    this.loseLife();
  }

  recordLargeAlienKilled(): void {
    this.totalLargeAliensKilled++;
  }

  recordSmallAlienKilled(): void {
    this.totalSmallAliensKilled++;
  }

  recordLargeAsteroidDestroyed(): void {
    this.totalLargeAsteroidsDestroyed++;
  }

  recordMediumAsteroidDestroyed(): void {
    this.totalMediumAsteroidsDestroyed++;
  }

  recordSmallAsteroidDestroyed(): void {
    this.totalSmallAsteroidsDestroyed++;
  }

  updateHighWaterMark(asteroidCount: number): void {
    this.highWaterMarkAsteroidsInWave = Math.max(
      this.highWaterMarkAsteroidsInWave,
      asteroidCount
    );
  }

  endGame(): void {
    this.gameEndTimestamp = Date.now();
  }

  getGameDuration(): number {
    const endTime = this.gameEndTimestamp || Date.now();
    return endTime - this.gameStartTimestamp;
  }

  /**
   * Load high score from localStorage
   * Returns 0 if no high score is stored
   */
  private loadHighScoreFromLocalStorage(): number {
    try {
      const stored = globalThis.localStorage?.getItem("asteroids-high-score");
      if (stored !== null) {
        const score = parseInt(stored, 10);
        return isNaN(score) ? 0 : score;
      }
    } catch (error) {
      console.warn("[GameStats] Failed to load high score from localStorage:", error);
    }
    return 0;
  }

  /**
   * Save high score to localStorage if current score is higher
   * Returns true if the score was saved
   */
  saveHighScoreIfHigher(): boolean {
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      try {
        globalThis.localStorage?.setItem("asteroids-high-score", this.highScore.toString());
        console.log(`[GameStats] High score saved: ${this.highScore}`);
        return true;
      } catch (error) {
        console.warn("[GameStats] Failed to save high score to localStorage:", error);
        return false;
      }
    }
    return false;
  }

  reset(options?: GameStatsOptions): void {
    const newStats = new GameStats(options);
    Object.assign(this, newStats);
    console.log(
      `[GameStats] Reset - Lives: ${this.currentLives}, Score: ${this.currentScore}, Deaths: ${this.totalDeaths}`
    );
  }

  // Serialization Methods (for leaderboard submission)
  toJSON(): object {
    return {
      currentLives: this.currentLives,
      bonusLives: this.bonusLives,
      totalDeaths: this.totalDeaths,
      currentScore: this.currentScore,
      highScore: this.highScore,
      totalMissilesFired: this.totalMissilesFired,
      totalMissileHits: this.totalMissileHits,
      totalHyperjumpsUsed: this.totalHyperjumpsUsed,
      deathsByAsteroid: this.deathsByAsteroid,
      deathsBySmallAlien: this.deathsBySmallAlien,
      deathsByLargeAlien: this.deathsByLargeAlien,
      totalLargeAliensKilled: this.totalLargeAliensKilled,
      totalSmallAliensKilled: this.totalSmallAliensKilled,
      totalLargeAsteroidsDestroyed: this.totalLargeAsteroidsDestroyed,
      totalMediumAsteroidsDestroyed: this.totalMediumAsteroidsDestroyed,
      totalSmallAsteroidsDestroyed: this.totalSmallAsteroidsDestroyed,
      highWaterMarkAsteroidsInWave: this.highWaterMarkAsteroidsInWave,
      gameStartTimestamp: this.gameStartTimestamp,
      gameEndTimestamp: this.gameEndTimestamp,
    };
  }

  // Restore from stored stats
  static fromJSON(data: Record<string, unknown>): GameStats {
    const stats = new GameStats();
    Object.assign(stats, data);
    return stats;
  }
}
