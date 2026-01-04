#!/usr/bin/env -S deno run -A --node-modules-dir=auto

/**
 * Phase 5: Interactive Demo of Scene Transitions
 * 
 * This demo showcases the transition options introduced in Phase 5:
 * - Multiple easing functions
 * - Transition callbacks (onBefore, onProgress, onAfter)
 * - Progress event tracking
 * - Cancellation
 * 
 * Run with: deno run --allow-all engine/src/demos/scene-transitions-demo.ts
 */

import { World } from "../core/world.ts";
import { SceneManager, TransitionOptions } from "../resources/scene-manager.ts";
import { BaseScene } from "../core/base-scene.ts";
import {
  easeLinear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeOutBounce,
  easeOutElastic,
} from "../utils/easing.ts";
import { SCENE_EVENTS } from "../core/scene-events.ts";

// Demo scenes
class MenuScene extends BaseScene {
  constructor() {
    super("menu");
  }

  init(_world: World): void {
    // No-op
  }
}

class GameScene extends BaseScene {
  constructor() {
    super("game");
  }

  init(_world: World): void {
    // No-op
  }
}

class PauseScene extends BaseScene {
  constructor() {
    super("pause");
  }

  init(_world: World): void {
    // No-op
  }
}

// Demo function
async function demo() {
  console.log("\n=== Phase 5: Scene Transitions Demo ===\n");

  const world = new World();
  const sceneManager = new SceneManager();
  sceneManager._setWorld(world);

  // Setup event listeners
  world.onEvent("scene-transition-progress", (event) => {
    const progress = event.data.easedProgress;
    const bar = "█".repeat(Math.floor(progress * 20));
    const empty = "░".repeat(20 - Math.floor(progress * 20));
    process.stdout.write(
      `\r  Progress: [${bar}${empty}] ${Math.round(progress * 100)}%`
    );
  });

  world.onEvent("scene-transition-finished", (event) => {
    console.log(
      `\n  ✓ Transition completed in ${event.data.duration}ms\n`
    );
  });

  // Demo 1: Linear Easing
  console.log("📋 Demo 1: Linear Easing (constant speed)");
  console.log("  Transitioning with linear easing...");

  const menuScene = new MenuScene();
  const gameScene = new GameScene();

  sceneManager.transitionToScene(gameScene, {
    duration: 1000,
    easing: easeLinear,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 2: Easing In (slow start, fast end)
  console.log("\n📋 Demo 2: Easing In Quad (accelerating)");
  console.log("  Transitioning with easeInQuad...");

  sceneManager.transitionToScene(menuScene, {
    duration: 1000,
    easing: easeInQuad,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 3: Easing Out (fast start, slow end)
  console.log("\n📋 Demo 3: Easing Out Quad (decelerating)");
  console.log("  Transitioning with easeOutQuad...");

  sceneManager.transitionToScene(gameScene, {
    duration: 1000,
    easing: easeOutQuad,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 4: Easing In-Out (smooth acceleration and deceleration)
  console.log("\n📋 Demo 4: Easing In-Out Quad (natural ease)");
  console.log("  Transitioning with easeInOutQuad...");

  sceneManager.transitionToScene(menuScene, {
    duration: 1000,
    easing: easeInOutQuad,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 5: Cubic easing (more dramatic)
  console.log("\n📋 Demo 5: Cubic Easing (more dramatic curves)");
  console.log("  Transitioning with easeOutCubic...");

  sceneManager.transitionToScene(gameScene, {
    duration: 1000,
    easing: easeOutCubic,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 6: Bounce easing (fun bouncy effect)
  console.log("\n📋 Demo 6: Bounce Easing (playful bounce effect)");
  console.log("  Transitioning with easeOutBounce...");

  sceneManager.transitionToScene(menuScene, {
    duration: 1000,
    easing: easeOutBounce,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 7: With callbacks
  console.log("\n📋 Demo 7: Transition with Lifecycle Callbacks");
  console.log("  Transitioning with onBefore, onProgress, onAfter hooks...");

  sceneManager.transitionToScene(gameScene, {
    duration: 800,
    easing: easeInOutCubic,
    onBefore: async (from, to) => {
      console.log(
        `  🔄 onBefore: Transitioning from "${from?.id || "none"}" to "${to.id}"`
      );
    },
    onProgress: (progress, eased) => {
      // Progress logged by global listener
    },
    onAfter: async (from, to) => {
      console.log(`  ✨ onAfter: "${to.id}" is now active`);
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 900));

  // Demo 8: Cancellation
  console.log("\n📋 Demo 8: Transition Cancellation");
  console.log("  Starting a transition and cancelling it mid-way...");

  sceneManager.transitionToScene(menuScene, {
    duration: 2000,
    easing: easeLinear,
    onProgress: (progress) => {
      // Will be cancelled before completion
    },
  });

  // Cancel after 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));
  const cancelled = sceneManager.cancelTransition();
  console.log(`  🛑 Transition cancelled: ${cancelled ? "success" : "failed"}`);
  console.log(
    `  Is transitioning: ${sceneManager.isTransitioning() ? "yes" : "no"}`
  );

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Demo 9: Rapid transitions
  console.log("\n📋 Demo 9: Rapid Transitions (second replaces first)");
  console.log("  Starting first transition...");

  sceneManager.transitionToScene(gameScene, {
    duration: 2000,
    easing: easeLinear,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log("  Starting second transition (cancels first)...");

  sceneManager.transitionToScene(menuScene, {
    duration: 1000,
    easing: easeOutBounce,
  });

  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Demo 10: Comparison of easing functions
  console.log("\n📋 Demo 10: Easing Functions Comparison");

  const easingFunctions = [
    { name: "Linear", easing: easeLinear },
    { name: "InQuad", easing: easeInQuad },
    { name: "OutQuad", easing: easeOutQuad },
    { name: "InOutQuad", easing: easeInOutQuad },
    { name: "InCubic", easing: easeInCubic },
    { name: "OutCubic", easing: easeOutCubic },
    { name: "InOutCubic", easing: easeInOutCubic },
    { name: "OutBounce", easing: easeOutBounce },
    { name: "OutElastic", easing: easeOutElastic },
  ];

  for (const { name, easing } of easingFunctions) {
    process.stdout.write(`\n  ${name.padEnd(12)}: `);

    const values: number[] = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const eased = easing(t);
      values.push(eased);
    }

    // Create ASCII visualization
    const normalized = values.map((v) => Math.round(v * 10));
    console.log(normalized.map((v) => "▁▂▃▄▅▆▇█"[v]).join(""));
  }

  console.log(
    "\n\n✨ Demo complete! Phase 5 transitions are ready for use.\n"
  );

  // Summary
  console.log("=== Summary ===");
  console.log("✓ Linear easing (constant speed)");
  console.log("✓ Easing In (accelerating)");
  console.log("✓ Easing Out (decelerating)");
  console.log("✓ Easing In-Out (natural ease)");
  console.log("✓ Cubic easing (dramatic curves)");
  console.log("✓ Bounce easing (playful effect)");
  console.log("✓ Lifecycle callbacks (onBefore, onProgress, onAfter)");
  console.log("✓ Transition cancellation");
  console.log("✓ Rapid transitions handling");
  console.log("✓ Easing function comparison");
  console.log("\n");
}

// Run the demo
demo().catch(console.error);
