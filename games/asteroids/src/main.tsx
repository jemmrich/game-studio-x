import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
import { GameUI } from "./ui/components/game-ui/GameUI.tsx";

import { Time, World, SceneManager, SceneLifecycleSystem } from "@engine/mod.ts";
import {
  installTransformPlugin,
} from "@engine/features/transform-plugin/mod.ts";
import {
  installRenderPlugin,
} from "@engine/features/render-plugin/mod.ts";
import { TitleScene } from "./game/scenes/title-scene.ts";
import { RendererSystem } from "./game/systems/renderer-system.ts";
import { RenderContext } from "./game/resources/render-context.ts";
import { PauseState } from "./game/resources/pause-state.ts";
import { PauseSystem } from "./game/systems/pause-system.ts";
import { installShipPlugin, ShipRenderSystem } from "./game/features/ship-plugin/mod.ts";
import { installMissilePlugin, MissileRenderSystem } from "./game/features/missile-plugin/mod.ts";
import { installAsteroidPlugin, AsteroidRenderSystem } from "./game/features/asteroid-plugin/mod.ts";
import { installWaveManagerPlugin } from "./game/features/wave-manager-plugin/mod.ts";
import * as THREE from "three";

function main() {
  const world = new World();

  // Render React UI with world reference
  createRoot(document.getElementById("ui")!).render(
    <StrictMode>
      <GameUI world={world} />
    </StrictMode>,
  );

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

  // Store threeScene in world resources so scenes can access it
  world.addResource("threeScene", threeScene);

  // Register Three.js renderer system
  world.addSystem(new RendererSystem(threeScene, canvas));

  // ═══════════════════════════════════════════════════════════════════
  // Install all game plugins once globally (not per-scene)
  // ═══════════════════════════════════════════════════════════════════
  // IMPORTANT: System execution order matters! Systems run in the order they're added.
  // The current order ensures:
  // 1. Collision DETECTION systems run first (emit collision events)
  // 2. Collision HANDLING systems process events (emit destruction events)
  // 3. Destruction systems process destruction (emit spawn events, cleanup visuals)
  // 4. Spawning systems create new entities
  // 5. Render systems update visuals (MUST run after destruction cleanup)
  //
  // DO NOT REORDER without understanding the event flow!
  // ═══════════════════════════════════════════════════════════════════
  
  // Wave manager plugin
  installWaveManagerPlugin(world);

  // Ship plugin
  const shipPluginContext = installShipPlugin(world);
  world.addResource("shipPluginContext", shipPluginContext);

  // Missile plugin
  installMissilePlugin(world);

  // Asteroid plugin - returns all systems so we can add them in the correct order
  const { 
    collisionSystem: asteroidCollisionSystem,
    destructionSystem: asteroidDestructionSystem, 
    spawningSystem: asteroidSpawningSystem 
  } = installAsteroidPlugin(world);

  // Add asteroid collision system
  world.addSystem(asteroidCollisionSystem);

  // Add ship collision handling
  world.addSystem(shipPluginContext.collisionHandlingSystem);

  // Add asteroid destruction system
  world.addSystem(asteroidDestructionSystem);

  // Add asteroid spawning system
  world.addSystem(asteroidSpawningSystem);

  // ═══════════════════════════════════════════════════════════════════
  // Setup rendering systems
  // ═══════════════════════════════════════════════════════════════════
  const shipRenderSystem = new ShipRenderSystem(threeScene);
  world.addSystem(shipRenderSystem);

  const missileRenderSystem = new MissileRenderSystem(threeScene);
  world.addSystem(missileRenderSystem);

  const asteroidRenderSystem = new AsteroidRenderSystem(threeScene);
  world.addSystem(asteroidRenderSystem);

  // Connect destruction system to render system
  asteroidDestructionSystem.setRenderSystem(asteroidRenderSystem);

  // Store resources for scenes to use
  world.addResource("asteroidRenderSystem", asteroidRenderSystem);
  world.addResource("asteroidDestructionSystem", asteroidDestructionSystem);

  // Load initial scene
  const currentScene = new TitleScene(threeScene);
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
