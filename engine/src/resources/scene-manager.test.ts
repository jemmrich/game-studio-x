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
      sceneManager._setState(SceneState.Paused);

      expect(sceneManager.getState()).toBe(SceneState.Paused);
    });

    it("should support Unloading state", () => {
      const scene = new MockScene("test");
      sceneManager.loadScene(scene);
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
});
