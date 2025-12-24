import React from 'react';
import './Title.css';

export const Title: React.FC = () => {
  return (
    <div className="title-container">
      <div className="title-content">
        <h1 className="asteroids-title">ASTEROIDS</h1>
        <p className="press-any-key">Press Any Key</p>
      </div>
    </div>
  );
};
