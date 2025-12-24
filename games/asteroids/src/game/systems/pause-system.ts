import type { World } from "@engine/core/world.ts";
import { PauseState } from "../resources/pause-state.ts";

/**
 * PauseSystem
 * Listens for 'P' key to toggle pause state
 */
export class PauseSystem {
  private keysPressed: Set<string> = new Set();
  private initialized = false;

  update(world: World, _dt: number): void {
    if (!this.initialized) {
      this.setupKeyboardListeners();
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

  dispose(): void {
    this.keysPressed.clear();
  }
}
