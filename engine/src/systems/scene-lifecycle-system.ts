import { SceneManager } from "../resources/scene-manager.ts";
import { SceneState } from "../core/scene.ts";
import type { World } from "../core/world.ts";
import { Tag } from "../components/tag.ts";

/**
 * System responsible for executing scene lifecycle methods and managing entity cleanup.
 * 
 * Phase 3: This system now delegates all state management to SceneManager.
 * SceneManager is the single source of truth for scene state.
 * SceneLifecycleSystem focuses on:
 * - Calling scene lifecycle methods (create, init, pause, resume, dispose, reset)
 * - Cleaning up scene entities
 * - Delegating state changes to SceneManager
 * 
 * This system should run early in the frame to ensure scene changes happen
 * before other systems access the world state.
 */
export class SceneLifecycleSystem {
  enabled: boolean = true;

  update(world: World, dt: number): void {
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (!sceneManager) return;

    // Set the world reference on first update (for event emission)
    sceneManager._setWorld(world);

    const state = sceneManager.getState();
    let transitionType: "load" | "push" = "load"; // Track for transition complete event

    switch (state) {
      case SceneState.Loading:
        // Detect transition type from scene stack depth
        transitionType = sceneManager._getSceneStackDepth() > 0 ? "push" : "load";
        this.handleLoading(world, sceneManager, transitionType);
        break;
      case SceneState.Unloading:
        this.handleUnloading(world, sceneManager);
        break;
      case SceneState.Active: {
        // Call update on the active scene
        const currentScene = sceneManager.getCurrentScene();
        if (currentScene?.update) {
          currentScene.update(world, dt);
        }
        break;
      }
      case SceneState.Paused:
        // Scene is paused, don't call update
        break;
      case SceneState.Unloaded:
        // No scene active
        break;
    }
  }

  /**
   * Handle scene loading.
   * Creates the scene (once), calls init() lifecycle method, then notifies SceneManager.
   * 
   * Phase 3: Delegates all state management to SceneManager via _completeSceneTransition()
   */
  private handleLoading(world: World, sceneManager: SceneManager, transitionType: "load" | "push"): void {
    const pendingScene = sceneManager.getPendingScene();
    if (!pendingScene) return;

    // Call scene create() only once (when first loaded)
    // We detect this by checking if it's new (never been set as current)
    // This is a heuristic - ideally create() is only called once in the scene's lifetime
    if (sceneManager.getCurrentScene() === null) {
      pendingScene.create();
    }

    // Initialize the scene (always called when transitioning to active)
    pendingScene.init(world);

    // Notify SceneManager that transition is complete
    // This handles all state updates and event notifications
    sceneManager._completeSceneTransition(pendingScene, transitionType);
  }

  /**
   * Handle scene unloading.
   * Cleans up all entities owned by the scene, calls dispose() lifecycle method,
   * then notifies SceneManager to handle any pending transitions.
   * 
   * Phase 3: Delegates state management to SceneManager via _completeSceneDisposal()
   */
  private handleUnloading(world: World, sceneManager: SceneManager): void {
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) return;

    // Remove all entities tagged with this scene's ID
    this.cleanupSceneEntities(world, currentScene.id);

    // Call dispose lifecycle
    currentScene.dispose(world);

    // Emit unload event (for Phase 1/2 compatibility)
    // This is done before _completeSceneDisposal to notify listeners
    sceneManager._notifySceneUnloaded(currentScene);

    // Notify SceneManager that disposal is complete
    // This handles state transitions for pending scenes or stack resumption
    sceneManager._completeSceneDisposal();
  }

  /**
   * Remove all entities that belong to a scene (tagged with scene ID).
   */
  private cleanupSceneEntities(world: World, sceneId: string): void {
    const allEntities = world.getAllEntities();

    for (const entity of allEntities) {
      const tag = world.get(entity, Tag) as Tag | undefined;
      if (tag && tag.value === sceneId) {
        world.destroyEntity(entity);
      }
    }
  }
}
