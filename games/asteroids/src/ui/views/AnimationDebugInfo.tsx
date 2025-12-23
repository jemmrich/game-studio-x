import React from "react";

export interface AnimationDebugInfoProps {
  entityId: number;
  currentAction?: string;
  availableActions: string[];
}

export const AnimationDebugInfo: React.FC<AnimationDebugInfoProps> = ({ entityId, currentAction, availableActions }) => (
  <div style={{ background: "#222", color: "#fff", padding: "8px", margin: "8px", borderRadius: "4px" }}>
    <strong>Entity:</strong> {entityId}<br />
    <strong>Current Animation:</strong> {currentAction || "None"}<br />
    <strong>Available Animations:</strong> {availableActions.join(", ")}
  </div>
);
