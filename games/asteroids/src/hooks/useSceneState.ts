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
    const unsubscribe = sceneManager.subscribeToStateChanges(() => {
      // Get the new current scene and update React state
      const newScene = sceneManager.getCurrentScene();
      setCurrentScene(newScene);
    });

    // ALSO set up a polling mechanism to detect scene stack changes
    // This is needed because the scene manager doesn't notify when getCurrentScene()
    // changes if the state hasn't changed (e.g., when popping a scene)
    const pollInterval = setInterval(() => {
      const newScene = sceneManager.getCurrentScene();
      setCurrentScene((prevScene) => {
        // Only update if the scene actually changed (by reference)
        if (prevScene !== newScene) {
          return newScene;
        }
        return prevScene;
      });
    }, 100); // Poll every 100ms for scene changes

    // Cleanup both subscription and polling
    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [sceneManager]);

  return currentScene;
}
