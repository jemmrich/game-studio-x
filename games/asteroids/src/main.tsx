import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
import {Hud} from "./ui/components/hud/Hud.tsx";
import { Title } from "./ui/components/title/Title.tsx";

import { Time, World, SceneManager, SceneLifecycleSystem } from "@engine/mod.ts";
import {
  installTransformPlugin,
} from "@engine/features/transform-plugin/mod.ts";
import {
  installRenderPlugin,
} from "@engine/features/render-plugin/mod.ts";
import { GameplayScene } from "./game/scenes/gameplay.ts";
import { RendererSystem } from "./game/systems/renderer-system.ts";
import { RenderContext } from "./game/resources/render-context.ts";
import { PauseState } from "./game/resources/pause-state.ts";
import { PauseSystem } from "./game/systems/pause-system.ts";
import * as THREE from "three";

createRoot(document.getElementById("ui")!).render(
  <StrictMode>
    <Title />
    {/* <Hud /> */}
  </StrictMode>,
);

function main() {
  const world = new World();

  // Time resource
  const time = new Time();
  world.addResource("time", time);

  // Scene Manager
  const sceneManager = new SceneManager();
  world.addResource("sceneManager", sceneManager);

  // Pause State resource
  const pauseState = new PauseState();
  world.addResource("pauseState", pauseState);

  // Register scene lifecycle system (must run early to handle scene transitions)
  world.addSystem(new SceneLifecycleSystem());

  // Register pause system (runs regardless of pause state to allow unpausing)
  const pauseSystem = new PauseSystem();
  world.addSystem(pauseSystem);

  // Install engine plugins
  installTransformPlugin(world);
  installRenderPlugin(world, {
    canvas: document.querySelector("canvas") as HTMLCanvasElement,
    antialias: true,
    clearColor: [0, 0, 0, 1.0], // Black background
  });

  // Render context resource
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  world.addResource("render_context", new RenderContext(canvas));

  // Create Three.js scene for rendering
  const threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x000000); // Black background

  // Register Three.js renderer system
  world.addSystem(new RendererSystem(threeScene, canvas));

  // Load GameplayScene with Three.js rendering
  const currentScene = new GameplayScene(threeScene);
  sceneManager.loadScene(currentScene);

  // Handle window resize
  globalThis.addEventListener("resize", () => {
    // RenderPlugin will handle canvas resize
  });

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Update the Time resource
    time.update(dt);

    // Always run pause system to check for pause toggle
    pauseSystem.update(world, dt);

    // Get pause state
    const isPaused = pauseState.getIsPaused();

    // Update all other systems only if not paused (includes scene lifecycle which calls scene.update)
    if (!isPaused) {
      world.updateSystems(dt);
    }

    // Clear events at the end of the frame
    world.clearEvents();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
