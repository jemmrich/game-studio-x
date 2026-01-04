import { useEffect, useState } from "react";
import type { World } from "@engine/core/world.ts";
import { Title } from "../title/Title.tsx";
import { EnteringZone } from "../entering-zone/EnteringZone.tsx";
import { Hud } from "../hud/Hud.tsx";
import { DebugInfo } from "../debug-info/DebugInfo.tsx";
import { LoadingScreen } from "../loading-screen/LoadingScreen.tsx";

interface GameUIProps {
  world: World;
  isLoading: boolean;
  loadProgress: number;
  currentAsset: string | null;
}

export function GameUI({ world, isLoading, loadProgress, currentAsset }: GameUIProps) {
  const [currentView, setCurrentView] = useState<"title" | "gameplay" | "enteringZone">("title");

  // Setup event listeners once the component mounts (regardless of loading state)
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

  // Show loading screen if assets are still loading
  if (isLoading) {
    return <LoadingScreen progress={loadProgress} currentAsset={currentAsset} />;
  }

  switch (currentView) {
    case "title":
      return <Title />;
    case "enteringZone":
      return (
        <>
          <EnteringZone zoneNumber={1} />
          <DebugInfo world={world} />
        </>
      );
    case "gameplay":
      return (
        <>
          <Hud />
          <DebugInfo world={world} />
        </>
      );
  }
}
