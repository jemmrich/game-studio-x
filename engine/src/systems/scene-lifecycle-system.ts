import { SceneManager } from "../resources/scene-manager.ts";
import { SceneState } from "../core/scene.ts";
import type { World } from "../core/world.ts";
import { Tag } from "../components/tag.ts";

/**
 * System responsible for processing scene transitions and lifecycle state changes.
 * Manages the scene state machine: Loading → Active → Unloading, etc.
 *
 * This system should run early in the frame to ensure scene changes happen
 * before other systems access the world state.
 */
export class SceneLifecycleSystem {
  enabled: boolean = true;

  update(world: World, dt: number): void {
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (!sceneManager) return;

    const state = sceneManager.getState();

    switch (state) {
      case SceneState.Loading:
        this.handleLoading(world, sceneManager);
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
   * Creates the scene, calls create() and init() lifecycle methods.
   */
  private handleLoading(world: World, sceneManager: SceneManager): void {
    const pendingScene = sceneManager.getPendingScene();
    if (!pendingScene) return;

    // Call scene create() only once
    if (sceneManager.getCurrentScene() === null) {
      pendingScene.create();
    }

    // Initialize the scene
    pendingScene.init(world);

    // Update manager state
    sceneManager._setCurrentScene(pendingScene);
    sceneManager._setState(SceneState.Active);
    sceneManager._clearPending();

    // Notify listeners
    sceneManager._notifySceneLoaded(pendingScene);
  }

  /**
   * Handle scene unloading.
   * Cleans up all entities owned by the scene, then loads the pending scene.
   */
  private handleUnloading(world: World, sceneManager: SceneManager): void {
    const currentScene = sceneManager.getCurrentScene();
    if (!currentScene) return;

    // Remove all entities tagged with this scene's ID
    this.cleanupSceneEntities(world, currentScene.id);

    // Call dispose lifecycle
    currentScene.dispose(world);

    // Notify listeners
    sceneManager._notifySceneUnloaded(currentScene);

    // Load pending scene if one exists
    const pendingScene = sceneManager.getPendingScene();
    if (pendingScene) {
      sceneManager._setCurrentScene(null);
      sceneManager._setState(SceneState.Loading);
      // The pending scene will be loaded in the next frame
    } else {
      sceneManager._setCurrentScene(null);
      sceneManager._setState(SceneState.Unloaded);
    }
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
