import { useEffect, useState } from 'react';
import './EnteringZone.css';

interface EnteringZoneProps {
  zoneNumber: number;
}

export const EnteringZone = ({ zoneNumber }: EnteringZoneProps) => {
  return (
    <div className="enteringZoneContainer">
      <div className="enteringZoneText">
        Entering
        <br />
        Zone {zoneNumber}
      </div>
    </div>
  );
}
