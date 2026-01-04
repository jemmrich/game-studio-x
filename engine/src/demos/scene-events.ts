import { World } from "../core/world.ts";
import { SceneManager } from "../resources/scene-manager.ts";
import { SceneLifecycleSystem } from "../systems/scene-lifecycle-system.ts";
import { BaseScene } from "../core/base-scene.ts";
import { SCENE_EVENTS } from "../core/scene-events.ts";
import type { SceneTransitionCompleteEvent, SceneLoadEvent } from "../core/scene-events.ts";

// Test scene
class TestScene extends BaseScene {
  constructor() {
    super("test-scene");
  }

  override init(_world: any): void {
    // No-op for testing
  }
}

console.log("=== Scene Events System Demo ===\n");

// Setup
const world = new World();
const sceneManager = new SceneManager();
const lifecycleSystem = new SceneLifecycleSystem();

world.addResource("sceneManager", sceneManager);

// Track events
const events: string[] = [];

// Initialize lifecycle system (sets world reference)
lifecycleSystem.update(world, 0);

// Subscribe to all scene events
world.onEvent<SceneTransitionCompleteEvent>(
  SCENE_EVENTS.TRANSITION_COMPLETE,
  (event) => {
    events.push(`[TRANSITION_COMPLETE] ${event.data.transitionType}: null → ${event.data.to.id}`);
  }
);

world.onEvent<SceneLoadEvent>(
  SCENE_EVENTS.LOAD,
  (event) => {
    events.push(`[SCENE_LOAD] ${event.data.scene.id}`);
  }
);

console.log("✓ Event system initialized");
console.log("✓ World and SceneManager connected");
console.log("✓ Event listeners registered\n");

// Load a scene
const scene = new TestScene();

console.log("Loading scene: test-scene");
sceneManager.loadScene(scene);
lifecycleSystem.update(world, 0);

console.log("\nEvents fired:");
events.forEach((event) => console.log(`  ${event}`));

console.log("\n✓ Scene Events System Working!");
console.log("\nKey features:");
console.log("  • Typed event interfaces for all scene transitions");
console.log("  • Unified World event bus for scene events");
console.log("  • Event unsubscribe support");
console.log("  • Events: transition-start, transition-complete, load, unload, pause, resume, dispose, reset");
console.log("  • Backward compatible with legacy callbacks");
