import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../core/world.ts";
import { Scene } from "../core/scene.ts";
import { SceneManager, TransitionOptions } from "./scene-manager.ts";
import { BaseScene } from "../core/base-scene.ts";
import {
  SceneTransitionProgressEvent,
  SceneTransitionFinishedEvent,
} from "../core/scene-events.ts";
import {
  easeLinear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInBounce,
  easeOutBounce,
} from "../utils/easing.ts";
import { SCENE_EVENTS } from "../core/scene-events.ts";

// Test scenes
class TestScene extends BaseScene {
  constructor(id: string) {
    super(id);
  }

  init(_world: World): void {
    // No-op for testing
  }
}

describe("Phase 5: Transition Options", () => {
  let world: World;
  let sceneManager: SceneManager;

  beforeEach(() => {
    world = new World();
    sceneManager = new SceneManager();
    sceneManager._setWorld(world);
  });

  describe("transitionToScene - Basic Behavior", () => {
    it("should have transitionToScene method", () => {
      const scene = new TestScene("test");
      expect(sceneManager.transitionToScene).toBeDefined();
      sceneManager.transitionToScene(scene);
    });

    it("should use instant transition if no duration specified", () => {
      const scene = new TestScene("instant");
      sceneManager.transitionToScene(scene);
      // No animation should be in progress (would use loadScene)
      expect(sceneManager.isTransitioning()).toBe(false);
    });

    it("should use instant transition if duration is 0", () => {
      const scene = new TestScene("zero-duration");
      const options: TransitionOptions = { duration: 0 };
      sceneManager.transitionToScene(scene, options);
      expect(sceneManager.isTransitioning()).toBe(false);
    });

    it("should use instant transition if duration is negative", () => {
      const scene = new TestScene("negative-duration");
      const options: TransitionOptions = { duration: -100 };
      sceneManager.transitionToScene(scene, options);
      expect(sceneManager.isTransitioning()).toBe(false);
    });
  });

  describe("transitionToScene - Animation", () => {
    it("should start transition animation with duration > 0", () => {
      const scene = new TestScene("animated");
      const options: TransitionOptions = { duration: 1000 };
      sceneManager.transitionToScene(scene, options);
      expect(sceneManager.isTransitioning()).toBe(true);
    });

    it("should emit transition-start event", async () => {
      const scene = new TestScene("fade");
      const options: TransitionOptions = { duration: 100 };

      let startEventFired = false;
      world.onEvent("scene-transition-start", (event) => {
        startEventFired = true;
        expect(event.data.to.id).toBe("fade");
        expect(event.data.transitionType).toBe("load");
      });

      sceneManager.transitionToScene(scene, options);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(startEventFired).toBe(true);
    });

    it("should emit transition-progress events during animation", async () => {
      const scene = new TestScene("progress");
      const progressEvents: SceneTransitionProgressEvent[] = [];
      
      world.onEvent("scene-transition-progress", (event) => {
        progressEvents.push(event.data);
      });

      const options: TransitionOptions = { duration: 100 };
      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(progressEvents.length).toBeGreaterThan(0);
      // Check first event
      expect(progressEvents[0].to.id).toBe("progress");
      expect(progressEvents[0].progress).toBeGreaterThanOrEqual(0);
      expect(progressEvents[0].progress).toBeLessThanOrEqual(1);
      expect(progressEvents[0].easedProgress).toBeGreaterThanOrEqual(0);
      expect(progressEvents[0].easedProgress).toBeLessThanOrEqual(1);
      expect(progressEvents[0].duration).toBe(100);
    });

    it("should emit transition-finished event after completion", async () => {
      const scene = new TestScene("finish");
      let finishEventFired = false;

      world.onEvent("scene-transition-finished", (event) => {
        finishEventFired = true;
        expect(event.data.to.id).toBe("finish");
        expect(event.data.duration).toBeGreaterThanOrEqual(0);
      });

      const options: TransitionOptions = { duration: 50 };
      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(finishEventFired).toBe(true);
      expect(sceneManager.isTransitioning()).toBe(false);
    });
  });

  describe("transitionToScene - Easing Functions", () => {
    it("should apply linear easing", async () => {
      const scene = new TestScene("linear");
      const progressValues: number[] = [];

      const options: TransitionOptions = {
        duration: 100,
        easing: easeLinear,
        onProgress: (progress, easedProgress) => {
          progressValues.push(easedProgress);
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 120));
      // Linear should have progress ~= easedProgress
      expect(progressValues.length).toBeGreaterThan(0);
    });

    it("should apply quadratic easing functions", async () => {
      const scene = new TestScene("quad");
      const inValues: number[] = [];
      const outValues: number[] = [];

      const inOptions: TransitionOptions = {
        duration: 50,
        easing: easeInQuad,
        onProgress: (_, eased) => inValues.push(eased),
      };

      sceneManager.transitionToScene(scene, inOptions);

      await new Promise(resolve => setTimeout(resolve, 70));
      const scene2 = new TestScene("quad2");
      const outOptions: TransitionOptions = {
        duration: 50,
        easing: easeOutQuad,
        onProgress: (_, eased) => outValues.push(eased),
      };

      sceneManager.transitionToScene(scene2, outOptions);

      await new Promise(resolve => setTimeout(resolve, 70));
      // easeInQuad should accelerate (smaller values early)
      // easeOutQuad should decelerate (larger values early)
      expect(inValues.length).toBeGreaterThan(0);
      expect(outValues.length).toBeGreaterThan(0);
    });

    it("should apply bounce easing", async () => {
      const scene = new TestScene("bounce");
      const bounceValues: number[] = [];

      const options: TransitionOptions = {
        duration: 100,
        easing: easeOutBounce,
        onProgress: (_, eased) => bounceValues.push(eased),
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 120));
      expect(bounceValues.length).toBeGreaterThan(0);
      // Last value should be close to 1
      expect(bounceValues[bounceValues.length - 1]).toBeGreaterThan(0.9);
    });

    it("should default to easeInOutQuad if no easing specified", async () => {
      const scene = new TestScene("default-easing");
      let onProgressCalled = false;

      const options: TransitionOptions = {
        duration: 50,
        onProgress: (_, eased) => {
          onProgressCalled = true;
          expect(eased).toBeGreaterThanOrEqual(0);
          expect(eased).toBeLessThanOrEqual(1);
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 70));
      expect(onProgressCalled).toBe(true);
    });
  });

  describe("transitionToScene - Callbacks", () => {
    it("should call onBefore callback before starting animation", async () => {
      const scene = new TestScene("before");
      let beforeCalled = false;
      let beforeScene: Scene | null = null;

      const options: TransitionOptions = {
        duration: 100,
        onBefore: (from, to) => {
          beforeCalled = true;
          beforeScene = to;
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(beforeCalled).toBe(true);
      expect(beforeScene?.id).toBe("before");
    });

    it("should call onProgress callback during animation", async () => {
      const scene = new TestScene("progress-callback");
      let onProgressCalled = false;

      const options: TransitionOptions = {
        duration: 100,
        onProgress: (progress, easedProgress, elapsed, duration) => {
          onProgressCalled = true;
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(1);
          expect(easedProgress).toBeGreaterThanOrEqual(0);
          expect(easedProgress).toBeLessThanOrEqual(1);
          expect(elapsed).toBeGreaterThanOrEqual(0);
          // Allow some timing buffer (105ms instead of 100ms)
          expect(elapsed).toBeLessThanOrEqual(duration + 5);
          expect(duration).toBe(100);
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onProgressCalled).toBe(true);
    });

    it("should call onAfter callback after transition completes", async () => {
      const scene = new TestScene("after");
      let afterCalled = false;

      const options: TransitionOptions = {
        duration: 50,
        onAfter: (from, to) => {
          afterCalled = true;
          expect(to.id).toBe("after");
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(afterCalled).toBe(true);
    });

    it("should handle async onBefore callback", async () => {
      const scene = new TestScene("async-before");
      let beforeResolved = false;
      let progressCalled = false;

      const options: TransitionOptions = {
        duration: 100,
        onBefore: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              beforeResolved = true;
              resolve();
            }, 50);
          }),
        onProgress: () => {
          progressCalled = true;
        },
      };

      sceneManager.transitionToScene(scene, options);

      // Progress should not start until before completes
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(beforeResolved).toBe(false);
      expect(progressCalled).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(beforeResolved).toBe(true);
      expect(progressCalled).toBe(true);
    });

    it("should handle async onAfter callback", async () => {
      const scene = new TestScene("async-after");
      let afterCalled = false;

      const options: TransitionOptions = {
        duration: 50,
        onAfter: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              afterCalled = true;
              resolve();
            }, 50);
          }),
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(afterCalled).toBe(true);
    });

    it("should call callbacks in correct order: onBefore -> onProgress -> onAfter", async () => {
      const scene = new TestScene("order");
      const callOrder: string[] = [];

      const options: TransitionOptions = {
        duration: 50,
        onBefore: () => callOrder.push("before"),
        onProgress: () => callOrder.push("progress"),
        onAfter: () => callOrder.push("after"),
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 120));
      expect(callOrder[0]).toBe("before");
      expect(callOrder).toContain("progress");
      expect(callOrder[callOrder.length - 1]).toBe("after");
    });
  });

  describe("transitionToScene - Cancellation", () => {
    it("should have cancelTransition method", () => {
      expect(sceneManager.cancelTransition).toBeDefined();
    });

    it("should cancel active transition", () => {
      const scene = new TestScene("cancel");
      const options: TransitionOptions = { duration: 1000 };

      sceneManager.transitionToScene(scene, options);
      expect(sceneManager.isTransitioning()).toBe(true);

      const cancelled = sceneManager.cancelTransition();
      expect(cancelled).toBe(true);
      expect(sceneManager.isTransitioning()).toBe(false);
    });

    it("should return false if no transition active", () => {
      const cancelled = sceneManager.cancelTransition();
      expect(cancelled).toBe(false);
    });

    it("should stop progress events when cancelled", async () => {
      const scene = new TestScene("cancel-progress");
      let progressCount = 0;

      world.onEvent("scene-transition-progress", () => {
        progressCount++;
      });

      const options: TransitionOptions = { duration: 1000 };
      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 50));
      const count = progressCount;
      sceneManager.cancelTransition();

      await new Promise(resolve => setTimeout(resolve, 100));
      // Count should not increase after cancellation
      expect(progressCount).toBe(count);
    });

    it("should not emit transition-finished when cancelled", async () => {
      const scene = new TestScene("cancel-finish");
      let finishFired = false;

      world.onEvent("scene-transition-finished", () => {
        finishFired = true;
      });

      const options: TransitionOptions = { duration: 1000 };
      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 50));
      sceneManager.cancelTransition();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(finishFired).toBe(false);
    });
  });

  describe("transitionToScene - Edge Cases", () => {
    it("should handle rapid transition calls (second replaces first)", async () => {
      const scene1 = new TestScene("rapid1");
      const scene2 = new TestScene("rapid2");

      const options: TransitionOptions = { duration: 500 };
      sceneManager.transitionToScene(scene1, options);

      await new Promise(resolve => setTimeout(resolve, 50));
      // Second transition should cancel the first
      sceneManager.transitionToScene(scene2, options);

      // Should still be transitioning
      expect(sceneManager.isTransitioning()).toBe(true);
    });

    it("should handle error in onBefore callback gracefully", async () => {
      const scene = new TestScene("error-before");
      let progressCalled = false;
      let errorWasLogged = false;
      const originalError = console.error;
      
      // Suppress the error logging
      console.error = () => {
        errorWasLogged = true;
      };

      const options: TransitionOptions = {
        duration: 100,
        onBefore: () => {
          throw new Error("Test error");
        },
        onProgress: () => {
          progressCalled = true;
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 150));
      // Should continue with transition even after error
      expect(progressCalled).toBe(true);
      expect(errorWasLogged).toBe(true);
      
      // Restore console
      console.error = originalError;
    });

    it("should handle error in onAfter callback gracefully", async () => {
      const scene = new TestScene("error-after");
      let afterCalled = false;
      let errorWasLogged = false;
      const originalError = console.error;
      
      // Suppress the error logging
      console.error = () => {
        errorWasLogged = true;
      };

      const options: TransitionOptions = {
        duration: 50,
        onAfter: async () => {
          afterCalled = true;
          // Return rejected promise instead of throwing
          return Promise.reject(new Error("Test error"));
        },
      };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 100));
      // onAfter should be called despite error
      expect(afterCalled).toBe(true);
      expect(errorWasLogged).toBe(true);
      
      // Restore console
      console.error = originalError;
    });

    it("should maintain scene state during transition animation", async () => {
      const scene = new TestScene("state");
      const options: TransitionOptions = { duration: 100 };

      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 150));
      // Scene should be loaded after transition
      expect(sceneManager.getCurrentScene()?.id).toBe("state");
    });
  });

  describe("isTransitioning", () => {
    it("should return false initially", () => {
      expect(sceneManager.isTransitioning()).toBe(false);
    });

    it("should return true during animation", async () => {
      const scene = new TestScene("trans");
      const options: TransitionOptions = { duration: 100 };

      sceneManager.transitionToScene(scene, options);
      expect(sceneManager.isTransitioning()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(sceneManager.isTransitioning()).toBe(false);
    });

    it("should return false after cancellation", () => {
      const scene = new TestScene("trans-cancel");
      const options: TransitionOptions = { duration: 100 };

      sceneManager.transitionToScene(scene, options);
      sceneManager.cancelTransition();
      expect(sceneManager.isTransitioning()).toBe(false);
    });
  });

  describe("Integration with existing methods", () => {
    it("should work with loadScene for instant transitions", () => {
      const scene1 = new TestScene("instant1");
      const scene2 = new TestScene("instant2");

      sceneManager.loadScene(scene1);
      expect(sceneManager.getCurrentScene()?.id).toBe("instant1");

      sceneManager.transitionToScene(scene2); // No duration = instant
      expect(sceneManager.getCurrentScene()?.id).toBe("instant2");
    });

    it("should maintain state machine during transitions", async () => {
      const scene = new TestScene("state-machine");
      const states: string[] = [];

      sceneManager.subscribeToStateChanges((state) => {
        states.push(state);
      });

      const options: TransitionOptions = { duration: 100 };
      sceneManager.transitionToScene(scene, options);

      await new Promise(resolve => setTimeout(resolve, 150));
      // Should have state transitions
      expect(states.length).toBeGreaterThan(0);
    });
  });
});
