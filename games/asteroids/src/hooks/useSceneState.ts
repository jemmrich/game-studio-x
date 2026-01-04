import { useEffect, useState } from "react";
import type { Scene } from "@engine/core/scene.ts";
import type { SceneManager } from "@engine/resources/scene-manager.ts";

/**
 * Custom React hook for observing the current scene
 *
 * This hook provides a simple way for React components to react to scene changes
 * in the game world. It's the bridge between the engine's scene management system
 * and React's component state.
 *
 * Usage:
 * ```tsx
 * const currentScene = useSceneState(sceneManager);
 *
 * if (!currentScene) {
 *   return <div>No active scene</div>;
 * }
 *
 * switch (currentScene.id) {
 *   case "title":
 *     return <Title />;
 *   case "gameplay":
 *     return <Gameplay />;
 *   // ...
 * }
 * ```
 *
 * How it works:
 * 1. On mount, gets the current scene from SceneManager
 * 2. Subscribes to scene state changes
 * 3. Updates React state whenever scene changes
 * 4. On unmount, automatically unsubscribes
 *
 * @param sceneManager - The SceneManager instance to observe
 * @returns The currently active Scene, or null if no scene is loaded
 */
export function useSceneState(sceneManager: SceneManager): Scene | null {
  // Initialize with current scene
  const [currentScene, setCurrentScene] = useState<Scene | null>(() => {
    return sceneManager.getCurrentScene();
  });

  useEffect(() => {
    // Subscribe to state changes
    // Note: SceneManager's subscribeToStateChanges notifies when state changes
    // We update React state when this happens
    const unsubscribe = sceneManager.subscribeToStateChanges(() => {
      // Get the new current scene and update React state
      const newScene = sceneManager.getCurrentScene();
      setCurrentScene(newScene);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [sceneManager]);

  return currentScene;
}
