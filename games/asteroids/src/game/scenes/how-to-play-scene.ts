import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import { Tag } from "@engine/components/tag.ts";
import { spawnAsteroid, AsteroidRenderSystem } from "../features/asteroid-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { MenuScene } from "./menu-scene.ts";
import * as THREE from "three";

/**
 * HowToPlayScene - How to play instruction screen
 *
 * This scene displays the game instructions and controls with animated asteroids
 * in the background. It serves as an information screen accessible from the menu.
 *
 * Features:
 * - Spawns 30 asteroids of mixed sizes for visual effect (same as title/menu)
 * - Displays game instructions and control mappings
 * - Listens for keyboard input to return to menu
 * - Emits scene-transition events for UI to react to scene changes
 *
 * Scene Lifecycle:
 * - init(): Spawn asteroids and set up keyboard listener
 * - dispose(): Clean up asteroids
 */
export class HowToPlayScene extends BaseScene {
  private threeJsScene: THREE.Scene;
  private asteroidEntityIds: GUID[] = [];

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-how-to-play");
    this.threeJsScene = threeJsScene;
  }

  /**
   * Initialize the how to play scene
   *
   * Spawns decorative asteroids and sets up keyboard listener
   */
  init(world: World): void {
    world.emitEvent("scene-transition", { view: "how-to-play" });

    // Spawn 30 asteroids of mixed sizes across the screen for visual effect
    // Game world bounds are approximately X[-130, 130] Y[-57, 57]
    const spawnPositions: Array<[number, number, number]> = [
      // Large asteroids (size 3) - 10 total
      [-100, -40, 0],
      [100, -40, 0],
      [-100, 40, 0],
      [100, 40, 0],
      [0, -50, 0],
      [0, 50, 0],
      [-120, 0, 0],
      [120, 0, 0],
      [-110, -50, 0],
      [110, 50, 0],
      // Medium asteroids (size 2) - 10 total
      [-60, -30, 0],
      [60, -30, 0],
      [-60, 30, 0],
      [60, 30, 0],
      [-30, -50, 0],
      [30, -50, 0],
      [-30, 50, 0],
      [30, 50, 0],
      [0, 0, 0],
      [-70, 0, 0],
      // Small asteroids (size 1) - 10 total
      [-80, -20, 0],
      [80, -20, 0],
      [-80, 20, 0],
      [80, 20, 0],
      [-40, 0, 0],
      [40, 0, 0],
      [-15, -35, 0],
      [15, 35, 0],
      [-50, -45, 0],
      [50, 45, 0],
    ];

    // Spawn asteroids with mixed sizes
    for (let i = 0; i < spawnPositions.length; i++) {
      const position = spawnPositions[i];
      let size: 1 | 2 | 3;
      
      if (i < 10) {
        size = 3; // Large
      } else if (i < 20) {
        size = 2; // Medium
      } else {
        size = 1; // Small
      }
      
      const asteroidId = spawnAsteroid(world, position, size);
      // Tag asteroid with scene ID for automatic cleanup on scene transition
      world.add(asteroidId, new Tag(this.id));
      this.asteroidEntityIds.push(asteroidId);
    }

    // Create and register Three.js rendering system for asteroids
    const asteroidRenderSystem = new AsteroidRenderSystem(this.threeJsScene);
    world.addSystem(asteroidRenderSystem);

    // Make asteroids visible on how to play screen with reduced opacity
    for (const asteroidId of this.asteroidEntityIds) {
      const material = world.get<BasicMaterial>(asteroidId, BasicMaterial);
      if (material) {
        material.opacity = 0.2;
      }
    }

    // Set up keyboard listener to return to menu
    this.setupKeyboardListener(world);
  }

  /**
   * Handle keyboard input to return to menu
   *
   * When the user presses Escape or any other key:
   * 1. Emit scene-transition event (for UI)
   * 2. Load MenuScene via SceneManager
   */
  private setupKeyboardListener(world: World): void {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const sceneManager = world.getResource<SceneManager>("sceneManager");
        if (sceneManager) {
          sceneManager.loadScene(new MenuScene(this.threeJsScene));
        }
        globalThis.removeEventListener("keydown", handleKeyPress);
      }
    };

    globalThis.addEventListener("keydown", handleKeyPress);
  }

  /**
   * Clean up how to play scene resources
   *
   * - Remove all spawned asteroids
   * - Base class cleanup of tagged entities
   */
  dispose(world: World): void {
    // Remove all spawned asteroids from the scene
    console.log(`[HowToPlayScene] Disposing - cleaning up ${this.asteroidEntityIds.length} asteroids`);
    for (const asteroidId of this.asteroidEntityIds) {
      if (world.entityExists(asteroidId)) {
        world.destroyEntity(asteroidId);
      }
    }
    this.asteroidEntityIds = [];
    console.log(`[HowToPlayScene] Dispose complete`);
  }
}
