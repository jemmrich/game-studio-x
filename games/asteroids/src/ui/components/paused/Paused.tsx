import React from 'react';
import './Paused.css';

export const Paused: React.FC = () => {
  React.useEffect(() => {
    console.log('[Paused] Component mounted');
  }, []);

  return (
    <div className="paused-overlay">
      <div className="paused-content">
        <h1 className="paused-title">PAUSED</h1>
        <p className="paused-instruction">Press P to Resume</p>
      </div>
    </div>
  );
};
