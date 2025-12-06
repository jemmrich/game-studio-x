import type { World } from "./world.ts";

/**
 * Enumeration of possible scene states in the lifecycle
 */
export enum SceneState {
  Unloaded = "unloaded",
  Loading = "loading",
  Active = "active",
  Paused = "paused",
  Unloading = "unloading",
}

/**
 * Core contract for all scenes.
 * Scenes describe what entities and systems should exist in a given game state.
 * All lifecycle methods are called by the SceneLifecycleSystem.
 */
export interface Scene {
  /** Unique scene identifier */
  readonly id: string;

  /**
   * Called once when scene is created.
   * Used for one-time setup (load assets, initialize properties).
   */
  create(): void;

  /**
   * Called when scene becomes active.
   * Spawn entities and initialize gameplay state here.
   */
  init(world: World): void;

  /**
   * Called when scene is deactivated (e.g., pause menu pushed on top).
   * Stop animations, pause systems, etc.
   */
  pause(world: World): void;

  /**
   * Called when scene is reactivated after pause.
   * Resume animations, unpause systems, etc.
   */
  resume(world: World): void;

  /**
   * Reset scene to initial state without full reload.
   * Clears entities and re-runs init() for iteration and debugging.
   */
  reset(world: World): void;

  /**
   * Called every frame while scene is active.
   * Use for scene-specific updates that aren't handled by systems.
   */
  update?(world: World, dt: number): void;

  /**
   * Called when scene is being permanently removed.
   * Final cleanup, release resources, etc.
   */
  dispose(world: World): void;
}
