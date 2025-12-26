import { useEffect, useState } from 'react';
import './EnteringZone.css';

interface EnteringZoneProps {
  zoneNumber: number;
}

export const EnteringZone = ({ zoneNumber }: EnteringZoneProps) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // TODO: we probably want to make this duration configurable or something 
    // because it technically should match the effect duration
    // Start fade out after 3 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3000);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  return (
    <div className={`enteringZoneContainer ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="enteringZoneText">
        Entering
        <br />
        Zone {zoneNumber}
      </div>
    </div>
  );
}
