import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
// import App from "./ui/views/App/App.tsx";

import { Time, World, SceneManager, SceneLifecycleSystem } from "@engine/mod.ts";
import {
  installTransformPlugin,
} from "@engine/features/transform-plugin/mod.ts";
import {
  installRenderPlugin,
} from "@engine/features/render-plugin/mod.ts";
import { DemoUIRenderSystem, DemoInputSystem } from "@engine/systems/mod.ts";
import { GameplayScene } from "./game/scenes/gameplay.ts";
import { RendererSystem } from "./game/systems/renderer-system.ts";
import { RenderContext } from "./game/resources/render-context.ts";
import * as THREE from "three";

createRoot(document.getElementById("ui")!).render(
  <StrictMode>
    {/* <App /> */}
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

  // Register scene lifecycle system (must run early to handle scene transitions)
  world.addSystem(new SceneLifecycleSystem());

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

    // Update all systems (includes scene lifecycle which calls scene.update)
    world.updateSystems(dt);

    // Clear events at the end of the frame
    world.clearEvents();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
