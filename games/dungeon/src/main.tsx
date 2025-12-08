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
import * as DemoScenes from "@engine/demos/mod.ts";
import { DungeonScene } from "./game/scenes/dungeon.ts";

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

  // Register demo UI render system (must run after render plugin is installed)
  world.addSystem(new DemoUIRenderSystem());

  // Register demo input system for keyboard handling
  world.addSystem(new DemoInputSystem());

  // Load the primitives demo scene
  // const primitivesScene = new PrimitivesScene();
  // sceneManager.loadScene(primitivesScene);

  const currentScene = new DemoScenes.OrbitControlsDemoScene();
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

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
