import { describe, it, expect, beforeEach } from "vitest";
import { BaseScene } from "./base-scene.ts";
import { World } from "./world.ts";
import { Tag } from "../components/tag.ts";

// Concrete implementation for testing
class TestScene extends BaseScene {
  initCalled = false;

  init(world: World): void {
    this.initCalled = true;
  }
}

describe("BaseScene", () => {
  let scene: TestScene;
  let world: World;

  beforeEach(() => {
    scene = new TestScene("test-scene");
    world = new World();
  });

  describe("initialization", () => {
    it("should have unique id", () => {
      expect(scene.id).toBe("test-scene");
    });

    it("should have different ids for different instances", () => {
      const scene2 = new TestScene("test-scene-2");
      expect(scene.id).not.toBe(scene2.id);
    });
  });

  describe("lifecycle methods", () => {
    it("should call init when overridden", () => {
      scene.init(world);
      expect(scene.initCalled).toBe(true);
    });

    it("create() should not throw", () => {
      expect(() => scene.create()).not.toThrow();
    });

    it("pause() should not throw", () => {
      expect(() => scene.pause(world)).not.toThrow();
    });

    it("resume() should not throw", () => {
      expect(() => scene.resume(world)).not.toThrow();
    });

    it("update() should not throw", () => {
      expect(() => scene.update(world, 0.016)).not.toThrow();
    });

    it("dispose() should call cleanup", () => {
      // Add a tagged entity
      const entity = scene.createEntity(world);
      expect(world.getAllEntities().length).toBe(1);

      // Dispose should cleanup
      scene.dispose(world);
      expect(world.getAllEntities().length).toBe(0);
    });
  });

  describe("createEntity helper", () => {
    it("should create entity tagged with scene id", () => {
      const entity = scene.createEntity(world);

      const tag = world.get(entity, Tag) as Tag | undefined;
      expect(tag).toBeDefined();
      expect(tag?.value).toBe(scene.id);
    });

    it("should create multiple entities", () => {
      const entity1 = scene.createEntity(world);
      const entity2 = scene.createEntity(world);

      expect(world.getAllEntities().length).toBe(2);
    });

    it("all created entities should have scene id tag", () => {
      const entity1 = scene.createEntity(world);
      const entity2 = scene.createEntity(world);
      const entity3 = scene.createEntity(world);

      const allEntities = world.getAllEntities();
      for (const entity of allEntities) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        expect(tag?.value).toBe(scene.id);
      }
    });
  });

  describe("cleanup", () => {
    it("should remove all scene-owned entities", () => {
      const entity1 = scene.createEntity(world);
      const entity2 = scene.createEntity(world);
      const entity3 = scene.createEntity(world);

      expect(world.getAllEntities().length).toBe(3);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });

    it("should not remove entities from other scenes", () => {
      const scene2 = new TestScene("scene-2");

      const entity1 = scene.createEntity(world);
      const entity2 = scene2.createEntity(world);

      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);

      // Only scene's entity should be removed
      expect(world.getAllEntities().length).toBe(1);

      const remainingEntity = world.getAllEntities()[0];
      const tag = world.get(remainingEntity, Tag) as Tag | undefined;
      expect(tag?.value).toBe("scene-2");
    });

    it("should not remove untagged entities", () => {
      const taggedEntity = scene.createEntity(world);
      const untaggedEntity = world.createEntity();

      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);

      // Untagged entity should remain
      expect(world.getAllEntities().length).toBe(1);
      expect(world.getAllEntities()[0]).toBe(untaggedEntity);
    });
  });

  describe("reset", () => {
    it("should call cleanup and re-init", () => {
      const entity1 = scene.createEntity(world);
      const entity2 = scene.createEntity(world);

      expect(world.getAllEntities().length).toBe(2);
      expect(scene.initCalled).toBe(false);

      scene.reset(world);

      // Entities should be cleaned up and re-initialized
      expect(scene.initCalled).toBe(true);
    });

    it("should remove all entities before re-init", () => {
      // Track if init is called with clean world
      let initWorldSize = -1;
      const testScene = new (class extends BaseScene {
        init(world: World): void {
          initWorldSize = world.getAllEntities().length;
        }
      })("test");

      testScene.createEntity(world); // Setup initial entity
      testScene.reset(world);

      // init should have been called with empty world
      expect(initWorldSize).toBe(0);
    });
  });

  describe("integration: full lifecycle", () => {
    it("should handle full lifecycle: create -> init -> reset -> dispose", () => {
      let initCount = 0;

      const lifecycleScene = new (class extends BaseScene {
        init(world: World): void {
          initCount++;
          this.createEntity(world);
        }
      })("lifecycle-test");

      lifecycleScene.create();

      lifecycleScene.init(world);
      expect(initCount).toBe(1);
      expect(world.getAllEntities().length).toBe(1);

      lifecycleScene.reset(world);
      expect(initCount).toBe(2);
      expect(world.getAllEntities().length).toBe(1);

      lifecycleScene.dispose(world);
      expect(world.getAllEntities().length).toBe(0);
    });

    it("should support pause and resume", () => {
      let pauseCount = 0;
      let resumeCount = 0;

      const pausableScene = new (class extends BaseScene {
        init(world: World): void {
          this.createEntity(world);
        }

        pause(world: World): void {
          pauseCount++;
        }

        resume(world: World): void {
          resumeCount++;
        }
      })("pausable-test");

      pausableScene.init(world);
      expect(world.getAllEntities().length).toBe(1);

      pausableScene.pause(world);
      expect(pauseCount).toBe(1);

      pausableScene.resume(world);
      expect(resumeCount).toBe(1);

      // Entities should persist through pause/resume
      expect(world.getAllEntities().length).toBe(1);
    });
  });
});

