import type { Scene } from "../core/scene.ts";
import { SceneState } from "../core/scene.ts";
import type { World } from "../core/world.ts";
import type {
  SceneTransitionStartEvent,
  SceneTransitionCompleteEvent,
  SceneLoadEvent,
  SceneUnloadEvent,
  ScenePauseEvent,
  SceneResumeEvent,
  SceneDisposeEvent,
  SceneResetEvent,
} from "../core/scene-events.ts";
import { SCENE_EVENTS } from "../core/scene-events.ts";

/**
 * Global resource for managing scene lifecycle and transitions.
 * Maintains the current scene, scene stack, and state transitions.
 * 
 * Emits the following events through the World's event bus:
 * - "scene-transition-start" (SceneTransitionStartEvent)
 * - "scene-transition-complete" (SceneTransitionCompleteEvent)
 * - "scene-load" (SceneLoadEvent)
 * - "scene-unload" (SceneUnloadEvent)
 * - "scene-pause" (ScenePauseEvent)
 * - "scene-resume" (SceneResumeEvent)
 * - "scene-dispose" (SceneDisposeEvent)
 * - "scene-reset" (SceneResetEvent)
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

  /** Reference to the World (for emitting events) */
  private world: World | null = null;

  /** Scene lifecycle event callbacks (deprecated, use World events instead) */
  private onSceneLoadCallbacks: ((scene: Scene) => void)[] = [];
  private onSceneUnloadCallbacks: ((scene: Scene) => void)[] = [];

  /**
   * Load a new scene, replacing the current scene.
   * Scene loading is instant (no transition effects).
   * 
   * Emits "scene-transition-start" event immediately.
   * Emits "scene-transition-complete" event when loading finishes.
   */
  loadScene(scene: Scene): void {
    const oldScene = this.currentScene;
    
    // Emit transition start event
    if (this.world) {
      this.world.emitEvent<SceneTransitionStartEvent>(
        SCENE_EVENTS.TRANSITION_START,
        {
          from: oldScene,
          to: scene,
          transitionType: "load",
          timestamp: Date.now(),
        }
      );
    }
    
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
   * 
   * Emits "scene-transition-start" event immediately.
   * Emits "scene-pause" event when current scene is paused.
   * Emits "scene-transition-complete" event when loading finishes.
   */
  pushScene(scene: Scene): void {
    const oldScene = this.currentScene;
    
    // Emit transition start event
    if (this.world) {
      this.world.emitEvent<SceneTransitionStartEvent>(
        SCENE_EVENTS.TRANSITION_START,
        {
          from: oldScene,
          to: scene,
          transitionType: "push",
          timestamp: Date.now(),
        }
      );
    }
    
    if (this.currentScene) {
      this.currentScene.pause(null as any); // World will be injected by lifecycle system
      
      // Emit pause event
      if (this.world) {
        this.world.emitEvent<ScenePauseEvent>(
          SCENE_EVENTS.PAUSE,
          {
            scene: this.currentScene,
            timestamp: Date.now(),
          }
        );
      }
      
      this.sceneStack.push(this.currentScene);
    }
    this.pendingScene = scene;
    this.state = SceneState.Loading;
  }

  /**
   * Pop the current scene and resume the previous scene from the stack.
   * Internal method called by the lifecycle system or tests with world reference.
   * 
   * Emits "scene-dispose" event after current scene is disposed.
   * Emits "scene-resume" event when previous scene is resumed.
   */
  popScene(world?: any): void {
    if (this.currentScene) {
      this.currentScene.dispose(world || (null as any));
      
      // Emit dispose event
      if (this.world) {
        this.world.emitEvent<SceneDisposeEvent>(
          SCENE_EVENTS.DISPOSE,
          {
            scene: this.currentScene,
            timestamp: Date.now(),
          }
        );
      }
      
      this.onSceneUnloadCallbacks.forEach((cb) => cb(this.currentScene!));
    }

    if (this.sceneStack.length > 0) {
      this.currentScene = this.sceneStack.pop()!;
      this.state = SceneState.Active;
      this.currentScene.resume(world || (null as any)); // World will be injected by lifecycle system
      
      // Emit resume event
      if (this.world) {
        this.world.emitEvent<SceneResumeEvent>(
          SCENE_EVENTS.RESUME,
          {
            scene: this.currentScene,
            timestamp: Date.now(),
          }
        );
      }
    } else {
      this.currentScene = null;
      this.state = SceneState.Unloaded;
    }
  }

  /**
   * Reset the current scene to its initial state without full reload.
   * 
   * Emits "scene-reset" event after scene is reset.
   */
  resetCurrentScene(world?: any): void {
    if (this.currentScene && this.state === SceneState.Active) {
      this.currentScene.reset(world || (null as any)); // World will be injected by lifecycle system
      
      // Emit reset event
      if (this.world) {
        this.world.emitEvent<SceneResetEvent>(
          SCENE_EVENTS.RESET,
          {
            scene: this.currentScene,
            timestamp: Date.now(),
          }
        );
      }
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
   * Get the scene stack depth (number of paused scenes).
   * 
   * @internal Used by lifecycle system to detect transition type
   */
  _getSceneStackDepth(): number {
    return this.sceneStack.length;
  }

  /**
   * Register a callback to be called when a scene loads.
   * 
   * @deprecated Use world.onEvent("scene-load", ...) instead
   */
  onSceneLoad(callback: (scene: Scene) => void): void {
    console.warn(
      "[DEPRECATED] SceneManager.onSceneLoad() is deprecated. " +
      "Use world.onEvent<SceneLoadEvent>(SCENE_EVENTS.LOAD, ...) instead. " +
      "See docs for migration guide."
    );
    this.onSceneLoadCallbacks.push(callback);
  }

  /**
   * Register a callback to be called when a scene unloads.
   * 
   * @deprecated Use world.onEvent("scene-unload", ...) instead
   */
  onSceneUnload(callback: (scene: Scene) => void): void {
    console.warn(
      "[DEPRECATED] SceneManager.onSceneUnload() is deprecated. " +
      "Use world.onEvent<SceneUnloadEvent>(SCENE_EVENTS.UNLOAD, ...) instead. " +
      "See docs for migration guide."
    );
    this.onSceneUnloadCallbacks.push(callback);
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

  /**
   * Internal: set the World reference for emitting events.
   * Called automatically by SceneLifecycleSystem.
   */
  _setWorld(world: World): void {
    this.world = world;
  }

  /**
   * Internal: emit scene loaded event (called by lifecycle system)
   */
  _notifySceneLoaded(scene: Scene): void {
    // Call legacy callbacks
    this.onSceneLoadCallbacks.forEach((cb) => cb(scene));
    
    // Emit event through World's event bus
    if (this.world) {
      this.world.emitEvent<SceneLoadEvent>(
        SCENE_EVENTS.LOAD,
        {
          scene,
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Internal: emit scene unloaded event (called by lifecycle system)
   */
  _notifySceneUnloaded(scene: Scene): void {
    // Call legacy callbacks
    this.onSceneUnloadCallbacks.forEach((cb) => cb(scene));
    
    // Emit event through World's event bus
    if (this.world) {
      this.world.emitEvent<SceneUnloadEvent>(
        SCENE_EVENTS.UNLOAD,
        {
          scene,
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Internal: emit scene transition complete event (called by lifecycle system)
   */
  _notifyTransitionComplete(from: Scene | null, to: Scene, transitionType: "load" | "push"): void {
    if (this.world) {
      this.world.emitEvent<SceneTransitionCompleteEvent>(
        SCENE_EVENTS.TRANSITION_COMPLETE,
        {
          from,
          to,
          transitionType,
          timestamp: Date.now(),
        }
      );
    }
  }
}
