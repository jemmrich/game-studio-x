// Export all engine modules here for easier imports
// Update version manually as needed
export const ENGINE_VERSION = "0.1.0-alpha";

export { config } from "./config.ts";

// Core
export { World } from "./core/world.ts";
export { Query } from "./core/query.ts";
export { type Scene, SceneState } from "./core/scene.ts";
export {
  type SceneTransitionStartEvent,
  type SceneTransitionCompleteEvent,
  type SceneLoadEvent,
  type SceneUnloadEvent,
  type ScenePauseEvent,
  type SceneResumeEvent,
  type SceneDisposeEvent,
  type SceneResetEvent,
  type SceneErrorEvent,
  type SceneEvent,
  SCENE_EVENTS,
} from "./core/scene-events.ts";
export { BaseScene } from "./core/base-scene.ts";
export { DemoBaseScene } from "./core/demo-base-scene.ts";

// Utils
export type { GUID } from "./utils/guid.ts";
export { generateGUID, isGUID } from "./utils/guid.ts";

// Components
export * from "./components/mod.ts";

// Systems
export * from "./systems/mod.ts";

// Resources
export * from "./resources/mod.ts";

// Features
export * from "./features/mod.ts";
