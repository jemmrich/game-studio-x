// Export all engine modules here for easier imports
// Update version manually as needed
export const ENGINE_VERSION = "0.1.0-alpha";

export { config } from "./config.ts";

// Core
export { World } from "./core/world.ts";
export { Query } from "./core/query.ts";
export { type Scene, SceneState } from "./core/scene.ts";
export { BaseScene } from "./core/base-scene.ts";
export { DemoBaseScene } from "./core/demo-base-scene.ts";

// Components
export * from "./components/mod.ts";

// Systems
export * from "./systems/mod.ts";

// Resources
export * from "./resources/mod.ts";
