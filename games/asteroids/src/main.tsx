import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
import { GameUI } from "./ui/components/game-ui/GameUI.tsx";

import { Time, World, SceneManager, SceneLifecycleSystem } from "@engine/mod.ts";
import {
  SCENE_EVENTS,
  type SceneTransitionStartEvent,
  type SceneTransitionCompleteEvent,
  type SceneLoadEvent,
  type SceneUnloadEvent,
  type ScenePauseEvent,
  type SceneResumeEvent,
} from "@engine/core/scene-events.ts";
import {
  installTransformPlugin,
} from "@engine/features/transform-plugin/mod.ts";
import {
  installRenderPlugin,
} from "@engine/features/render-plugin/mod.ts";
import { TitleScene } from "./game/scenes/mod.ts";
import { RendererSystem } from "./game/systems/renderer-system.ts";
import { RenderContext } from "./game/resources/render-context.ts";
import { PauseState } from "./game/resources/pause-state.ts";
import { PauseSystem } from "./game/systems/pause-system.ts";
import { installShipPlugin, ShipRenderSystem } from "./game/features/ship-plugin/mod.ts";
import { installMissilePlugin, MissileRenderSystem } from "./game/features/missile-plugin/mod.ts";
import { installAsteroidPlugin, AsteroidRenderSystem } from "./game/features/asteroid-plugin/mod.ts";
import { installWaveManagerPlugin } from "./game/features/wave-manager-plugin/mod.ts";
import { installEnteringZoneEffectPlugin } from "./game/features/entering-zone-effect-plugin/mod.ts";
import { AssetLoader } from "./game/resources/asset-loader.ts";
import * as THREE from "three";

/**
 * App component that manages loading state
 */
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState<string | null>(null);
  const [world] = useState(() => new World());
  const [sceneManager] = useState(() => {
    // Create sceneManager immediately and add to world
    const sm = new SceneManager();
    world.addResource("sceneManager", sm);
    return sm;
  });

  // Initialize asset loading on mount
  useState(() => {
    initializeGame(world, setIsLoading, setLoadProgress, setCurrentAsset);
  });

  return (
    <StrictMode>
      <GameUI 
        world={world}
        sceneManager={sceneManager}
        isLoading={isLoading}
        loadProgress={loadProgress}
        currentAsset={currentAsset}
      />
    </StrictMode>
  );
}

/**
 * Initialize game with asset preloading
 */
async function initializeGame(
  world: World,
  setIsLoading: (loading: boolean) => void,
  setLoadProgress: (progress: number) => void,
  setCurrentAsset: (asset: string | null) => void,
) {
  console.log("[Game] Starting initialization...");

  // Create and configure asset loader
  const assetLoader = new AssetLoader();

  // Register all game assets
  assetLoader.registerAssets([
    // Audio files
    { id: 'background', type: 'audio', url: '/background.mp3' },
    { id: 'explosion', type: 'audio', url: '/explosion.mp3' },
    { id: 'missile', type: 'audio', url: '/missile.mp3' },
    { id: 'warp', type: 'audio', url: '/warp.mp3' },
    // Font files
    { id: 'Hyperspace', type: 'font', url: '/hyperspace.ttf' },
  ]);

  // Setup progress callbacks
  assetLoader.onProgress((progress) => {
    setLoadProgress(progress.percentage);
    setCurrentAsset(progress.currentAsset);
  });

  // Load all assets
  try {
    await assetLoader.loadAll();
    console.log("[Game] All assets loaded, initializing game world...");

    // Store asset loader in world resources for game systems to access
    world.addResource("assetLoader", assetLoader);

    // Initialize the game world
    setupGameWorld(world);

    // Mark loading as complete
    setIsLoading(false);
    console.log("[Game] Initialization complete!");
  } catch (error) {
    console.error("[Game] Failed to initialize:", error);
    // In a production game, you might want to show an error screen here
  }
}

/**
 * Setup the game world with all systems and scenes
 */
function setupGameWorld(world: World) {
  // Time resource
  const time = new Time();
  world.addResource("time", time);

  // Scene Manager (already created and added in App component)
  const sceneManager = world.getResource<SceneManager>("sceneManager")!;

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

  // Register Three.js renderer system and store instance
  const rendererSystem = new RendererSystem(threeScene, canvas);
  world.addSystem(rendererSystem);

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

  // Entering zone effect plugin
  installEnteringZoneEffectPlugin(world, threeScene, rendererSystem.getCamera());

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

  // ═══════════════════════════════════════════════════════════════════
  // Phase 4: Observable State Machine Events
  // ═══════════════════════════════════════════════════════════════════
  // Subscribe to unified scene state change events through World's event system.
  // All scene transitions flow through the World event bus, providing:
  // - Type-safe event handling
  // - Single event subscription point
  // - Easy analytics/logging integration
  // - Events are discoverable and documented
  // ═══════════════════════════════════════════════════════════════════
  
  // Subscribe to scene transition events
  world.onEvent<SceneTransitionStartEvent>(
    SCENE_EVENTS.TRANSITION_START,
    (event) => {
      console.log(
        `[Scene] Transition started: ${event.data.from?.id ?? "none"} → ${event.data.to.id} (type: ${event.data.transitionType})`
      );
    }
  );

  world.onEvent<SceneTransitionCompleteEvent>(
    SCENE_EVENTS.TRANSITION_COMPLETE,
    (event) => {
      console.log(
        `[Scene] Transition complete: ${event.data.from?.id ?? "none"} → ${event.data.to.id} (type: ${event.data.transitionType})`
      );
    }
  );

  world.onEvent<SceneLoadEvent>(
    SCENE_EVENTS.LOAD,
    (event) => {
      console.log(`[Scene] Scene loaded: ${event.data.scene.id}`);
    }
  );

  world.onEvent<SceneUnloadEvent>(
    SCENE_EVENTS.UNLOAD,
    (event) => {
      console.log(`[Scene] Scene unloaded: ${event.data.scene.id}`);
    }
  );

  world.onEvent<ScenePauseEvent>(
    SCENE_EVENTS.PAUSE,
    (event) => {
      console.log(`[Scene] Scene paused: ${event.data.scene.id}`);
    }
  );

  world.onEvent<SceneResumeEvent>(
    SCENE_EVENTS.RESUME,
    (event) => {
      console.log(`[Scene] Scene resumed: ${event.data.scene.id}`);
    }
  );

  // Note: Additional event listeners can be added here for analytics, logging, or other side effects
  // Examples:
  // - Track scene transitions for analytics
  // - Pause audio/music on scene pause
  // - Save state on scene unload
  // - Trigger post-processing effects on transitions
  // All without modifying the scene classes or GameUI component!
  globalThis.addEventListener("resize", () => {
    // Update Three.js camera aspect ratio
    const camera = rendererSystem.getCamera();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  // Start game loop
  startGameLoop(world, time, pauseSystem, pauseState);
}

/**
 * Start the main game loop
 */
function startGameLoop(world: World, time: Time, pauseSystem: PauseSystem, pauseState: PauseState) {
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

// Initialize the app
function main() {
  createRoot(document.getElementById("ui")!).render(<App />);
}

main();
