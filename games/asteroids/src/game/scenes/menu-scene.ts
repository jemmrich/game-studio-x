import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import { Tag } from "@engine/components/tag.ts";
import { spawnAsteroid, AsteroidRenderSystem } from "../features/asteroid-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { GameplayScene } from "./gameplay.ts";
import { AudioSystem } from "../systems/audio-system.ts";
import { GameStats } from "../features/game-stats-plugin/mod.ts";
import { WaveManager } from "../features/wave-manager-plugin/mod.ts";
import * as THREE from "three";

/**
 * MenuScene - Main menu screen
 *
 * This scene displays the main menu with animated asteroids in the background.
 * It serves as the transition point between the title screen and gameplay.
 *
 * Features:
 * - Spawns 30 asteroids of mixed sizes for visual effect (same as title)
 * - Manages background music continuation from title
 * - Listens for menu item selection (from React UI)
 * - Emits scene-transition events for UI to react to scene changes
 *
 * Scene Lifecycle:
 * - init(): Spawn asteroids and set up menu listeners
 * - dispose(): Clean up asteroids
 */
export class MenuScene extends BaseScene {
  private threeJsScene: THREE.Scene;
  private asteroidEntityIds: GUID[] = [];
  private backgroundMusic: HTMLAudioElement | null = null;
  private unsubscribeMenuListener?: () => void;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-menu");
    this.threeJsScene = threeJsScene;
  }

  /**
   * Initialize the menu scene
   *
   * Spawns decorative asteroids and sets up menu item listeners
   */
  init(world: World): void {
    world.emitEvent("scene-transition", { view: "menu" });

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

    // Make asteroids visible on menu screen
    for (const asteroidId of this.asteroidEntityIds) {
      const material = world.get<BasicMaterial>(asteroidId, BasicMaterial);
      if (material) {
        material.opacity = 1;
      }
    }

    // Set up listener for menu selection
    this.unsubscribeMenuListener = this.setupMenuListener(world);
  }

  /**
   * Handle menu item selection from React UI
   *
   * Listens for menu-item-selected events and transitions based on selection
   * Returns an unsubscribe function to clean up the listener
   */
  private setupMenuListener(world: World): () => void {
    return world.onEvent("menu-item-selected", (event) => {
      const menuItem = event.data?.menuItem as string;
      console.log(`[MenuScene] Menu item selected: ${menuItem}`);
      
      if (menuItem === "new-game") {
        console.log("[MenuScene] Starting new game - resetting stats and wave manager");
        
        // Reset game stats and wave manager to their initial state
        const gameStats = world.getResource<GameStats>("gameStats");
        if (gameStats) {
          console.log(`[MenuScene] Before reset - Lives: ${gameStats.currentLives}, Score: ${gameStats.currentScore}, Deaths: ${gameStats.totalDeaths}`);
          gameStats.reset();
          console.log(`[MenuScene] After reset - Lives: ${gameStats.currentLives}, Score: ${gameStats.currentScore}, Deaths: ${gameStats.totalDeaths}`);
        } else {
          console.warn("[MenuScene] GameStats resource not found!");
        }

        const waveManager = world.getResource<WaveManager>("waveManager");
        if (waveManager) {
          waveManager.reset();
          console.log("[MenuScene] WaveManager reset for new game");
        }

        // Load the gameplay scene
        const sceneManager = world.getResource<SceneManager>("sceneManager");
        if (sceneManager) {
          sceneManager.loadScene(new GameplayScene(this.threeJsScene));
        }
      } else if (menuItem === "high-scores") {
        // No-op for now
        console.log("[MenuScene] High scores selected (not implemented)");
      } else if (menuItem === "how-to-play") {
        // No-op for now
        console.log("[MenuScene] How to play selected (not implemented)");
      } else if (menuItem === "credits") {
        // No-op for now
        console.log("[MenuScene] Credits selected (not implemented)");
      }
    });
  }

  /**
   * Clean up menu scene resources
   *
   * - Unsubscribe from menu item selection listener
   * - Remove all spawned asteroids
   */
  dispose(world: World): void {
    // Unsubscribe from menu selection listener
    if (this.unsubscribeMenuListener) {
      this.unsubscribeMenuListener();
      console.log("[MenuScene] Unsubscribed from menu-item-selected event");
    }

    // Remove all spawned asteroids from the scene
    console.log(`[MenuScene] Disposing - cleaning up ${this.asteroidEntityIds.length} asteroids`);
    for (const asteroidId of this.asteroidEntityIds) {
      if (world.entityExists(asteroidId)) {
        world.destroyEntity(asteroidId);
      }
    }
    this.asteroidEntityIds = [];
    console.log(`[MenuScene] Dispose complete`);
  }
}
