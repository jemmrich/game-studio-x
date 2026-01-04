import { useEffect } from "react";
import type { World } from "@engine/core/world.ts";
import type { Scene } from "@engine/core/scene.ts";
import type { SceneManager } from "@engine/resources/scene-manager.ts";
import type { WaveManager } from "../../../game/resources/wave-manager.ts";
import { useSceneState } from "../../../hooks/useSceneState.ts";
import { Title } from "../title/Title.tsx";
import { EnteringZone } from "../entering-zone/EnteringZone.tsx";
import { Hud } from "../hud/Hud.tsx";
import { DebugInfo } from "../debug-info/DebugInfo.tsx";
import { LoadingScreen } from "../loading-screen/LoadingScreen.tsx";

interface GameUIProps {
  world: World;
  sceneManager: SceneManager;
  isLoading: boolean;
  loadProgress: number;
  currentAsset: string | null;
}

/**
 * GameUI - Main UI component
 *
 * Manages the display of different game views based on the current scene.
 * Uses the useSceneState hook to observe scene changes and react accordingly.
 *
 * Architecture:
 * - Scene state is the single source of truth (no local state variables)
 * - No event listeners for scene transitions (all handled by hook)
 * - Clear switch statement for rendering based on current scene
 * - Wave number is queried from WaveManager when needed
 *
 * Scene Flow:
 * - TitleScene → shows Title component
 * - GameplayScene → shows Hud + DebugInfo
 * - EnteringZoneScene → shows EnteringZone effect + DebugInfo
 */
export function GameUI({ world, sceneManager, isLoading, loadProgress, currentAsset }: GameUIProps) {
  // Observable scene state - single source of truth
  const currentScene = useSceneState(sceneManager);

  // Show loading screen while assets load
  useEffect(() => {
    if (isLoading) {
      console.log(`[GameUI] Loading: ${loadProgress}% (${currentAsset})`);
    }
  }, [isLoading, loadProgress, currentAsset]);

  if (isLoading) {
    return <LoadingScreen progress={loadProgress} currentAsset={currentAsset} />;
  }

  // Render based on current scene
  return renderScene(currentScene, world, sceneManager);
}

/**
 * Render the appropriate UI based on the current scene
 *
 * This function handles the scene-to-view mapping:
 * - "asteroids-title" → TitleScene
 * - "asteroids-main" → GameplayScene
 * - "asteroids-entering-zone" → EnteringZoneScene
 *
 * For overlaid scenes (e.g., EnteringZoneScene on top of GameplayScene),
 * both scenes are rendered with the overlay on top.
 */
function renderScene(currentScene: Scene | null, world: World, sceneManager: SceneManager) {
  if (!currentScene) {
    return <div className="no-scene">No active scene</div>;
  }

  // Get the full scene stack to check for overlays
  const sceneStack = sceneManager.getSceneStack();
  const hasUnderlying = sceneStack.length > 1;

  // Query wave number from WaveManager for display
  const waveManager = world.getResource<WaveManager>("waveManager");
  const waveNumber = waveManager?.currentWaveNumber ?? 1;

  switch (currentScene.id) {
    case "asteroids-title":
      return <Title />;

    case "asteroids-main":
      return (
        <>
          <Hud world={world} />
          <DebugInfo world={world} />
        </>
      );

    case "asteroids-entering-zone":
      return (
        <>
          <EnteringZone zoneNumber={waveNumber} />
        </>
      );

    default:
      // Fallback for unknown scenes
      console.warn(`[GameUI] Unknown scene: ${currentScene.id}`);
      return <div className="unknown-scene">Unknown scene: {currentScene.id}</div>;
  }
}
