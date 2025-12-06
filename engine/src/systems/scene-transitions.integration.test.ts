import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../core/world.ts";
import { BaseScene } from "../core/base-scene.ts";
import { SceneManager } from "../resources/scene-manager.ts";
import { SceneLifecycleSystem } from "./scene-lifecycle-system.ts";
import { Tag } from "../components/tag.ts";

// Test components
class Position {
  constructor(public x: number = 0, public y: number = 0) {}
}

class Health {
  constructor(public hp: number = 100) {}
}

// Test scenes
class SceneA extends BaseScene {
  entitiesCreated = 0;

  constructor() {
    super("scene-a");
  }

  init(world: World): void {
    for (let i = 0; i < 3; i++) {
      const e = this.createEntity(world);
      world.add(e, new Position(i, 0));
      this.entitiesCreated++;
    }
  }
}

class SceneB extends BaseScene {
  entitiesCreated = 0;

  constructor() {
    super("scene-b");
  }

  init(world: World): void {
    for (let i = 0; i < 2; i++) {
      const e = this.createEntity(world);
      world.add(e, new Health(50 + i * 10));
      this.entitiesCreated++;
    }
  }
}

class OverlayScene extends BaseScene {
  constructor(name: string) {
    super(name);
  }

  init(world: World): void {
    const e = this.createEntity(world);
    // Note: createEntity already adds a Tag with this.id
    // Don't overwrite it
  }
}

describe("Scene Integration Tests", () => {
  let world: World;
  let sceneManager: SceneManager;
  let lifecycleSystem: SceneLifecycleSystem;

  beforeEach(() => {
    world = new World();
    sceneManager = new SceneManager();
    lifecycleSystem = new SceneLifecycleSystem();

    world.addResource("sceneManager", sceneManager);
  });

  describe("scene transitions", () => {
    it("should transition from one scene to another", () => {
      const sceneA = new SceneA();
      const sceneB = new SceneB();

      // Load scene A
      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      expect(sceneManager.getCurrentScene()).toBe(sceneA);
      expect(sceneManager.getState().toString()).toBe("active");
      expect(world.getAllEntities().length).toBe(3);

      // Load scene B
      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016); // Process unloading
      lifecycleSystem.update(world, 0.016); // Process loading

      expect(sceneManager.getCurrentScene()).toBe(sceneB);
      expect(sceneManager.getState().toString()).toBe("active");
      expect(world.getAllEntities().length).toBe(2);

      // Scene A entities should be cleaned up
      const entities = world.getAllEntities();
      for (const entity of entities) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        expect(tag?.value).toBe("scene-b");
      }
    });

    it("should handle rapid scene transitions", () => {
      const sceneA = new SceneA();
      const sceneB = new SceneB();

      class SceneC extends BaseScene {
        constructor() {
          super("scene-c");
        }

        init(world: World): void {
          const e = this.createEntity(world);
          world.add(e, new Health(75));
        }
      }

      const sceneC = new SceneC();

      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);

      sceneManager.loadScene(sceneC);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);

      expect(sceneManager.getCurrentScene()).toBe(sceneC);
      expect(world.getAllEntities().length).toBe(1);
    });

    it("should cleanup only previous scene entities", () => {
      const sceneA = new SceneA();
      const sceneB = new SceneB();

      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      const aEntities = world.getAllEntities().length;
      expect(aEntities).toBe(3);

      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);

      const bEntities = world.getAllEntities();
      expect(bEntities.length).toBe(2);

      // All remaining entities should belong to scene B
      for (const entity of bEntities) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        expect(tag?.value).toBe("scene-b");
      }
    });

    it("should preserve external entities across transitions", () => {
      // Create an entity outside of any scene
      const externalEntity = world.createEntity();
      world.add(externalEntity, new Position(99, 99));

      const sceneA = new SceneA();
      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(4); // 3 from scene + 1 external

      const sceneB = new SceneB();
      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(3); // 2 from scene + 1 external
    });
  });

  describe("scene stack (push/pop)", () => {
    it("should push scene onto stack and pause previous", () => {
      const baseScene = new SceneA();
      const overlayScene = new OverlayScene("overlay");

      let basePauseCalled = false;
      baseScene.pause = () => {
        basePauseCalled = true;
      };

      sceneManager.loadScene(baseScene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(3);
      expect(sceneManager.getCurrentScene()).toBe(baseScene);

      sceneManager.pushScene(overlayScene);
      lifecycleSystem.update(world, 0.016);

      expect(basePauseCalled).toBe(true);
      expect(world.getAllEntities().length).toBe(4); // 3 from base + 1 from overlay
      expect(sceneManager.getCurrentScene()).toBe(overlayScene);
    });

    it("should pop scene and resume previous", () => {
      const baseScene = new SceneA();
      const overlayScene = new OverlayScene("overlay");

      let baseResumeCalled = false;
      baseScene.resume = () => {
        baseResumeCalled = true;
      };

      sceneManager.loadScene(baseScene);
      lifecycleSystem.update(world, 0.016);

      sceneManager.pushScene(overlayScene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(4);

      sceneManager.popScene(world);

      expect(baseResumeCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(baseScene);
      expect(world.getAllEntities().length).toBe(3); // Overlay cleaned up
    });

    it("should maintain stack of multiple scenes", () => {
      const scene1 = new SceneA();
      const scene2 = new OverlayScene("overlay-1");
      const scene3 = new OverlayScene("overlay-2");

      sceneManager.loadScene(scene1);
      lifecycleSystem.update(world, 0.016);

      sceneManager.pushScene(scene2);
      lifecycleSystem.update(world, 0.016);

      sceneManager.pushScene(scene3);
      lifecycleSystem.update(world, 0.016);

      expect(sceneManager.getCurrentScene()).toBe(scene3);

      sceneManager.popScene(world);
      expect(sceneManager.getCurrentScene()).toBe(scene2);

      sceneManager.popScene(world);
      expect(sceneManager.getCurrentScene()).toBe(scene1);
    });

    it("should cleanup popped scene entities", () => {
      const baseScene = new SceneA();
      const overlayScene = new OverlayScene("overlay");

      sceneManager.loadScene(baseScene);
      lifecycleSystem.update(world, 0.016);

      sceneManager.pushScene(overlayScene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(4);

      sceneManager.popScene(world);

      const remaining = world.getAllEntities();
      expect(remaining.length).toBe(3);

      // All remaining should be from base scene
      for (const entity of remaining) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        expect(tag?.value).toBe("scene-a");
      }
    });
  });

  describe("scene reset", () => {
    it("should reset scene to initial state", () => {
      const scene = new SceneA();

      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(3);
      expect(scene.entitiesCreated).toBe(3);

      // Reset in Active state
      sceneManager._setState("active" as any);
      sceneManager.resetCurrentScene(world);

      expect(scene.entitiesCreated).toBe(6); // Re-initialized
      expect(world.getAllEntities().length).toBe(3); // Cleaned + re-created
    });

    it("should not reset if scene is not active", () => {
      const scene = new SceneA();

      sceneManager.loadScene(scene);
      expect(scene.entitiesCreated).toBe(0);

      // Try to reset while loading (should not work)
      sceneManager.resetCurrentScene();

      expect(scene.entitiesCreated).toBe(0);
    });
  });

  describe("lifecycle hooks", () => {
    it("should call onSceneLoad hook", () => {
      const sceneA = new SceneA();
      let loadedScene: BaseScene | null = null;

      sceneManager.onSceneLoad((scene) => {
        loadedScene = scene;
      });

      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      expect(loadedScene).toBe(sceneA);
    });

    it("should call onSceneUnload hook", () => {
      const sceneA = new SceneA();
      const sceneB = new SceneB();
      let unloadedScene: BaseScene | null = null;

      sceneManager.onSceneUnload((scene) => {
        unloadedScene = scene;
      });

      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);

      expect(unloadedScene).toBe(sceneA);
    });

    it("should handle multiple lifecycle hooks", () => {
      const sceneA = new SceneA();
      const loadEvents: string[] = [];

      sceneManager.onSceneLoad(() => {
        loadEvents.push("load-1");
      });

      sceneManager.onSceneLoad(() => {
        loadEvents.push("load-2");
      });

      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);

      expect(loadEvents).toEqual(["load-1", "load-2"]);
    });
  });

  describe("full lifecycle integration", () => {
    it("should handle complete scene lifecycle", () => {
      const sceneA = new SceneA();
      const sceneB = new SceneB();

      // Load A
      sceneManager.loadScene(sceneA);
      lifecycleSystem.update(world, 0.016);
      expect(sceneManager.getCurrentScene()).toBe(sceneA);

      // Transition to B
      sceneManager.loadScene(sceneB);
      lifecycleSystem.update(world, 0.016);
      lifecycleSystem.update(world, 0.016);
      expect(sceneManager.getCurrentScene()).toBe(sceneB);

      // Reset B
      sceneManager._setState("active" as any);
      sceneManager.resetCurrentScene(world);
      expect(world.getAllEntities().length).toBe(2);

      // Pop (should not work as we didn't push)
      expect(() => sceneManager.popScene(world)).not.toThrow();
    });
  });
});
