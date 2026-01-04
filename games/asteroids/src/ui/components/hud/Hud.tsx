import React, { useEffect, useState } from 'react';
import type { World } from '@engine/core/world.ts';
import { ShipComponent } from '../../../game/features/ship-plugin/components/ship.ts';
import './Hud.css';

interface HudProps {
  world?: World;
  score?: number;
  highScore?: number;
  lives?: number;
}

export const Hud: React.FC<HudProps> = ({
  world,
  score = 0,
  highScore = 0,
  lives: initialLives = 3,
}) => {
  const [lives, setLives] = useState(initialLives);

  useEffect(() => {
    if (!world) return;

    // Update lives every frame from ShipComponent
    const updateLives = () => {
      const shipEntities = Array.from(world.query(ShipComponent).entities());
      if (shipEntities.length > 0) {
        const ship = world.get<ShipComponent>(shipEntities[0], ShipComponent);
        if (ship) {
          setLives(ship.lives);
        }
      }
    };

    const frameId = setInterval(updateLives, 1000 / 60); // 60fps
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
