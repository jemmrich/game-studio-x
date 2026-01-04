import { useEffect } from "react";
import type { World } from "@engine/core/world.ts";
import type { Scene } from "@engine/core/scene.ts";
import type { SceneManager } from "@engine/resources/scene-manager.ts";
import type { WaveManager } from "../../../game/resources/wave-manager.ts";
import type { PauseState } from "../../../game/resources/pause-state.ts";
import { useSceneState } from "../../../hooks/useSceneState.ts";
import { usePauseState } from "../../../hooks/usePauseState.ts";
import { Title } from "../title/Title.tsx";
import { Menu } from "../menu/Menu.tsx";
import { HowToPlay } from "../how-to-play/HowToPlay.tsx";
import { EnteringZone } from "../entering-zone/EnteringZone.tsx";
import { Hud } from "../hud/Hud.tsx";
import { DebugInfo } from "../debug-info/DebugInfo.tsx";
import { LoadingScreen } from "../loading-screen/LoadingScreen.tsx";
import { Paused } from "../paused/Paused.tsx";

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
  
  // Observable pause state - may not exist initially
  let pauseState: PauseState | null = null;
  try {
    pauseState = world.getResource<PauseState>("pauseState");
  } catch {
    // PauseState not registered yet
  }
  const isPaused = usePauseState(pauseState);

  // Control canvas pointer events based on scene - disable during menu/title screens
  useEffect(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const sceneId = currentScene?.id;
      console.log("[GameUI] Scene changed to:", sceneId);
      if (sceneId === "asteroids-title" || sceneId === "asteroids-menu") {
        canvas.style.pointerEvents = "none";
        console.log("[GameUI] Set canvas pointer-events to none");
      } else {
        canvas.style.pointerEvents = "auto";
        console.log("[GameUI] Set canvas pointer-events to auto");
      }
    }
  }, [currentScene?.id]);

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
  return renderScene(currentScene, world, sceneManager, isPaused);
}

/**
 * Render the appropriate UI based on the current scene
 *
 * This function handles the scene-to-view mapping:
 * - "asteroids-title" → TitleScene
 * - "asteroids-menu" → MenuScene
 * - "asteroids-main" → GameplayScene
 * - "asteroids-entering-zone" → EnteringZoneScene
 *
 * For overlaid scenes (e.g., EnteringZoneScene on top of GameplayScene),
 * both scenes are rendered with the overlay on top.
 */
function renderScene(currentScene: Scene | null, world: World, sceneManager: SceneManager, isPaused: boolean) {
  if (!currentScene) {
    return <div className="no-scene">No active scene</div>;
  }

  // Get the full scene stack to check for overlays
  const sceneStack = sceneManager.getSceneStack();
  const _hasUnderlying = sceneStack.length > 1;

  // Query wave number from WaveManager for display
  const waveManager = world.getResource<WaveManager>("waveManager");
  const waveNumber = waveManager?.currentWaveNumber ?? 1;

  switch (currentScene.id) {
    case "asteroids-title":
      return <Title />;

    case "asteroids-menu":
      return <Menu world={world} sceneManager={sceneManager} />;

    case "asteroids-how-to-play":
      return <HowToPlay />;

    case "asteroids-main":
      return (
        <>
          <Hud world={world} />
          <DebugInfo world={world} />
          {isPaused && <Paused />}
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
