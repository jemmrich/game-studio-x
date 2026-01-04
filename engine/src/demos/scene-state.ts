/**
 * Phase 2 Demo: Observable Scene State
 * 
 * This demo showcases the new observable state system in SceneManager.
 * It shows:
 * - State subscription with unsubscribe function
 * - State validation preventing invalid transitions
 * - Real-time state notifications
 * - Integration with World events
 * 
 * Run with: deno run --allow-all engine/src/demos/scene-state.ts
 */

import { World } from "../core/world.ts";
import { SceneManager } from "../resources/scene-manager.ts";
import { SceneLifecycleSystem } from "../systems/scene-lifecycle-system.ts";
import { Scene, SceneState } from "../core/scene.ts";

class DemoScene implements Scene {
  constructor(public id: string) {}

  create() {
    console.log(`  • Scene "${this.id}" created`);
  }

  init() {
    console.log(`  • Scene "${this.id}" initialized`);
  }

  pause() {
    console.log(`  • Scene "${this.id}" paused`);
  }

  resume() {
    console.log(`  • Scene "${this.id}" resumed`);
  }

  reset() {
    console.log(`  • Scene "${this.id}" reset`);
  }

  update() {
    // No-op
  }

  dispose() {
    console.log(`  • Scene "${this.id}" disposed`);
  }
}

function main() {
  console.log("\n✨ Phase 2 Demo: Observable Scene State\n");

  const world = new World();
  const sceneManager = new SceneManager();
  const lifecycleSystem = new SceneLifecycleSystem();

  world.addResource("sceneManager", sceneManager);
  lifecycleSystem.update(world, 0); // Initialize lifecycle system

  console.log("1️⃣  Subscribe to state changes:\n");

  const states: SceneState[] = [];
  const unsubscribe = sceneManager.subscribeToStateChanges((newState) => {
    states.push(newState);
    console.log(`   → State changed to: ${newState}`);
  });

  console.log("\n2️⃣  Direct state transition (Unloaded → Loading):\n");
  sceneManager._setStateValidationEnabled(false);
  sceneManager._setState(SceneState.Loading);
  sceneManager._setStateValidationEnabled(true);
  console.log(`   Current state: ${sceneManager.getState()}`);

  console.log("\n3️⃣  Load a scene (triggers state change through lifecycle):\n");
  const scene1 = new DemoScene("MainMenu");
  sceneManager.loadScene(scene1);
  console.log(`   Current state: ${sceneManager.getState()}`);

  console.log("\n4️⃣  Unsubscribe from state changes:\n");
  unsubscribe();
  console.log("   ✓ Unsubscribed from state notifications");

  console.log("\n5️⃣  Change state without notifications:\n");
  sceneManager._setStateValidationEnabled(false);
  sceneManager._setState(SceneState.Active);
  sceneManager._setStateValidationEnabled(true);
  console.log(`   State changed to: ${sceneManager.getState()} (no notification sent)`);

  console.log("\n6️⃣  State validation in action:\n");
  console.log("   Attempting invalid transition (Active → Unloaded directly):");

  try {
    sceneManager._setState(SceneState.Unloaded);
    console.log("   ❌ Unexpected: transition should have failed!");
  } catch (error) {
    console.log(`   ✓ Caught invalid transition: ${(error as Error).message}`);
  }

  console.log("\n7️⃣  Valid state transitions:\n");

  const transitionStates: SceneState[] = [];
  const unsubscribe2 = sceneManager.subscribeToStateChanges((state) => {
    transitionStates.push(state);
    console.log(`   → ${state}`);
  });

  console.log("   Executing valid sequence: Active → Unloading → Unloaded");
  sceneManager._setState(SceneState.Unloading);
  sceneManager._setState(SceneState.Unloaded);

  unsubscribe2();

  console.log("\n8️⃣  State change event in World event bus:\n");

  world.onEvent<{ from: SceneState; to: SceneState }>(
    "scene-state-changed",
    (event) => {
      console.log(`   World event: ${event.data.from} → ${event.data.to}`);
    }
  );

  const scene2 = new DemoScene("Gameplay");
  console.log("   Loading new scene...");
  sceneManager.loadScene(scene2);
  console.log(`   Current state: ${sceneManager.getState()}`);

  console.log("\n✅ Phase 2 Observable State Demo Complete!\n");
  console.log("Key features demonstrated:");
  console.log("  • subscribeToStateChanges() with automatic unsubscribe");
  console.log("  • State validation prevents invalid transitions");
  console.log("  • Real-time state notifications");
  console.log("  • World event bus integration for state changes");
  console.log("  • Error handling in invalid transitions\n");
}

main();
