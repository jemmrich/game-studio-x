import { describe, it, expect, beforeEach } from "vitest";
import { World } from "./world.ts";
import { BaseScene } from "./base-scene.ts";
import { Tag } from "../components/tag.ts";

// Test components
class Position {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}

class Health {
  constructor(public hp: number = 100) {}
}

class TestScene extends BaseScene {
  init(world: World): void {
    // Default: no entities
  }
}

describe("Entity Cleanup", () => {
  let world: World;
  let scene: TestScene;

  beforeEach(() => {
    world = new World();
    scene = new TestScene("cleanup-test");
  });

  describe("single scene cleanup", () => {
    it("should cleanup all entities when scene disposes", () => {
      const e1 = scene.createEntity(world);
      const e2 = scene.createEntity(world);
      const e3 = scene.createEntity(world);

      world.add(e1, new Position(1, 2, 3));
      world.add(e2, new Position(4, 5, 6));
      world.add(e3, new Health(50));

      expect(world.getAllEntities().length).toBe(3);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });

    it("should cleanup entities with multiple components", () => {
      const entity = scene.createEntity(world);
      world.add(entity, new Position());
      world.add(entity, new Health());
      world.add(entity, new Tag(scene.id));

      expect(world.getAllEntities().length).toBe(1);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });

    it("should preserve untagged entities", () => {
      const sceneEntity = scene.createEntity(world);
      const untaggedEntity = world.createEntity();

      world.add(sceneEntity, new Position());
      world.add(untaggedEntity, new Health());

      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(1);
      const remaining = world.getAllEntities()[0];
      expect(world.has(remaining, Health)).toBe(true);
    });
  });

  describe("multiple scene cleanup", () => {
    it("should cleanup only entities from disposed scene", () => {
      const scene1 = new TestScene("scene-1");
      const scene2 = new TestScene("scene-2");

      const scene1E1 = scene1.createEntity(world);
      const scene1E2 = scene1.createEntity(world);
      const scene2E1 = scene2.createEntity(world);
      const scene2E2 = scene2.createEntity(world);

      expect(world.getAllEntities().length).toBe(4);

      scene1.dispose(world);

      expect(world.getAllEntities().length).toBe(2);

      const remaining = world.getAllEntities();
      for (const entity of remaining) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        expect(tag?.value).toBe("scene-2");
      }
    });

    it("should cleanup in correct order", () => {
      const scene1 = new TestScene("scene-1");
      const scene2 = new TestScene("scene-2");
      const scene3 = new TestScene("scene-3");

      scene1.createEntity(world);
      scene2.createEntity(world);
      scene3.createEntity(world);

      expect(world.getAllEntities().length).toBe(3);

      scene2.dispose(world);
      expect(world.getAllEntities().length).toBe(2);

      scene1.dispose(world);
      expect(world.getAllEntities().length).toBe(1);

      scene3.dispose(world);
      expect(world.getAllEntities().length).toBe(0);
    });
  });

  describe("cleanup with components", () => {
    it("should cleanup entities with various component types", () => {
      const e1 = scene.createEntity(world);
      const e2 = scene.createEntity(world);

      world.add(e1, new Position(1, 2, 3));
      world.add(e1, new Health(75));

      world.add(e2, new Health(100));
      world.add(e2, new Position());

      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });

    it("should preserve entities with non-scene tags", () => {
      const sceneEntity = scene.createEntity(world);
      const otherTaggedEntity = world.createEntity();
      world.add(otherTaggedEntity, new Tag("other-tag"));

      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(1);
      const remaining = world.getAllEntities()[0];
      const tag = world.get(remaining, Tag) as Tag | undefined;
      expect(tag?.value).toBe("other-tag");
    });
  });

  describe("cleanup during reset", () => {
    it("should cleanup all entities during reset", () => {
      const resetScene = new (class extends BaseScene {
        entityCount = 0;

        init(world: World): void {
          this.entityCount++;
          const e = this.createEntity(world);
          world.add(e, new Position());
        }
      })("reset-test");

      resetScene.init(world);
      expect(world.getAllEntities().length).toBe(1);
      expect(resetScene.entityCount).toBe(1);

      resetScene.reset(world);
      expect(world.getAllEntities().length).toBe(1);
      expect(resetScene.entityCount).toBe(2);
    });

    it("should not persist entities across reset", () => {
      const e1 = scene.createEntity(world);
      world.add(e1, new Position(1, 2, 3));

      const e2 = scene.createEntity(world);
      world.add(e2, new Health(50));

      expect(world.getAllEntities().length).toBe(2);

      scene.reset(world);

      // Should still be 0 since TestScene.init() doesn't create entities
      expect(world.getAllEntities().length).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle cleanup of empty scene", () => {
      expect(world.getAllEntities().length).toBe(0);
      scene.dispose(world);
      expect(world.getAllEntities().length).toBe(0);
    });

    it("should handle multiple disposes gracefully", () => {
      const e1 = scene.createEntity(world);

      scene.dispose(world);
      expect(world.getAllEntities().length).toBe(0);

      // Second dispose should not throw
      expect(() => scene.dispose(world)).not.toThrow();
      expect(world.getAllEntities().length).toBe(0);
    });

    it("should handle cleanup with same tag value created outside scene", () => {
      const sceneEntity = scene.createEntity(world);
      // Manually create entity with same tag (should not happen in practice)
      const manualEntity = world.createEntity();
      world.add(manualEntity, new Tag(scene.id));

      expect(world.getAllEntities().length).toBe(2);

      // Both should be cleaned up since they have the same tag
      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });

    it("should handle large number of entities", () => {
      const entityCount = 100;
      const entities = [];

      for (let i = 0; i < entityCount; i++) {
        const e = scene.createEntity(world);
        world.add(e, new Position(i, i, i));
        entities.push(e);
      }

      expect(world.getAllEntities().length).toBe(entityCount);

      const startTime = performance.now();
      scene.dispose(world);
      const cleanupTime = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(0);
      // Should cleanup 100 entities reasonably fast (< 10ms)
      expect(cleanupTime).toBeLessThan(10);
    });
  });

  describe("cleanup integration with pause/resume", () => {
    it("should preserve entities through pause/resume", () => {
      const e1 = scene.createEntity(world);
      world.add(e1, new Position());

      scene.pause(world);
      expect(world.getAllEntities().length).toBe(1);

      scene.resume(world);
      expect(world.getAllEntities().length).toBe(1);
    });

    it("should only cleanup on dispose, not pause", () => {
      const e1 = scene.createEntity(world);
      const e2 = scene.createEntity(world);

      scene.pause(world);
      expect(world.getAllEntities().length).toBe(2);

      scene.resume(world);
      expect(world.getAllEntities().length).toBe(2);

      scene.dispose(world);
      expect(world.getAllEntities().length).toBe(0);
    });
  });
});
