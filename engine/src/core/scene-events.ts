import type { Scene } from "./scene.ts";

/**
 * Typed event system for scene lifecycle and transitions.
 * All events are emitted through the World's event bus.
 * 
 * This replaces the callback-based system with a unified, type-safe event system.
 */

/**
 * Event emitted when a scene transition is requested.
 * Fired when loadScene() or pushScene() is called.
 */
export interface SceneTransitionStartEvent {
  /** The scene being transitioned from (null if no current scene) */
  from: Scene | null;
  /** The scene being transitioned to */
  to: Scene;
  /** The type of transition: "load" (replace) or "push" (stack) */
  transitionType: "load" | "push";
  /** Timestamp when transition was requested */
  timestamp: number;
}

/**
 * Event emitted when a scene transition completes.
 * Fired after the scene's init() method completes and scene is active.
 */
export interface SceneTransitionCompleteEvent {
  /** The scene being transitioned from (null if no previous scene) */
  from: Scene | null;
  /** The scene that is now active */
  to: Scene;
  /** The type of transition: "load" (replace) or "push" (stack) */
  transitionType: "load" | "push";
  /** Timestamp when transition completed */
  timestamp: number;
}

/**
 * Event emitted when a scene finishes loading and becomes active.
 * Fired after scene.init() completes.
 */
export interface SceneLoadEvent {
  /** The scene that was loaded */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a scene is being unloaded.
 * Fired before scene.dispose() is called.
 */
export interface SceneUnloadEvent {
  /** The scene being unloaded */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a scene is paused (e.g., another scene pushed on top).
 * Fired after scene.pause() completes.
 */
export interface ScenePauseEvent {
  /** The scene that was paused */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a paused scene is resumed.
 * Fired after scene.resume() completes.
 */
export interface SceneResumeEvent {
  /** The scene that was resumed */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a scene is disposed/cleaned up.
 * Fired after scene.dispose() completes.
 */
export interface SceneDisposeEvent {
  /** The scene that was disposed */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a scene is reset to its initial state.
 * Fired after scene.reset() completes.
 */
export interface SceneResetEvent {
  /** The scene that was reset */
  scene: Scene;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a scene lifecycle error occurs.
 * Can be emitted during any phase of scene transition.
 */
export interface SceneErrorEvent {
  /** The scene involved in the error */
  scene: Scene | null;
  /** The error message */
  error: Error;
  /** Which phase the error occurred in */
  phase: "create" | "init" | "pause" | "resume" | "reset" | "dispose" | "transition";
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a custom transition starts (Phase 5).
 * Fired when transitionToScene() is called with transition options.
 */
export interface SceneTransitionProgressEvent {
  /** The scene being transitioned from */
  from: Scene | null;
  /** The scene being transitioned to */
  to: Scene;
  /** Progress value from 0 to 1 */
  progress: number;
  /** Eased progress value (after easing function applied) */
  easedProgress: number;
  /** Duration of the transition in milliseconds */
  duration: number;
  /** Elapsed time since transition started in milliseconds */
  elapsed: number;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Event emitted when a custom transition completes (Phase 5).
 * Fired when transitionToScene() transition options animation finishes.
 */
export interface SceneTransitionFinishedEvent {
  /** The scene being transitioned from */
  from: Scene | null;
  /** The scene now active */
  to: Scene;
  /** Total duration of the transition in milliseconds */
  duration: number;
  /** Timestamp when transition finished */
  timestamp: number;
}

/**
 * Type definition for all scene-related events.
 * Used for type-safe event emission and listening.
 */
export type SceneEvent =
  | SceneTransitionStartEvent
  | SceneTransitionCompleteEvent
  | SceneLoadEvent
  | SceneUnloadEvent
  | ScenePauseEvent
  | SceneResumeEvent
  | SceneDisposeEvent
  | SceneResetEvent
  | SceneErrorEvent
  | SceneTransitionProgressEvent
  | SceneTransitionFinishedEvent;

/**
 * Event names (keys) for scene events.
 * Use these strings when emitting or listening to events.
 */
export const SCENE_EVENTS = {
  TRANSITION_START: "scene-transition-start",
  TRANSITION_COMPLETE: "scene-transition-complete",
  TRANSITION_PROGRESS: "scene-transition-progress",
  TRANSITION_FINISHED: "scene-transition-finished",
  LOAD: "scene-load",
  UNLOAD: "scene-unload",
  PAUSE: "scene-pause",
  RESUME: "scene-resume",
  DISPOSE: "scene-dispose",
  RESET: "scene-reset",
  ERROR: "scene-error",
} as const;
