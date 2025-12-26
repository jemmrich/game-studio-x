import { useEffect, useState } from "react";
import type { World } from "@engine/core/world.ts";
import { Title } from "../title/Title.tsx";
import { EnteringZone } from "../entering-zone/EnteringZone.tsx";
import { Hud } from "../hud/Hud.tsx";

interface GameUIProps {
  world: World;
}

export function GameUI({ world }: GameUIProps) {
  const [currentView, setCurrentView] = useState<"title" | "gameplay" | "enteringZone">("title");

  useEffect(() => {
    // Listen for scene transitions
    world.onEvent("scene-transition", (event) => {
      console.warn(`[GameUI] Scene transition to view: ${event.data.view}`);
      setCurrentView(event.data.view);
    });

    world.onEvent("entering_zone", () => {
      setCurrentView("enteringZone");
    });

    world.onEvent("entering_zone_effect_complete", () => {
      setCurrentView("gameplay");
    });
  }, [world]);

  switch (currentView) {
    case "title":
      return <Title />;
    case "enteringZone":
      return <EnteringZone zoneNumber={1} />;
    case "gameplay":
      return <Hud />;
  }
}
