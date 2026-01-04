import { describe, it, expect, beforeEach, vi } from "vitest";
import { SceneManager } from "./scene-manager.ts";
import { Scene, SceneState } from "../core/scene.ts";
import { World } from "../core/world.ts";

// Mock scene for testing
class MockScene implements Scene {
  readonly id: string;
  createCalled = false;
  initCalled = false;
  pauseCalled = false;
  resumeCalled = false;
  resetCalled = false;
  disposeCalled = false;
  updateCalled = false;
  updateDt: number | null = null;

  constructor(id: string) {
    this.id = id;
  }

  create(): void {
    this.createCalled = true;
  }

  init(world: World): void {
    this.initCalled = true;
  }

  pause(world: World): void {
    this.pauseCalled = true;
  }

  resume(world: World): void {
    this.resumeCalled = true;
  }

  reset(world: World): void {
    this.resetCalled = true;
  }

  update(world: World, dt: number): void {
    this.updateCalled = true;
    this.updateDt = dt;
  }

  dispose(world: World): void {
    this.disposeCalled = true;
  }
}

describe("SceneManager", () => {
  let sceneManager: SceneManager;
  let world: World;

  beforeEach(() => {
    sceneManager = new SceneManager();
    world = new World();
  });

  describe("initialization", () => {
    it("should start with no active scene", () => {
      expect(sceneManager.getCurrentScene()).toBeNull();
    });

    it("should start in Unloaded state", () => {
      expect(sceneManager.getState()).toBe(SceneState.Unloaded);
    });

    it("should start with no pending scene", () => {
      expect(sceneManager.getPendingScene()).toBeNull();
    });
  });

  describe("loadScene", () => {
    it("should set pending scene", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      expect(sceneManager.getPendingScene()).toBe(scene);
    });

    it("should transition to Loading state when no current scene", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      expect(sceneManager.getState()).toBe(SceneState.Loading);
    });

    it("should transition to Unloading state when replacing current scene", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      // Set up scene1 as current
      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      // Load scene2
      sceneManager.loadScene(scene2);
      expect(sceneManager.getState()).toBe(SceneState.Unloading);
      expect(sceneManager.getPendingScene()).toBe(scene2);
    });

    it("should queue scene if already transitioning", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      sceneManager.loadScene(scene1);
      // Loading state, pending is scene1
      expect(sceneManager.getPendingScene()).toBe(scene1);

      sceneManager.loadScene(scene2);
      // Should replace pending with scene2
      expect(sceneManager.getPendingScene()).toBe(scene2);
    });
  });

  describe("pushScene", () => {
    it("should set new scene as pending", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      sceneManager.pushScene(scene2);

      expect(sceneManager.getPendingScene()).toBe(scene2);
    });

    it("should pause previous scene before pushing new one", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      sceneManager.pushScene(scene2);

      expect(scene1.pauseCalled).toBe(true);
    });

    it("should transition to Loading state for pushed scene", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      sceneManager.pushScene(scene2);

      expect(sceneManager.getState()).toBe(SceneState.Loading);
    });
  });

  describe("popScene", () => {
    it("should restore previous scene and set to Active", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      // Setup: load scene1
      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      // Push scene2
      sceneManager.pushScene(scene2);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene2);
      sceneManager._clearPending();

      // Pop should restore scene1
      sceneManager.popScene();

      expect(sceneManager.getCurrentScene()).toBe(scene1);
      expect(sceneManager.getState()).toBe(SceneState.Active);
    });

    it("should call dispose and resume on pop", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      sceneManager.loadScene(scene1);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      sceneManager.pushScene(scene2);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene2);
      sceneManager._clearPending();

      sceneManager.popScene();

      expect(scene2.disposeCalled).toBe(true);
      expect(scene1.resumeCalled).toBe(true);
    });

    it("should not throw if stack is empty", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene);

      // Should not throw
      expect(() => {
        sceneManager.popScene();
      }).not.toThrow();
    });

    it("should set state to Unloaded when last scene is popped", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene);

      sceneManager.popScene();

      expect(sceneManager.getState()).toBe(SceneState.Unloaded);
      expect(sceneManager.getCurrentScene()).toBeNull();
    });
  });

  describe("resetCurrentScene", () => {
    it("should call reset on current scene", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene);

      sceneManager.resetCurrentScene();

      expect(scene.resetCalled).toBe(true);
    });

    it("should not throw if no scene is active", () => {
      expect(() => {
        sceneManager.resetCurrentScene();
      }).not.toThrow();
    });

    it("should not reset if scene is not in Active state", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Loading);
      sceneManager._setCurrentScene(scene);

      sceneManager.resetCurrentScene();

      expect(scene.resetCalled).toBe(false);
    });
  });

  describe("scene lifecycle hooks", () => {
    it("should register onSceneLoad callback", () => {
      const scene = new MockScene("test");
      const callback = vi.fn();

      sceneManager.onSceneLoad(callback);
      
      // Callbacks are internal - verify they're registered
      // by calling the internal notify method
      sceneManager._notifySceneLoaded(scene);

      expect(callback).toHaveBeenCalledWith(scene);
    });

    it("should register onSceneUnload callback", () => {
      const scene = new MockScene("test");
      const callback = vi.fn();

      sceneManager.onSceneUnload(callback);
      sceneManager._notifySceneUnloaded(scene);

      expect(callback).toHaveBeenCalledWith(scene);
    });

    it("should register multiple callbacks", () => {
      const scene = new MockScene("test");
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      sceneManager.onSceneLoad(callback1);
      sceneManager.onSceneLoad(callback2);

      sceneManager._notifySceneLoaded(scene);

      expect(callback1).toHaveBeenCalledWith(scene);
      expect(callback2).toHaveBeenCalledWith(scene);
    });

    it("should trigger multiple unload callbacks", () => {
      const scene = new MockScene("test");
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      sceneManager.onSceneUnload(callback1);
      sceneManager.onSceneUnload(callback2);

      sceneManager._notifySceneUnloaded(scene);

      expect(callback1).toHaveBeenCalledWith(scene);
      expect(callback2).toHaveBeenCalledWith(scene);
    });
  });

  describe("state transitions", () => {
    it("should transition: Unloaded -> Loading -> Active", () => {
      const scene = new MockScene("test");

      expect(sceneManager.getState()).toBe(SceneState.Unloaded);

      sceneManager.loadScene(scene);
      expect(sceneManager.getState()).toBe(SceneState.Loading);

      // Simulate lifecycle system marking as active
      sceneManager._setState(SceneState.Active);

      expect(sceneManager.getState()).toBe(SceneState.Active);
    });

    it("should support Paused state", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Active); // Need to reach Active first
      sceneManager._setState(SceneState.Paused);

      expect(sceneManager.getState()).toBe(SceneState.Paused);
    });

    it("should support Unloading state", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
      sceneManager._setState(SceneState.Active); // Need to reach Active first
      sceneManager._setState(SceneState.Unloading);

      expect(sceneManager.getState()).toBe(SceneState.Unloading);
    });

    it("should transition correctly through unload/load cycle", () => {
      const scene1 = new MockScene("scene1");
      const scene2 = new MockScene("scene2");

      // Load scene1
      sceneManager.loadScene(scene1);
      expect(sceneManager.getState()).toBe(SceneState.Loading);
      expect(sceneManager.getPendingScene()).toBe(scene1);

      // Become active
      sceneManager._setState(SceneState.Active);
      sceneManager._setCurrentScene(scene1);
      sceneManager._clearPending();

      // Load scene2 (should trigger unload of scene1)
      sceneManager.loadScene(scene2);
      expect(sceneManager.getState()).toBe(SceneState.Unloading);
      expect(sceneManager.getPendingScene()).toBe(scene2);
    });
  });

  describe("scene stack operations (Phase 4)", () => {
    describe("stack queries", () => {
      it("should report zero stack depth with no current scene", () => {
        expect(sceneManager.getSceneStackDepth()).toBe(0);
      });

      it("should report zero total scenes with no current scene", () => {
        expect(sceneManager.getTotalSceneCount()).toBe(0);
      });

      it("should report 1 total scene when only current scene exists", () => {
        const scene = new MockScene("scene1");
        sceneManager.loadScene(scene);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene);
        sceneManager._clearPending();

        expect(sceneManager.getTotalSceneCount()).toBe(1);
        expect(sceneManager.getSceneStackDepth()).toBe(0);
      });

      it("should report correct counts with multiple stacked scenes", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");
        const scene3 = new MockScene("scene3");

        // Scene1 is current
        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        // Push scene2
        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        expect(sceneManager.getTotalSceneCount()).toBe(2);
        expect(sceneManager.getSceneStackDepth()).toBe(1);

        // Push scene3
        sceneManager.pushScene(scene3);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene3);
        sceneManager._clearPending();

        expect(sceneManager.getTotalSceneCount()).toBe(3);
        expect(sceneManager.getSceneStackDepth()).toBe(2);
      });

      it("should return scene stack in correct order", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");
        const scene3 = new MockScene("scene3");

        // Build stack: scene1 (bottom) <- scene2 <- scene3 (top/current)
        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        sceneManager.pushScene(scene3);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene3);
        sceneManager._clearPending();

        const stack = sceneManager.getSceneStack();
        expect(stack).toHaveLength(2);
        expect(stack[0]).toBe(scene1); // Bottom of stack
        expect(stack[1]).toBe(scene2); // Top of stack (but not current)
      });

      it("should return empty stack when no scenes paused", () => {
        const scene = new MockScene("scene1");
        sceneManager.loadScene(scene);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene);
        sceneManager._clearPending();

        const stack = sceneManager.getSceneStack();
        expect(stack).toHaveLength(0);
      });
    });

    describe("isScenePaused query", () => {
      it("should return false if scene is not in stack", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");

        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        expect(sceneManager.isScenePaused(scene2.id)).toBe(false);
      });

      it("should return false if scene is current (not paused)", () => {
        const scene = new MockScene("scene1");
        sceneManager.loadScene(scene);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene);
        sceneManager._clearPending();

        expect(sceneManager.isScenePaused(scene.id)).toBe(false);
      });

      it("should return true if scene is paused in stack", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");

        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        expect(sceneManager.isScenePaused(scene1.id)).toBe(true);
        expect(sceneManager.isScenePaused(scene2.id)).toBe(false);
      });

      it("should work with multiple stacked scenes", () => {
        const scenes = [
          new MockScene("scene1"),
          new MockScene("scene2"),
          new MockScene("scene3"),
        ];

        // Load first scene
        sceneManager.loadScene(scenes[0]);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[0]);
        sceneManager._clearPending();

        // Push remaining scenes
        for (let i = 1; i < scenes.length; i++) {
          sceneManager.pushScene(scenes[i]);
          sceneManager._setState(SceneState.Active);
          sceneManager._setCurrentScene(scenes[i]);
          sceneManager._clearPending();
        }

        // Check pause status
        expect(sceneManager.isScenePaused(scenes[0].id)).toBe(true);
        expect(sceneManager.isScenePaused(scenes[1].id)).toBe(true);
        expect(sceneManager.isScenePaused(scenes[2].id)).toBe(false); // Current
      });
    });

    describe("multiple rapid pushes", () => {
      it("should handle multiple pushes before each becomes active", () => {
        const scenes = Array.from({ length: 5 }, (_, i) =>
          new MockScene(`scene${i}`)
        );

        // Load first scene
        sceneManager.loadScene(scenes[0]);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[0]);
        sceneManager._clearPending();

        // Push multiple scenes
        for (let i = 1; i < scenes.length; i++) {
          sceneManager.pushScene(scenes[i]);
          sceneManager._setState(SceneState.Active);
          sceneManager._setCurrentScene(scenes[i]);
          sceneManager._clearPending();
        }

        // Verify final state
        expect(sceneManager.getCurrentScene()).toBe(scenes[4]);
        expect(sceneManager.getTotalSceneCount()).toBe(5);
        expect(sceneManager.getSceneStackDepth()).toBe(4);

        // Verify all scenes except current are paused
        for (let i = 0; i < 4; i++) {
          expect(sceneManager.isScenePaused(scenes[i].id)).toBe(true);
        }
        expect(sceneManager.isScenePaused(scenes[4].id)).toBe(false);
      });
    });

    describe("multiple rapid pops", () => {
      it("should handle multiple pops returning to base scene", () => {
        const scenes = Array.from({ length: 4 }, (_, i) =>
          new MockScene(`scene${i}`)
        );

        // Build stack
        sceneManager.loadScene(scenes[0]);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[0]);
        sceneManager._clearPending();

        for (let i = 1; i < scenes.length; i++) {
          sceneManager.pushScene(scenes[i]);
          sceneManager._setState(SceneState.Active);
          sceneManager._setCurrentScene(scenes[i]);
          sceneManager._clearPending();
        }

        expect(sceneManager.getTotalSceneCount()).toBe(4);

        // Pop all scenes except base
        sceneManager.popScene(); // Pop scene3
        expect(sceneManager.getCurrentScene()).toBe(scenes[2]);
        expect(sceneManager.getTotalSceneCount()).toBe(3);

        sceneManager.popScene(); // Pop scene2
        expect(sceneManager.getCurrentScene()).toBe(scenes[1]);
        expect(sceneManager.getTotalSceneCount()).toBe(2);

        sceneManager.popScene(); // Pop scene1
        expect(sceneManager.getCurrentScene()).toBe(scenes[0]);
        expect(sceneManager.getTotalSceneCount()).toBe(1);

        sceneManager.popScene(); // Pop scene0 (last scene)
        expect(sceneManager.getCurrentScene()).toBeNull();
        expect(sceneManager.getTotalSceneCount()).toBe(0);
      });

      it("should restore resume on each pop", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");
        const scene3 = new MockScene("scene3");

        // Build stack
        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        sceneManager.pushScene(scene3);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene3);
        sceneManager._clearPending();

        // Reset resume flags
        scene1.resumeCalled = false;
        scene2.resumeCalled = false;
        scene3.resumeCalled = false;

        // Pop scene3, should resume scene2
        sceneManager.popScene();
        expect(scene2.resumeCalled).toBe(true);
        expect(scene3.disposeCalled).toBe(true);
      });
    });

    describe("stack with load operations", () => {
      it("should handle load clearing stack", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");
        const scene3 = new MockScene("scene3");

        // Build stack with scene1, scene2
        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        expect(sceneManager.getTotalSceneCount()).toBe(2);

        // Load scene3 (should replace current, keep stack intact)
        sceneManager.loadScene(scene3);
        
        // After load is called, we're in Unloading state
        expect(sceneManager.getState()).toBe(SceneState.Unloading);
        expect(sceneManager.getPendingScene()).toBe(scene3);
        // Stack is still there until scene2 is disposed
      });

      it("should maintain stack during transitions", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");
        const scene3 = new MockScene("scene3");

        // Build initial stack
        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        // During push, stack should be updated
        const stackBeforePush = sceneManager.getSceneStack();
        expect(stackBeforePush).toContain(scene1);
      });
    });

    describe("pause/resume lifecycle", () => {
      it("should call pause when pushing a scene", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");

        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        scene1.pauseCalled = false; // Reset flag
        sceneManager.pushScene(scene2);

        expect(scene1.pauseCalled).toBe(true);
      });

      it("should call resume when popping a scene", () => {
        const scene1 = new MockScene("scene1");
        const scene2 = new MockScene("scene2");

        sceneManager.loadScene(scene1);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene1);
        sceneManager._clearPending();

        sceneManager.pushScene(scene2);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene2);
        sceneManager._clearPending();

        scene1.resumeCalled = false; // Reset flag
        sceneManager.popScene();

        expect(scene1.resumeCalled).toBe(true);
      });

      it("should properly sequence pause/resume with multiple stacks", () => {
        const scenes = [
          new MockScene("scene1"),
          new MockScene("scene2"),
          new MockScene("scene3"),
        ];

        // Load first
        sceneManager.loadScene(scenes[0]);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[0]);
        sceneManager._clearPending();

        // Push second
        sceneManager.pushScene(scenes[1]);
        expect(scenes[0].pauseCalled).toBe(true);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[1]);
        sceneManager._clearPending();

        // Push third
        sceneManager.pushScene(scenes[2]);
        expect(scenes[1].pauseCalled).toBe(true);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scenes[2]);
        sceneManager._clearPending();

        // Pop third
        sceneManager.popScene();
        expect(scenes[1].resumeCalled).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle popping with empty stack gracefully", () => {
        const scene = new MockScene("scene1");
        sceneManager.loadScene(scene);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene);
        sceneManager._clearPending();

        // Should not throw
        expect(() => {
          sceneManager.popScene();
        }).not.toThrow();

        expect(sceneManager.getCurrentScene()).toBeNull();
      });

      it("should handle queries with empty stack", () => {
        expect(sceneManager.getSceneStackDepth()).toBe(0);
        expect(sceneManager.getSceneStack()).toHaveLength(0);
        expect(sceneManager.getTotalSceneCount()).toBe(0);
      });

      it("should handle isScenePaused with non-existent scene", () => {
        const scene = new MockScene("scene1");
        sceneManager.loadScene(scene);
        sceneManager._setState(SceneState.Active);
        sceneManager._setCurrentScene(scene);
        sceneManager._clearPending();

        expect(sceneManager.isScenePaused("non-existent")).toBe(false);
      });

      it("should not throw when pushing with no current scene", () => {
        const scene = new MockScene("scene1");
        // Don't set up a current scene first
        expect(() => {
          sceneManager.pushScene(scene);
        }).not.toThrow();
      });
    });
  });
});
