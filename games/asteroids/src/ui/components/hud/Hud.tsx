import React from 'react';
import './Hud.css';

interface HudProps {
  score?: number;
  highScore?: number;
  lives?: number;
}

export const Hud: React.FC<HudProps> = ({
  score = 0,
  highScore = 0,
  lives = 3,
}) => {
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
