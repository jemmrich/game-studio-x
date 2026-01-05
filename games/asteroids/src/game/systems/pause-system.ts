import type { World } from "@engine/core/world.ts";
import { PauseState } from "../resources/pause-state.ts";

/**
 * PauseSystem
 * Listens for 'P' key to toggle pause state and auto-pauses on browser blur
 */
export class PauseSystem {
  private keysPressed: Set<string> = new Set();
  private initialized = false;
  private blurHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;

  update(world: World, _dt: number): void {
    if (!this.initialized) {
      this.setupKeyboardListeners();
      this.setupFocusListeners(world);
      this.initialized = true;
    }

    // Handle pause toggle (P key)
    if (this.keysPressed.has("p") || this.keysPressed.has("P")) {
      const pauseState = world.getResource<PauseState>("pauseState");
      if (pauseState) {
        pauseState.toggle();
        const isPaused = pauseState.getIsPaused();
        console.log(`[PauseSystem] Game ${isPaused ? "paused" : "resumed"}`);
      }
      // Consume the P key press
      this.keysPressed.delete("p");
      this.keysPressed.delete("P");
    }
  }

  private setupKeyboardListeners(): void {
    globalThis.addEventListener("keydown", (event: KeyboardEvent) => {
      this.keysPressed.add(event.key);
    });

    globalThis.addEventListener("keyup", (event: KeyboardEvent) => {
      this.keysPressed.delete(event.key);
    });
  }

  private setupFocusListeners(world: World): void {
    // Auto-pause when browser loses focus (player is actively playing)
    this.blurHandler = () => {
      const pauseState = world.getResource<PauseState>("pauseState");
      if (pauseState && !pauseState.getIsPaused()) {
        pauseState.pause();
        console.log("[PauseSystem] Game auto-paused on browser blur");
      }
    };

    // Don't auto-resume on focus - let player decide by pressing P
    this.focusHandler = () => {
      console.log("[PauseSystem] Browser regained focus");
    };

    globalThis.addEventListener("blur", this.blurHandler);
    globalThis.addEventListener("focus", this.focusHandler);
  }

  dispose(): void {
    this.keysPressed.clear();
    if (this.blurHandler) {
      globalThis.removeEventListener("blur", this.blurHandler);
    }
    if (this.focusHandler) {
      globalThis.removeEventListener("focus", this.focusHandler);
    }
  }
}
