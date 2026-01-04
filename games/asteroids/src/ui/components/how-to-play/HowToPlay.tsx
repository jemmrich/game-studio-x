import React from 'react';
import './HowToPlay.css';

interface KeyProps {
  label: string;
  size?: 'small' | 'normal' | 'wide';
}

const Key: React.FC<KeyProps> = ({ label, size = 'normal' }) => (
  <span className={`key key-${size}`}>{label}</span>
);

export const HowToPlay: React.FC = () => {
  return (
    <div className="how-to-play-container">
      <div className="how-to-play-content">
        <h1 className="how-to-play-title">HOW TO PLAY</h1>

        <div className="instructions-section">
          <h2 className="section-title">OBJECTIVE</h2>
          <p className="instruction-text">
            Destroy all asteroids before they collide with your ship. Each asteroid destroyed
            breaks into smaller pieces. Clear all asteroids to advance to the next wave.
          </p>
        </div>

        <div className="two-column-layout">
          <div className="left-column">
            <div className="instructions-section">
              <h2 className="section-title">CONTROLS</h2>
              
              <div className="control-group">
                <div className="control-row">
                  <span className="control-label">ROTATE LEFT</span>
                  <div className="control-keys">
                    <Key label="A" /> or <Key label="←" />
                  </div>
                </div>
                
                <div className="control-row">
                  <span className="control-label">ROTATE RIGHT</span>
                  <div className="control-keys">
                    <Key label="D" /> or <Key label="→" />
                  </div>
                </div>
                
                <div className="control-row">
                  <span className="control-label">THRUST FORWARD</span>
                  <div className="control-keys">
                    <Key label="W" /> or <Key label="↑" />
                  </div>
                </div>
                
                <div className="control-row">
                  <span className="control-label">FIRE</span>
                  <div className="control-keys">
                    <Key label="SPACE" size="wide" />
                  </div>
                </div>
                
                <div className="control-row">
                  <span className="control-label">HYPER JUMP</span>
                  <div className="control-keys">
                    <Key label="Q" />
                  </div>
                </div>
                
                <div className="control-row">
                  <span className="control-label">PAUSE</span>
                  <div className="control-keys">
                    <Key label="P" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="instructions-section">
              <h2 className="section-title">TIPS</h2>
              <ul className="tips-list">
                <li>Avoid asteroids - one collision and it's game over!</li>
                <li>Fire multiple shots to handle multiple asteroids</li>
                <li>Use the edges of the screen to your advantage - wrap around!</li>
                <li>Each wave has more asteroids - stay sharp!</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="back-hint">Press ESC to return to menu</p>
      </div>
    </div>
  );
};
