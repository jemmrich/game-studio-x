import { useEffect, useState } from "react";
import type { World } from "@engine/core/world.ts";
import { ShipComponent } from "../../../game/features/ship-plugin/components/ship.ts";
import type { GameStats } from "../../../game/resources/game-stats.ts";
import type { WaveManager } from "../../../game/resources/wave-manager.ts";
import "./DebugInfo.css";

interface DebugInfoProps {
  world: World;
}

interface DebugState {
  lives: number;
  bonusLives: number;
  totalDeaths: number;
  score: number;
  isInvincible: boolean;
  asteroidCount: number;
  waveNumber: number;
  totalMissilesFired: number;
  totalMissileHits: number;
  accuracy: number;
  totalHyperjumpsUsed: number;
  totalLargeAsteroidsDestroyed: number;
  totalMediumAsteroidsDestroyed: number;
  totalSmallAsteroidsDestroyed: number;
  totalAsteroidsDestroyed: number;
  totalLargeAliensKilled: number;
  totalSmallAliensKilled: number;
  deathsByAsteroid: number;
  deathsBySmallAlien: number;
  deathsByLargeAlien: number;
  highWaterMarkAsteroidsInWave: number;
}

export function DebugInfo({ world }: DebugInfoProps) {
  const [debugState, setDebugState] = useState<DebugState>({
    lives: 0,
    bonusLives: 0,
    totalDeaths: 0,
    score: 0,
    isInvincible: false,
    asteroidCount: 0,
    waveNumber: 1,
    totalMissilesFired: 0,
    totalMissileHits: 0,
    accuracy: 0,
    totalHyperjumpsUsed: 0,
    totalLargeAsteroidsDestroyed: 0,
    totalMediumAsteroidsDestroyed: 0,
    totalSmallAsteroidsDestroyed: 0,
    totalAsteroidsDestroyed: 0,
    totalLargeAliensKilled: 0,
    totalSmallAliensKilled: 0,
    deathsByAsteroid: 0,
    deathsBySmallAlien: 0,
    deathsByLargeAlien: 0,
    highWaterMarkAsteroidsInWave: 0,
  });

  useEffect(() => {
    // Update debug info every frame
    const updateDebugInfo = () => {
      // Get GameStats resource
      const gameStats = world.getResource<GameStats>("gameStats");
      let lives = 0;
      let bonusLives = 0;
      let totalDeaths = 0;
      let score = 0;
      let totalMissilesFired = 0;
      let totalMissileHits = 0;
      let accuracy = 0;
      let totalHyperjumpsUsed = 0;
      let totalLargeAsteroidsDestroyed = 0;
      let totalMediumAsteroidsDestroyed = 0;
      let totalSmallAsteroidsDestroyed = 0;
      let totalAsteroidsDestroyed = 0;
      let totalLargeAliensKilled = 0;
      let totalSmallAliensKilled = 0;
      let deathsByAsteroid = 0;
      let deathsBySmallAlien = 0;
      let deathsByLargeAlien = 0;
      let highWaterMarkAsteroidsInWave = 0;

      if (gameStats) {
        lives = gameStats.currentLives;
        bonusLives = gameStats.bonusLives;
        totalDeaths = gameStats.totalDeaths;
        score = gameStats.currentScore;
        totalMissilesFired = gameStats.totalMissilesFired;
        totalMissileHits = gameStats.totalMissileHits;
        accuracy = gameStats.getAccuracy();
        totalHyperjumpsUsed = gameStats.totalHyperjumpsUsed;
        totalLargeAsteroidsDestroyed = gameStats.totalLargeAsteroidsDestroyed;
        totalMediumAsteroidsDestroyed = gameStats.totalMediumAsteroidsDestroyed;
        totalSmallAsteroidsDestroyed = gameStats.totalSmallAsteroidsDestroyed;
        totalAsteroidsDestroyed = totalLargeAsteroidsDestroyed + totalMediumAsteroidsDestroyed + totalSmallAsteroidsDestroyed;
        totalLargeAliensKilled = gameStats.totalLargeAliensKilled;
        totalSmallAliensKilled = gameStats.totalSmallAliensKilled;
        deathsByAsteroid = gameStats.deathsByAsteroid;
        deathsBySmallAlien = gameStats.deathsBySmallAlien;
        deathsByLargeAlien = gameStats.deathsByLargeAlien;
        highWaterMarkAsteroidsInWave = gameStats.highWaterMarkAsteroidsInWave;
      }

      // Get invincibility from ShipComponent
      let isInvincible = false;
      const shipEntities = Array.from(world.query(ShipComponent).entities());
      if (shipEntities.length > 0) {
        const ship = world.get<ShipComponent>(shipEntities[0], ShipComponent);
        if (ship) {
          isInvincible = ship.isInvincible;
        }
      }

      // Get asteroid count from WaveManager
      const waveManager = world.getResource<WaveManager>("waveManager");
      const asteroidCount = waveManager?.asteroidCount ?? 0;
      const waveNumber = waveManager?.currentWaveNumber ?? 1;

      setDebugState({
        lives,
        bonusLives,
        totalDeaths,
        score,
        isInvincible,
        asteroidCount,
        waveNumber,
        totalMissilesFired,
        totalMissileHits,
        accuracy,
        totalHyperjumpsUsed,
        totalLargeAsteroidsDestroyed,
        totalMediumAsteroidsDestroyed,
        totalSmallAsteroidsDestroyed,
        totalAsteroidsDestroyed,
        totalLargeAliensKilled,
        totalSmallAliensKilled,
        deathsByAsteroid,
        deathsBySmallAlien,
        deathsByLargeAlien,
        highWaterMarkAsteroidsInWave,
      });
    };

    // Update on every frame
    const frameId = setInterval(updateDebugInfo, 1000 / 60); // 60fps
    return () => clearInterval(frameId);
  }, [world]);

  return (
    <div className="debug-info">
      <div className="debug-section">
        <h3 className="debug-section-title">Game State</h3>
        <div className="debug-item">
          <span className="debug-label">Wave:</span>
          <span className="debug-value">{debugState.waveNumber}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Asteroids:</span>
          <span className="debug-value">{debugState.asteroidCount}</span>
        </div>
      </div>

      <div className="debug-section">
        <h3 className="debug-section-title">Lives & Score</h3>
        <div className="debug-item">
          <span className="debug-label">Lives:</span>
          <span className="debug-value">{debugState.lives}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Bonus Lives:</span>
          <span className="debug-value">{debugState.bonusLives}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Score:</span>
          <span className="debug-value">{debugState.score.toString().padStart(6, '0')}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Deaths:</span>
          <span className="debug-value">{debugState.totalDeaths}</span>
        </div>
      </div>

      <div className="debug-section">
        <h3 className="debug-section-title">Weapon Stats</h3>
        <div className="debug-item">
          <span className="debug-label">Missiles Fired:</span>
          <span className="debug-value">{debugState.totalMissilesFired}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Missiles Hit:</span>
          <span className="debug-value">{debugState.totalMissileHits}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Accuracy:</span>
          <span className="debug-value">{debugState.accuracy.toFixed(1)}%</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Hyperjumps:</span>
          <span className="debug-value">{debugState.totalHyperjumpsUsed}</span>
        </div>
      </div>

      <div className="debug-section">
        <h3 className="debug-section-title">Destruction Stats</h3>
        <div className="debug-item">
          <span className="debug-label">Total Asteroids:</span>
          <span className="debug-value">{debugState.totalAsteroidsDestroyed}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Large Asteroids:</span>
          <span className="debug-value">{debugState.totalLargeAsteroidsDestroyed}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Medium Asteroids:</span>
          <span className="debug-value">{debugState.totalMediumAsteroidsDestroyed}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Small Asteroids:</span>
          <span className="debug-value">{debugState.totalSmallAsteroidsDestroyed}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Large Aliens:</span>
          <span className="debug-value">{debugState.totalLargeAliensKilled}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Small Aliens:</span>
          <span className="debug-value">{debugState.totalSmallAliensKilled}</span>
        </div>
      </div>

      <div className="debug-section">
        <h3 className="debug-section-title">Death Breakdown</h3>
        <div className="debug-item">
          <span className="debug-label">By Asteroid:</span>
          <span className="debug-value">{debugState.deathsByAsteroid}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">By Small Alien:</span>
          <span className="debug-value">{debugState.deathsBySmallAlien}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">By Large Alien:</span>
          <span className="debug-value">{debugState.deathsByLargeAlien}</span>
        </div>
      </div>

      <div className="debug-section">
        <h3 className="debug-section-title">Status</h3>
        <div className="debug-item">
          <span className="debug-label">Invincibility:</span>
          <span className={`debug-value ${debugState.isInvincible ? "active" : ""}`}>
            {debugState.isInvincible ? "ON" : "OFF"}
          </span>
        </div>
        <div className="debug-item">
          <span className="debug-label">High Water Mark:</span>
          <span className="debug-value">{debugState.highWaterMarkAsteroidsInWave}</span>
        </div>
      </div>
    </div>
  );
}
