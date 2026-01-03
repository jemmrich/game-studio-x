import { useEffect, useState } from "react";
import type { World } from "@engine/core/world.ts";
import { ShipComponent } from "../../../game/features/ship-plugin/components/ship.ts";
import type { WaveManager } from "../../../game/resources/wave-manager.ts";
import "./DebugInfo.css";

interface DebugInfoProps {
  world: World;
}

interface DebugState {
  lives: number;
  isInvincible: boolean;
  asteroidCount: number;
}

export function DebugInfo({ world }: DebugInfoProps) {
  const [debugState, setDebugState] = useState<DebugState>({
    lives: 0,
    isInvincible: false,
    asteroidCount: 0,
  });

  useEffect(() => {
    // Update debug info every frame
    const updateDebugInfo = () => {
      // Get ship component for lives and invincibility
      let lives = 0;
      let isInvincible = false;

      // Find the ship entity by querying for ShipComponent
      const shipEntities = Array.from(world.query(ShipComponent).entities());
      if (shipEntities.length > 0) {
        const ship = world.get<ShipComponent>(shipEntities[0], ShipComponent);
        if (ship) {
          lives = ship.lives;
          isInvincible = ship.isInvincible;
        }
      }

      // Get asteroid count from WaveManager
      const waveManager = world.getResource<WaveManager>("waveManager");
      const asteroidCount = waveManager?.asteroidCount ?? 0;

      setDebugState({
        lives,
        isInvincible,
        asteroidCount,
      });
    };

    // Update on every frame
    const frameId = setInterval(updateDebugInfo, 1000 / 60); // 60fps
    return () => clearInterval(frameId);
  }, [world]);

  return (
    <div className="debug-info">
      <div className="debug-item">
        <span className="debug-label">Lives:</span>
        <span className="debug-value">{debugState.lives}</span>
      </div>
      <div className="debug-item">
        <span className="debug-label">Invincibility:</span>
        <span className={`debug-value ${debugState.isInvincible ? "active" : ""}`}>
          {debugState.isInvincible ? "ON" : "OFF"}
        </span>
      </div>
      <div className="debug-item">
        <span className="debug-label">Asteroids:</span>
        <span className="debug-value">{debugState.asteroidCount}</span>
      </div>
    </div>
  );
}
