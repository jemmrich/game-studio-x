import { describe, it, expect } from "vitest";
import { GameStats } from "./game-stats.ts";

describe("GameStats", () => {
  it("constructor", () => {
    const stats = new GameStats();
    expect(stats.currentLives).toBe(3);
    expect(stats.bonusLives).toBe(0);
    expect(stats.totalDeaths).toBe(0);
    expect(stats.currentScore).toBe(0);
    expect(stats.totalMissilesFired).toBe(0);
    expect(stats.totalMissileHits).toBe(0);
    expect(stats.totalHyperjumpsUsed).toBe(0);
    expect(stats.deathsByAsteroid).toBe(0);
    expect(stats.deathsBySmallAlien).toBe(0);
    expect(stats.deathsByLargeAlien).toBe(0);
    expect(stats.totalLargeAliensKilled).toBe(0);
    expect(stats.totalSmallAliensKilled).toBe(0);
    expect(stats.totalLargeAsteroidsDestroyed).toBe(0);
    expect(stats.totalMediumAsteroidsDestroyed).toBe(0);
    expect(stats.totalSmallAsteroidsDestroyed).toBe(0);
    expect(stats.highWaterMarkAsteroidsInWave).toBe(0);
    expect(stats.gameEndTimestamp).toBe(null);
  });

  it("constructor with options", () => {
    const stats = new GameStats({ startingLives: 5, startingScore: 1000 });
    expect(stats.currentLives).toBe(5);
    expect(stats.currentScore).toBe(1000);
  });

  // Life Management Tests
  it("loseLife decrements lives", () => {
    const stats = new GameStats();
    stats.loseLife();
    expect(stats.currentLives).toBe(2);
    expect(stats.totalDeaths).toBe(1);
  });

  it("loseLife stops at zero", () => {
    const stats = new GameStats({ startingLives: 0 });
    stats.loseLife();
    expect(stats.currentLives).toBe(0);
    expect(stats.totalDeaths).toBe(0);
  });

  it("gainLife increments lives", () => {
    const stats = new GameStats();
    stats.gainLife();
    expect(stats.currentLives).toBe(4);
  });

  it("gainBonusLife increments bonus lives and lives", () => {
    const stats = new GameStats();
    stats.gainBonusLife();
    expect(stats.bonusLives).toBe(1);
    expect(stats.currentLives).toBe(4);
  });

  it("isGameOver returns correct status", () => {
    const stats = new GameStats({ startingLives: 1 });
    expect(stats.isGameOver()).toBe(false);
    stats.loseLife();
    expect(stats.isGameOver()).toBe(true);
  });

  // Score Management Tests
  it("addScore increments score", () => {
    const stats = new GameStats();
    stats.addScore(100);
    expect(stats.currentScore).toBe(100);
    stats.addScore(50);
    expect(stats.currentScore).toBe(150);
  });

  it("addScore triggers bonus life at threshold", () => {
    const stats = new GameStats();
    stats.addScore(10000);
    expect(stats.currentScore).toBe(10000);
    expect(stats.bonusLives).toBe(1);
    expect(stats.currentLives).toBe(4);
  });

  it("addScore triggers multiple bonus lives", () => {
    const stats = new GameStats();
    stats.addScore(30000);
    expect(stats.currentScore).toBe(30000);
    expect(stats.bonusLives).toBe(3);
    expect(stats.currentLives).toBe(6);
  });

  it("checkBonusLifeThreshold with partial progress", () => {
    const stats = new GameStats();
    stats.addScore(5000);
    expect(stats.bonusLives).toBe(0);
    stats.addScore(5000);
    expect(stats.bonusLives).toBe(1);
  });

  // Destruction with Scoring Tests
  it("destroyLargeAsteroid records and scores", () => {
    const stats = new GameStats();
    stats.destroyLargeAsteroid();
    expect(stats.totalLargeAsteroidsDestroyed).toBe(1);
    expect(stats.currentScore).toBe(20);
  });

  it("destroyMediumAsteroid records and scores", () => {
    const stats = new GameStats();
    stats.destroyMediumAsteroid();
    expect(stats.totalMediumAsteroidsDestroyed).toBe(1);
    expect(stats.currentScore).toBe(50);
  });

  it("destroySmallAsteroid records and scores", () => {
    const stats = new GameStats();
    stats.destroySmallAsteroid();
    expect(stats.totalSmallAsteroidsDestroyed).toBe(1);
    expect(stats.currentScore).toBe(100);
  });

  it("killLargeAlien records and scores", () => {
    const stats = new GameStats();
    stats.killLargeAlien();
    expect(stats.totalLargeAliensKilled).toBe(1);
    expect(stats.currentScore).toBe(200);
  });

  it("killSmallAlien records and scores", () => {
    const stats = new GameStats();
    stats.killSmallAlien();
    expect(stats.totalSmallAliensKilled).toBe(1);
    expect(stats.currentScore).toBe(1000);
  });

  // Missile Tracking Tests
  it("recordMissileFired increments counter", () => {
    const stats = new GameStats();
    stats.recordMissileFired();
    expect(stats.totalMissilesFired).toBe(1);
  });

  it("recordMissileHit increments counter", () => {
    const stats = new GameStats();
    stats.recordMissileHit();
    expect(stats.totalMissileHits).toBe(1);
  });

  it("getAccuracy returns 0 when no missiles fired", () => {
    const stats = new GameStats();
    expect(stats.getAccuracy()).toBe(0);
  });

  it("getAccuracy calculates percentage correctly", () => {
    const stats = new GameStats();
    stats.recordMissileFired();
    stats.recordMissileFired();
    stats.recordMissileFired();
    stats.recordMissileFired();
    stats.recordMissileHit();
    stats.recordMissileHit();
    const accuracy = stats.getAccuracy();
    expect(accuracy).toBe(50);
  });

  it("getAccuracy 100% when all hit", () => {
    const stats = new GameStats();
    stats.recordMissileFired();
    stats.recordMissileFired();
    stats.recordMissileHit();
    stats.recordMissileHit();
    expect(stats.getAccuracy()).toBe(100);
  });

  // Hyperjump Tracking Tests
  it("recordHyperjump increments counter", () => {
    const stats = new GameStats();
    stats.recordHyperjump();
    expect(stats.totalHyperjumpsUsed).toBe(1);
    stats.recordHyperjump();
    expect(stats.totalHyperjumpsUsed).toBe(2);
  });

  // Death Tracking Tests
  it("recordDeathByAsteroid tracks and decreases lives", () => {
    const stats = new GameStats();
    stats.recordDeathByAsteroid();
    expect(stats.deathsByAsteroid).toBe(1);
    expect(stats.totalDeaths).toBe(1);
    expect(stats.currentLives).toBe(2);
  });

  it("recordDeathBySmallAlien tracks and decreases lives", () => {
    const stats = new GameStats();
    stats.recordDeathBySmallAlien();
    expect(stats.deathsBySmallAlien).toBe(1);
    expect(stats.totalDeaths).toBe(1);
    expect(stats.currentLives).toBe(2);
  });

  it("recordDeathByLargeAlien tracks and decreases lives", () => {
    const stats = new GameStats();
    stats.recordDeathByLargeAlien();
    expect(stats.deathsByLargeAlien).toBe(1);
    expect(stats.totalDeaths).toBe(1);
    expect(stats.currentLives).toBe(2);
  });

  // Alien Killed Tracking Tests
  it("recordLargeAlienKilled increments counter", () => {
    const stats = new GameStats();
    stats.recordLargeAlienKilled();
    expect(stats.totalLargeAliensKilled).toBe(1);
  });

  it("recordSmallAlienKilled increments counter", () => {
    const stats = new GameStats();
    stats.recordSmallAlienKilled();
    expect(stats.totalSmallAliensKilled).toBe(1);
  });

  // Asteroid Destroyed Tracking Tests
  it("recordLargeAsteroidDestroyed increments counter", () => {
    const stats = new GameStats();
    stats.recordLargeAsteroidDestroyed();
    expect(stats.totalLargeAsteroidsDestroyed).toBe(1);
  });

  it("recordMediumAsteroidDestroyed increments counter", () => {
    const stats = new GameStats();
    stats.recordMediumAsteroidDestroyed();
    expect(stats.totalMediumAsteroidsDestroyed).toBe(1);
  });

  it("recordSmallAsteroidDestroyed increments counter", () => {
    const stats = new GameStats();
    stats.recordSmallAsteroidDestroyed();
    expect(stats.totalSmallAsteroidsDestroyed).toBe(1);
  });

  // High Water Mark Tests
  it("updateHighWaterMark tracks maximum", () => {
    const stats = new GameStats();
    stats.updateHighWaterMark(5);
    expect(stats.highWaterMarkAsteroidsInWave).toBe(5);
    stats.updateHighWaterMark(3);
    expect(stats.highWaterMarkAsteroidsInWave).toBe(5);
    stats.updateHighWaterMark(10);
    expect(stats.highWaterMarkAsteroidsInWave).toBe(10);
  });

  // Game Duration Tests
  it("getGameDuration returns elapsed time", async () => {
    const stats = new GameStats();
    await new Promise(resolve => setTimeout(resolve, 100));
    const duration = stats.getGameDuration();
    // Should be at least 100ms, allow some variance
    expect(duration >= 90).toBe(true);
  });

  it("getGameDuration after endGame", async () => {
    const stats = new GameStats();
    await new Promise(resolve => setTimeout(resolve, 100));
    stats.endGame();
    const duration = stats.getGameDuration();
    // Duration should be based on gameEndTimestamp, not current time
    expect(duration >= 90).toBe(true);
  });

  it("endGame sets gameEndTimestamp", () => {
    const stats = new GameStats();
    expect(stats.gameEndTimestamp).toBe(null);
    stats.endGame();
    expect(stats.gameEndTimestamp !== null).toBe(true);
  });

  // Reset Tests
  it("reset resets to initial state", () => {
    const stats = new GameStats({ startingLives: 5, startingScore: 500 });
    stats.addScore(1000);
    stats.loseLife();
    stats.recordMissileFired();
    
    stats.reset();
    
    expect(stats.currentLives).toBe(3);
    expect(stats.currentScore).toBe(0);
    expect(stats.totalDeaths).toBe(0);
    expect(stats.totalMissilesFired).toBe(0);
  });

  it("reset with options resets with new values", () => {
    const stats = new GameStats();
    stats.addScore(1000);
    
    stats.reset({ startingLives: 5, startingScore: 200 });
    
    expect(stats.currentLives).toBe(5);
    expect(stats.currentScore).toBe(200);
  });

  // Serialization Tests
  it("toJSON serializes all properties", () => {
    const stats = new GameStats();
    stats.addScore(500);
    stats.recordMissileFired();
    stats.recordMissileHit();
    stats.destroyLargeAsteroid();
    stats.recordDeathByAsteroid();
    
    const json = stats.toJSON() as Record<string, unknown>;
    
    expect(json.currentLives).toBe(2);
    expect(json.currentScore).toBe(520);
    expect(json.totalMissilesFired).toBe(1);
    expect(json.totalMissileHits).toBe(1);
    expect(json.totalLargeAsteroidsDestroyed).toBe(1);
    expect(json.deathsByAsteroid).toBe(1);
    expect(json.gameEndTimestamp).toBe(null);
  });

  it("fromJSON deserializes all properties", () => {
    const original = new GameStats();
    original.addScore(500);
    original.recordMissileFired();
    original.recordMissileHit();
    original.destroyLargeAsteroid();
    original.endGame();
    
    const json = original.toJSON() as Record<string, unknown>;
    const restored = GameStats.fromJSON(json);
    
    expect(restored.currentLives).toBe(original.currentLives);
    expect(restored.currentScore).toBe(original.currentScore);
    expect(restored.totalMissilesFired).toBe(original.totalMissilesFired);
    expect(restored.totalMissileHits).toBe(original.totalMissileHits);
    expect(restored.totalLargeAsteroidsDestroyed).toBe(original.totalLargeAsteroidsDestroyed);
    expect(restored.gameEndTimestamp).toBe(original.gameEndTimestamp);
  });

  // Integration Tests - Complex Scenarios
  it("complex gameplay scenario", () => {
    const stats = new GameStats({ startingLives: 3, startingScore: 0 });
    
    // Fire missiles and hit some
    for (let i = 0; i < 10; i++) {
      stats.recordMissileFired();
      if (i % 3 === 0) {
        stats.recordMissileHit();
      }
    }
    
    // Destroy asteroids
    stats.destroyLargeAsteroid();  // 20 pts
    stats.destroyMediumAsteroid(); // 50 pts
    stats.destroySmallAsteroid();  // 100 pts
    
    // Die and respawn
    stats.recordDeathByAsteroid();
    
    // Get accuracy
    const accuracy = stats.getAccuracy();
    
    // Verify state
    expect(stats.currentLives).toBe(2);
    expect(stats.currentScore).toBe(170);
    expect(stats.totalMissilesFired).toBe(10);
    expect(stats.totalMissileHits).toBe(4);
    expect(accuracy).toBe(40);
    expect(stats.deathsByAsteroid).toBe(1);
    expect(stats.totalDeaths).toBe(1);
    expect(stats.totalLargeAsteroidsDestroyed).toBe(1);
    expect(stats.totalMediumAsteroidsDestroyed).toBe(1);
    expect(stats.totalSmallAsteroidsDestroyed).toBe(1);
  });

  it("bonus life progression", () => {
    const stats = new GameStats();
    
    // Each threshold awards a bonus life
    expect(stats.currentLives).toBe(3);
    expect(stats.bonusLives).toBe(0);
    
    stats.addScore(10000);
    expect(stats.bonusLives).toBe(1);
    expect(stats.currentLives).toBe(4);
    
    stats.addScore(10000);
    expect(stats.bonusLives).toBe(2);
    expect(stats.currentLives).toBe(5);
    
    stats.addScore(10000);
    expect(stats.bonusLives).toBe(3);
    expect(stats.currentLives).toBe(6);
  });

  it("tracking multiple death types", () => {
    const stats = new GameStats();
    
    stats.recordDeathByAsteroid();
    stats.recordDeathByAsteroid();
    stats.recordDeathBySmallAlien();
    stats.recordDeathByLargeAlien();
    
    expect(stats.deathsByAsteroid).toBe(2);
    expect(stats.deathsBySmallAlien).toBe(1);
    expect(stats.deathsByLargeAlien).toBe(1);
    expect(stats.totalDeaths).toBe(3);
    expect(stats.currentLives).toBe(0);
  });
});
