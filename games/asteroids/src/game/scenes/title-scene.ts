import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import { Tag } from "@engine/components/tag.ts";
import { spawnAsteroid, AsteroidRenderSystem } from "../features/asteroid-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { GameplayScene } from "./gameplay.ts";
import { AudioSystem } from "../systems/audio-system.ts";
import * as THREE from "three";

/**
 * TitleScene - Main menu and title screen
 *
 * This scene displays the title screen with animated asteroids in the background.
 * It serves as the entry point to the game and transitions to GameplayScene when
 * the user presses any key.
 *
 * Features:
 * - Spawns 30 asteroids of mixed sizes for visual effect
 * - Manages background music (starts on user interaction per browser autoplay policy)
 * - Listens for keyboard input to transition to gameplay
 * - Emits scene-transition events for UI to react to scene changes
 *
 * Scene Lifecycle:
 * - init(): Spawn asteroids and set up keyboard listener
 * - dispose(): Stop music and clean up asteroids
 */
export class TitleScene extends BaseScene {
  private threeJsScene: THREE.Scene;
  private keyListenerAdded = false;
  private asteroidEntityIds: GUID[] = [];
  private backgroundMusic: HTMLAudioElement | null = null;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-title");
    this.threeJsScene = threeJsScene;
  }

  /**
   * Initialize the title scene
   *
   * Spawns decorative asteroids and sets up input handling
   */
  init(world: World): void {
    // NOTE: All plugins are already installed in main.tsx
    // This scene just spawns asteroids for visual effect

    world.emitEvent("scene-transition", { view: "title" });

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

    // Make asteroids visible on title screen
    for (const asteroidId of this.asteroidEntityIds) {
      const material = world.get<BasicMaterial>(asteroidId, BasicMaterial);
      if (material) {
        material.opacity = 1;
      }
    }

    // Note: Title scene doesn't need destruction system - it just displays animated asteroids

    /**
     * Set up keyboard listener to switch to gameplay on any key press
     * Also start background music on first interaction (browsers require user interaction for audio)
     */
    if (!this.keyListenerAdded) {
      this.setupKeyboardListener(world);
      this.keyListenerAdded = true;
      
      // Start background music on first user interaction (required by browser autoplay policy)
      const startMusicOnInteraction = () => {
        console.log("[TitleScene] User interaction detected, starting background music...");
        if (!this.backgroundMusic) {
          this.backgroundMusic = AudioSystem.playBackgroundMusic(world, 'background', 0.3);
          if (this.backgroundMusic) {
            console.log("[TitleScene] Background music started successfully");
          } else {
            console.warn("[TitleScene] Failed to start background music");
          }
        }
      };
      
      // Listen for any user interaction to start music
      globalThis.addEventListener('click', startMusicOnInteraction, { once: true });
      globalThis.addEventListener('keydown', startMusicOnInteraction, { once: true });
      
      console.log("[TitleScene] Waiting for user interaction to start background music...");
    }
  }

  /**
   * Handle keyboard input to transition to gameplay
   *
   * When the user presses any key:
   * 1. Stop background music
   * 2. Emit scene-transition event (for UI)
   * 3. Load GameplayScene via SceneManager
   * 4. Remove keyboard listener
   */
  private setupKeyboardListener(world: World): void {
    const handleKeyPress = () => {
      // Stop background music
      AudioSystem.stopBackgroundMusic(this.backgroundMusic);
      this.backgroundMusic = null;

      // Emit event for React to update UI
      world.emitEvent("scene-transition", { view: "gameplay" });

      const sceneManager = world.getResource<SceneManager>("sceneManager");
      if (sceneManager) {
        sceneManager.loadScene(new GameplayScene(this.threeJsScene));
      }
      // Remove listener after first key press
      globalThis.removeEventListener("keydown", handleKeyPress);
    };

    globalThis.addEventListener("keydown", handleKeyPress);
  }

  /**
   * Clean up title scene resources
   *
   * - Stop background music if still playing
   * - Remove all spawned asteroids
   * - Base class cleanup of tagged entities
   */
  dispose(world: World): void {
    // Stop background music if still playing
    if (this.backgroundMusic) {
      AudioSystem.stopBackgroundMusic(this.backgroundMusic);
      this.backgroundMusic = null;
    }

    // Remove all spawned asteroids from the scene
    console.log(`[TitleScene] Disposing - cleaning up ${this.asteroidEntityIds.length} asteroids`);
    for (const asteroidId of this.asteroidEntityIds) {
      if (world.entityExists(asteroidId)) {
        world.destroyEntity(asteroidId);
      }
    }
    this.asteroidEntityIds = [];
    console.log(`[TitleScene] Dispose complete`);
  }
}
