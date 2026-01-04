import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import type { GUID } from "@engine/utils/guid.ts";

/**
 * EnteringZoneScene - Temporary overlay scene during wave transitions
 *
 * This scene is pushed onto the scene stack when a wave completes and a new wave
 * is about to start. It displays the entering zone effect (particles, animations)
 * while pausing the underlying gameplay scene.
 *
 * The scene automatically pops itself from the stack after the effect duration completes.
 *
 * Architecture:
 * - Scene Stack: [EnteringZoneScene] on top, [GameplayScene] paused underneath
 * - When effect completes, popScene() returns control to GameplayScene
 * - The underlying GameplayScene's pause/resume methods handle paused state
 *
 * Key Points:
 * - This is a PAUSED scene (overlays gameplay without running it)
 * - Wave number is tracked here for display purposes
 * - Scene auto-pops after effect completes (no external event needed)
 * - All particles/effects are created in this scene and cleaned up on dispose
 */
export class EnteringZoneScene extends BaseScene {
  private waveNumber: number;
  private effectDuration: number = 3000; // milliseconds
  private startTime: number = 0;
  private autoPopTimerId: number | null = null;

  /**
   * Create an entering zone scene for the given wave number
   * @param waveNumber - The wave number being entered (1-based)
   * @param effectDuration - Duration of effect in milliseconds (default: 3000ms)
   */
  constructor(waveNumber: number, effectDuration?: number) {
    super("asteroids-entering-zone");
    this.waveNumber = waveNumber;
    if (effectDuration !== undefined) {
      this.effectDuration = effectDuration;
    }
  }

  /**
   * Get the wave number for this scene
   */
  getWaveNumber(): number {
    return this.waveNumber;
  }

  /**
   * Initialize the entering zone effect
   *
   * This method:
   * 1. Marks the start time of the effect
   * 2. Notifies the world that we're entering a zone (for systems that need to react)
   * 3. Sets up a timer to automatically pop this scene when the effect completes
   * 4. Spawns any visual effects (handled by entering-zone-effect-plugin)
   */
  init(world: World): void {
    this.startTime = performance.now();

    // Emit event to trigger entering zone effect
    // This tells the entering-zone-effect-plugin to spawn particles and animations
    world.emitEvent("entering_zone", {
      waveNumber: this.waveNumber,
    });

    // Schedule automatic pop when effect completes
    // This removes this scene from the stack and returns to GameplayScene
    this.autoPopTimerId = window.setTimeout(() => {
      this.autoPopScene(world);
      this.autoPopTimerId = null;
    }, this.effectDuration);
  }

  /**
   * Automatically pop this scene from the stack after effect completes
   *
   * This prevents the need for an external event to complete the effect.
   * The scene is entirely self-contained in its lifecycle.
   */
  private autoPopScene(world: World): void {
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (sceneManager) {
      sceneManager.popScene(world);
    }
  }

  /**
   * Get elapsed time since effect started (in milliseconds)
   */
  getElapsedTime(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get progress of effect (0.0 to 1.0)
   */
  getProgress(): number {
    const elapsed = this.getElapsedTime();
    return Math.min(1.0, elapsed / this.effectDuration);
  }

  /**
   * Called when the scene is paused (e.g., another scene pushed on top)
   */
  pause(_world: World): void {
    // Could pause particle animations here if needed
  }

  /**
   * Called when the scene is resumed (e.g., scene on top popped)
   */
  resume(_world: World): void {
    // Could resume particle animations here if needed
  }

  /**
   * Clean up the entering zone effect when scene is disposed
   *
   * This handles:
   * - Canceling the auto-pop timer if it hasn't fired yet
   * - Cleaning up any particles or visual effects
   * - Base class cleanup of tagged entities
   */
  dispose(world: World): void {
    // Cancel timer if effect hasn't completed yet
    if (this.autoPopTimerId !== null) {
      window.clearTimeout(this.autoPopTimerId);
      this.autoPopTimerId = null;
    }

    // Emit event to notify systems the effect is ending
    // Systems listening for this can clean up particles, etc.
    world.emitEvent("entering_zone_effect_complete", {
      waveNumber: this.waveNumber,
    });

    // Base class cleanup: removes all entities tagged with this scene's ID
    super.dispose(world);
  }
}
