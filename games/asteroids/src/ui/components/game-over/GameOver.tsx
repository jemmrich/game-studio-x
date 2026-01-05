import React from 'react';
import './GameOver.css';

export const GameOver: React.FC = () => {
  return (
    <div className="game-over-container">
      <div className="game-over-content">
        <h1 className="game-over-title">GAME OVER</h1>
        <p className="game-over-prompt">Press Any Key to Return to Menu</p>
      </div>
    </div>
  );
};
