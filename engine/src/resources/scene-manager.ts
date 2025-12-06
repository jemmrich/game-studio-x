import type { Scene } from "../core/scene.ts";
import { SceneState } from "../core/scene.ts";
import type { World } from "../core/world.ts";

/**
 * Global resource for managing scene lifecycle and transitions.
 * Maintains the current scene, scene stack, and state transitions.
 */
export class SceneManager {
  /** Currently active scene */
  private currentScene: Scene | null = null;

  /** Current scene state */
  private state: SceneState = SceneState.Unloaded;

  /** Scene stack for hierarchical scenes (e.g., pause menu over gameplay) */
  private sceneStack: Scene[] = [];

  /** Scene being loaded (for state tracking during transition) */
  private pendingScene: Scene | null = null;

  /** Scene lifecycle event callbacks */
  private onSceneLoadCallbacks: ((scene: Scene) => void)[] = [];
  private onSceneUnloadCallbacks: ((scene: Scene) => void)[] = [];

  /**
   * Load a new scene, replacing the current scene.
   * Scene loading is instant (no transition effects).
   */
  loadScene(scene: Scene): void {
    this.pendingScene = scene;
    if (this.currentScene) {
      this.state = SceneState.Unloading;
    } else {
      this.state = SceneState.Loading;
    }
  }

  /**
   * Push a scene onto the stack without unloading the current scene.
   * Pauses the current scene, then loads and activates the new scene.
   */
  pushScene(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.pause(null as any); // World will be injected by lifecycle system
      this.sceneStack.push(this.currentScene);
    }
    this.pendingScene = scene;
    this.state = SceneState.Loading;
  }

  /**
   * Pop the current scene and resume the previous scene from the stack.
   * Internal method called by the lifecycle system or tests with world reference.
   */
  popScene(world?: any): void {
    if (this.currentScene) {
      this.currentScene.dispose(world || (null as any));
      this.onSceneUnloadCallbacks.forEach((cb) => cb(this.currentScene!));
    }

    if (this.sceneStack.length > 0) {
      this.currentScene = this.sceneStack.pop()!;
      this.state = SceneState.Active;
      this.currentScene.resume(world || (null as any)); // World will be injected by lifecycle system
    } else {
      this.currentScene = null;
      this.state = SceneState.Unloaded;
    }
  }

  /**
   * Reset the current scene to its initial state without full reload.
   */
  resetCurrentScene(world?: any): void {
    if (this.currentScene && this.state === SceneState.Active) {
      this.currentScene.reset(world || (null as any)); // World will be injected by lifecycle system
    }
  }

  /**
   * Get the currently active scene.
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Get the current scene state.
   */
  getState(): SceneState {
    return this.state;
  }

  /**
   * Get the pending scene (being loaded/unloaded).
   */
  getPendingScene(): Scene | null {
    return this.pendingScene;
  }

  /**
   * Register a callback to be called when a scene loads.
   */
  onSceneLoad(callback: (scene: Scene) => void): void {
    this.onSceneLoadCallbacks.push(callback);
  }

  /**
   * Register a callback to be called when a scene unloads.
   */
  onSceneUnload(callback: (scene: Scene) => void): void {
    this.onSceneUnloadCallbacks.push(callback);
  }

  /**
   * Internal: trigger scene load callbacks (called by lifecycle system)
   */
  _notifySceneLoaded(scene: Scene): void {
    this.onSceneLoadCallbacks.forEach((cb) => cb(scene));
  }

  /**
   * Internal: trigger scene unload callbacks (called by lifecycle system)
   */
  _notifySceneUnloaded(scene: Scene): void {
    this.onSceneUnloadCallbacks.forEach((cb) => cb(scene));
  }

  /**
   * Internal: set current scene (called by lifecycle system)
   */
  _setCurrentScene(scene: Scene | null): void {
    this.currentScene = scene;
  }

  /**
   * Internal: set state (called by lifecycle system)
   */
  _setState(state: SceneState): void {
    this.state = state;
  }

  /**
   * Internal: clear pending scene (called by lifecycle system)
   */
  _clearPending(): void {
    this.pendingScene = null;
  }
}
