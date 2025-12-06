import type { World } from "../core/world.ts";
import { SceneManager } from "../resources/scene-manager.ts";

/**
 * System that handles global keyboard input for demo scenes.
 * Currently handles:
 * - R key: Reset the current active scene
 */
export class DemoInputSystem {
  private keysPressed: Set<string> = new Set();
  private initialized = false;

  update(world: World, _dt: number): void {
    // Set up keyboard listeners on first run
    if (!this.initialized) {
      this.setupKeyboardListeners();
      this.initialized = true;
    }

    // Check if R was pressed this frame
    if (this.keysPressed.has("r") || this.keysPressed.has("R")) {
      const sceneManager = world.getResource<SceneManager>("sceneManager");
      if (sceneManager) {
        const currentScene = sceneManager.getCurrentScene();
        if (currentScene) {
          currentScene.reset(world);
          console.log("Scene reset triggered by R key");
        }
      }
      // Clear the key press so it only triggers once per press
      this.keysPressed.delete("r");
      this.keysPressed.delete("R");
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
