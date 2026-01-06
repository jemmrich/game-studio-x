import React, { useEffect, useState } from 'react';
import type { World } from '@engine/core/world.ts';
import type { GameStats } from '../../../game/resources/game-stats.ts';
import './Hud.css';

interface HudProps {
  world?: World;
  score?: number;
  highScore?: number;
  lives?: number;
}

export const Hud: React.FC<HudProps> = ({
  world,
  score: _score = 0,
  highScore: _highScore = 0,
  lives: _initialLives = 3,
}) => {
  const [lives, setLives] = useState(_initialLives);
  const [score, setScore] = useState(_score);
  const [highScore, setHighScore] = useState(_highScore);

  useEffect(() => {
    if (!world) return;

    // Update game stats every frame from GameStats resource
    const updateGameStats = () => {
      const gameStats = world.getResource<GameStats>("gameStats");
      if (gameStats) {
        setLives(gameStats.currentLives);
        setScore(gameStats.currentScore);
        setHighScore(gameStats.highScore ?? 0);
      }
    };

    const frameId = setInterval(updateGameStats, 1000 / 60); // 60fps
    return () => clearInterval(frameId);
  }, [world]);

  return (
    <div className="hud">
      <div className="hud-column">
        <div className="score-label">SCORE</div>
        <div className="score-value">{score.toString().padStart(6, '0')}</div>
      </div>

      <div className="hud-column">
        <div className="high-score-label hide">HIGH SCORE</div>
        <div className="high-score-value">{highScore.toString().padStart(6, '0')}</div>
      </div>

      <div className="hud-column">
        <div className="lives-label">LIVES</div>
        <div className="lives-value">{lives}</div>
      </div>
    </div>
  );
};

export default Hud;
