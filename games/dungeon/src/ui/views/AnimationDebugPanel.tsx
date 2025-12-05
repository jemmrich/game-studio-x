import React, { useEffect, useState } from "react";
import { AnimationDebugInfo } from "./AnimationDebugInfo";

export const AnimationDebugPanel: React.FC = () => {
  const [debugData, setDebugData] = useState<Array<{
    entityId: number;
    currentAction?: string;
    availableActions: string[];
  }>>([]);

  useEffect(() => {
    // TODO: Replace with actual ECS debug info source
    // For now, poll window._animDebugInfo if available
    const interval = setInterval(() => {
      if (window._animDebugInfo) {
        setDebugData(window._animDebugInfo);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, right: 0, zIndex: 1000, width: 320, background: "rgba(0,0,0,0.7)", padding: 12 }}>
      <h3 style={{ color: "#fff" }}>Animation Debug Panel</h3>
      {debugData.length === 0 ? (
        <div style={{ color: "#ccc" }}>No animation debug info available.</div>
      ) : (
        debugData.map((info) => (
          <AnimationDebugInfo key={info.entityId} {...info} />
        ))
      )}
    </div>
  );
};
