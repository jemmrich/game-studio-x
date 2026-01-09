import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import { MenuScene } from "./menu-scene.ts";
import { AudioSystem } from "../systems/audio-system.ts";
import type { GameStats } from "../features/game-stats-plugin/mod.ts";
import * as THREE from "three";

/**
 * GameOverScene - Game over screen
 *
 * This scene displays the game over screen with a simple message.
 * It serves as a pause point before returning to the main menu.
 *
 * Features:
 * - Displays "GAME OVER" text
 * - Shows "Press Any Key" to return to menu
 * - Listens for keyboard input to transition back to menu
 * - Emits scene-transition events for UI to react to scene changes
 * - Stops background music
 *
 * Scene Lifecycle:
 * - init(): Set up keyboard listener
 * - dispose(): Clean up
 */
export class GameOverScene extends BaseScene {
  private threeJsScene: THREE.Scene;
  private keyListenerAdded = false;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-game-over");
    this.threeJsScene = threeJsScene;
  }

  /**
   * Initialize the game over scene
   *
   * Sets up input handling for returning to menu
   */
  init(world: World): void {
    // Save high score if current score is higher
    const gameStats = world.getResource<GameStats>("gameStats");
    if (gameStats) {
      const isNewHighScore = gameStats.saveHighScoreIfHigher();
      if (isNewHighScore) {
        console.log(`[GameOverScene] New high score: ${gameStats.currentScore}`);
      }
    }

    // Emit scene-transition event for UI
    world.emitEvent("scene-transition", { view: "game-over" });

    // Stop background music
    AudioSystem.stopBackgroundMusic(null);

    /**
     * Set up keyboard listener to return to menu on any key press
     */
    if (!this.keyListenerAdded) {
      this.setupKeyboardListener(world);
      this.keyListenerAdded = true;
    }
  }

  /**
   * Handle keyboard input to return to menu
   *
   * When the user presses any key:
   * 1. Emit scene-transition event (for UI)
   * 2. Load MenuScene via SceneManager
   * 3. Remove keyboard listener
   */
  private setupKeyboardListener(world: World): void {
    const handleKeyPress = () => {
      // Emit event for React to update UI
      world.emitEvent("scene-transition", { view: "menu" });

      const sceneManager = world.getResource<SceneManager>("sceneManager");
      if (sceneManager) {
        sceneManager.loadScene(new MenuScene(this.threeJsScene));
      }
      // Remove listener after first key press
      globalThis.removeEventListener("keydown", handleKeyPress);
    };

    globalThis.addEventListener("keydown", handleKeyPress);
  }

  /**
   * Clean up game over scene resources
   */
  dispose(_world: World): void {
    console.log(`[GameOverScene] Dispose complete`);
  }
}
