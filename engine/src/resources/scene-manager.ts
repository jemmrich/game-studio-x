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

  /** Observable state subscribers (Phase 2: Observable State) */
  private stateSubscribers: Set<(state: SceneState) => void> = new Set();

  /** Whether to validate state transitions (Phase 2: Observable State) */
  private enableStateValidation: boolean = true;

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
      this._updateState(SceneState.Unloading);
    } else {
      this._updateState(SceneState.Loading);
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
    this._updateState(SceneState.Loading);
  }

  /**
   * Pop the current scene and resume the previous scene from the stack.
   * 
   * Emits "scene-dispose" event after current scene is disposed.
   * Emits "scene-resume" event when previous scene is resumed.
   * 
   * Phase 3: World is now stored on manager, no longer needs to be passed.
   * Kept for backward compatibility but world parameter is ignored.
   */
  popScene(world?: any): void {
    const worldRef = this.world || world || (null as any);
    
    if (this.currentScene) {
      this.currentScene.dispose(worldRef);
      
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
      this._updateState(SceneState.Active);
      this.currentScene.resume(worldRef);
      
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
      this._updateState(SceneState.Unloaded);
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
   * Does not include the current scene.
   * 
   * Example: If you have Gameplay on bottom and PauseMenu on top,
   * the depth is 1 (just the Gameplay scene is paused).
   */
  getSceneStackDepth(): number {
    return this.sceneStack.length;
  }

  /**
   * Get all scenes in the stack (bottom to top, not including current).
   * Useful for debugging or querying the scene hierarchy.
   */
  getSceneStack(): Scene[] {
    return [...this.sceneStack];
  }

  /**
   * Get total number of scenes (current + paused in stack).
   * 
   * Example:
   * - No scene: 0
   * - Gameplay active: 1
   * - Gameplay + PauseMenu: 2
   * - Gameplay + PauseMenu + SettingsDialog: 3
   */
  getTotalSceneCount(): number {
    return (this.currentScene ? 1 : 0) + this.sceneStack.length;
  }

  /**
   * Check if a specific scene is paused in the stack.
   */
  isScenePaused(sceneId: string): boolean {
    return this.sceneStack.some((s) => s.id === sceneId);
  }

  /**
   * Internal: Update state and notify subscribers.
   * Called by lifecycle system when scene state changes.
   * 
   * Phase 3: Used internally to coordinate lifecycle transitions.
   * @internal
   */
  _updateStateWithoutNotification(newState: SceneState): void {
    this.state = newState;
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
   * Internal: set current scene (called by lifecycle system in Phase 1-2)
   * 
   * @deprecated Phase 3: Use _completeSceneTransition() instead
   * Kept for backward compatibility with legacy tests.
   * @internal
   */
  _setCurrentScene(scene: Scene | null): void {
    this.currentScene = scene;
  }

  /**
   * Internal: set state (called by lifecycle system in Phase 1-2)
   * 
   * @deprecated Phase 3: Use _completeSceneTransition() or _updateState() instead
   * Kept for backward compatibility with legacy tests.
   * @internal
   */
  _setState(state: SceneState): void {
    this._updateState(state);
  }

  /**
   * Internal: clear pending scene (called by lifecycle system in Phase 1-2)
   * 
   * @deprecated Phase 3: No longer needed - handled by _completeSceneTransition()
   * Kept for backward compatibility with legacy tests.
   * @internal
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

  /**
   * Phase 2: Observable State - Subscribe to scene state changes.
   * 
   * Returns an unsubscribe function for easy cleanup.
   * 
   * @example
   * const unsubscribe = sceneManager.subscribeToStateChanges((newState) => {
   *   console.log(`Scene state changed to: ${newState}`);
   * });
   * 
   * // Later, cleanup subscription
   * unsubscribe();
   */
  subscribeToStateChanges(callback: (state: SceneState) => void): () => void {
    this.stateSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }

  /**
   * Phase 2: Observable State - Get all state subscribers (for testing)
   * @internal
   */
  _getStateSubscriberCount(): number {
    return this.stateSubscribers.size;
  }

  /**
   * Phase 2: Observable State - Validate state transition.
   * Throws an error if transition is invalid.
   * 
   * Valid transitions:
   * - Unloaded → Loading
   * - Loading → Active
   * - Active → Unloading
   * - Active → Loading (replacing scene)
   * - Unloading → Unloaded
   * - Any state → Error (special case)
   * 
   * @throws {Error} If transition is invalid
   */
  private validateStateTransition(fromState: SceneState, toState: SceneState): boolean {
    if (!this.enableStateValidation) return true;

    const validTransitions: Record<SceneState, SceneState[]> = {
      [SceneState.Unloaded]: [SceneState.Loading],
      [SceneState.Loading]: [SceneState.Active, SceneState.Unloaded],
      [SceneState.Active]: [SceneState.Unloading, SceneState.Loading, SceneState.Paused],
      [SceneState.Paused]: [SceneState.Active],
      [SceneState.Unloading]: [SceneState.Unloaded, SceneState.Active, SceneState.Loading],
    };

    const allowed = validTransitions[fromState] || [];
    return allowed.includes(toState);
  }

  /**
   * Phase 2: Observable State - Internal: Update state and notify subscribers.
   * Validates transition if validation is enabled.
   * 
   * @internal Called by lifecycle system and internal methods
   */
  _updateState(newState: SceneState): void {
    if (newState === this.state) {
      return; // No change
    }

    if (!this.validateStateTransition(this.state, newState)) {
      const error = `Invalid state transition: ${this.state} → ${newState}`;
      console.error(`[SceneManager] ${error}`);
      throw new Error(error);
    }

    const oldState = this.state;
    this.state = newState;

    // Notify all state subscribers
    this.stateSubscribers.forEach((callback) => {
      try {
        callback(newState);
      } catch (error) {
        console.error(
          "[SceneManager] Error in state subscriber:",
          error
        );
      }
    });

    // Emit state change event through World
    if (this.world) {
      this.world.emitEvent<{ from: SceneState; to: SceneState; timestamp: number }>(
        "scene-state-changed",
        {
          from: oldState,
          to: newState,
          timestamp: Date.now(),
        }
      );
    }
  }

  /**
   * Phase 2: Observable State - Disable state validation (for testing legacy code)
   * @internal
   */
  _setStateValidationEnabled(enabled: boolean): void {
    this.enableStateValidation = enabled;
  }

  /**
   * Phase 3: Internal lifecycle coordination - Called by SceneLifecycleSystem
   * when a scene transition has completed successfully.
   * 
   * This method handles all state updates and event notifications after
   * a scene's init() or resume() lifecycle method completes.
   * 
   * @internal Called by SceneLifecycleSystem during handleLoading()
   */
  _completeSceneTransition(pendingScene: Scene, transitionType: "load" | "push"): void {
    const previousScene = this.currentScene;
    
    // Update scene reference
    this.currentScene = pendingScene;
    this.pendingScene = null;
    
    // Update state (this notifies subscribers and emits state-changed event)
    this._updateState(SceneState.Active);
    
    // Emit lifecycle events
    this._notifySceneLoaded(pendingScene);
    this._notifyTransitionComplete(previousScene, pendingScene, transitionType);
  }

  /**
   * Phase 3: Internal lifecycle coordination - Called by SceneLifecycleSystem
   * when a scene has been disposed and any pending scenes need to be processed.
   * 
   * This method handles state transitions after a scene's dispose() completes.
   * 
   * @internal Called by SceneLifecycleSystem during handleUnloading()
   */
  _completeSceneDisposal(): void {
    // Check if there's a pending scene to load
    if (this.pendingScene) {
      this.currentScene = null;
      this._updateState(SceneState.Loading);
    } else if (this.sceneStack.length > 0) {
      // Resume top of stack
      this.currentScene = this.sceneStack[this.sceneStack.length - 1];
      this._updateState(SceneState.Active);
    } else {
      // No scenes left
      this.currentScene = null;
      this._updateState(SceneState.Unloaded);
    }
  }

  /**
   * Phase 3: Internal - Get scene stack depth (for lifecycle system).
   * @internal Used by lifecycle system to detect transition type
   */
  _getSceneStackDepth(): number {
    return this.sceneStack.length;
  }
}