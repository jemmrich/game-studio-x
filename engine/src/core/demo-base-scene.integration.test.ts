import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../core/world.ts";
import { DemoBaseScene } from "../core/demo-base-scene.ts";
import { DemoUIText } from "../components/demo-ui-text.ts";
import { Tag } from "../components/tag.ts";

// Test component
class GameEntity {
  constructor(public type: string = "default") {}
}

// Test demo scene
class TestDemoScene extends DemoBaseScene {
  demoEntitiesCreated = 0;

  constructor() {
    super("test-demo");
    this.demoDescription = "This is a test demo scene.";
    this.demoInstructions = ["Test - Test Control", "Demo - Demo Control"];
  }

  initDemo(world: World): void {
    // Create some demo entities (not UI)
    for (let i = 0; i < 3; i++) {
      const entity = this.createEntity(world);
      world.add(entity, new GameEntity(`entity-${i}`));
      this.demoEntitiesCreated++;
    }
  }
}

describe("DemoBaseScene Integration", () => {
  let world: World;
  let scene: TestDemoScene;

  beforeEach(() => {
    world = new World();
    scene = new TestDemoScene();
  });

  describe("UI setup", () => {
    it("should create UI entities on init", () => {
      expect(world.getAllEntities().length).toBe(0);

      scene.init(world);

      // Should have 3 demo entities + 2 UI entities (instructions + description)
      expect(world.getAllEntities().length).toBe(5);
    });

    it("should create instructions UI element", () => {
      scene.init(world);

      const entities = world.getAllEntities();
      let foundInstructions = false;

      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui && ui.config.position === "top-left" && ui.config.title === "Controls") {
          foundInstructions = true;
          expect(ui.config.lines).toEqual(scene.demoInstructions);
        }
      }

      expect(foundInstructions).toBe(true);
    });

    it("should create description UI element", () => {
      scene.init(world);

      const entities = world.getAllEntities();
      let foundDescription = false;

      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui && ui.config.position === "bottom-left" && ui.config.lines[0] === scene.demoDescription) {
          foundDescription = true;
        }
      }

      expect(foundDescription).toBe(true);
    });

    it("should apply default UI styling", () => {
      scene.init(world);

      const entities = world.getAllEntities();

      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui) {
          expect(ui.config.backgroundColor).toBe("rgba(0, 0, 0, 0.7)");
          expect(ui.config.padding).toBe(12);
          expect(ui.config.marginX).toBe(16);
          expect(ui.config.marginY).toBe(16);
        }
      }
    });
  });

  describe("reset preserves UI", () => {
    it("should preserve UI entities during reset", () => {
      scene.init(world);

      const entitiesBefore = world.getAllEntities().length;
      expect(entitiesBefore).toBe(5); // 3 demo + 2 UI

      scene.reset(world);

      const entitiesAfter = world.getAllEntities().length;
      expect(entitiesAfter).toBe(5); // Should be same: UI preserved, demo re-created

      // Verify UI still exists
      let uiCount = 0;
      const entities = world.getAllEntities();

      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui) {
          uiCount++;
        }
      }

      expect(uiCount).toBe(2); // Both UI elements preserved
    });

    it("should clear non-UI demo entities on reset", () => {
      scene.init(world);
      expect(scene.demoEntitiesCreated).toBe(3);

      scene.reset(world);
      expect(scene.demoEntitiesCreated).toBe(6); // Re-initialized

      // Verify UI was not re-created (only 5 entities total)
      expect(world.getAllEntities().length).toBe(5);
    });

    it("should distinguish UI entities from demo entities", () => {
      scene.init(world);

      let uiCount = 0;
      let demoCount = 0;

      const entities = world.getAllEntities();
      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui) {
          uiCount++;
        } else {
          const gameEntity = world.get(entity, GameEntity) as GameEntity | undefined;
          if (gameEntity) {
            demoCount++;
          }
        }
      }

      expect(uiCount).toBe(2);
      expect(demoCount).toBe(3);

      scene.reset(world);

      uiCount = 0;
      demoCount = 0;

      const entitiesAfter = world.getAllEntities();
      for (const entity of entitiesAfter) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui) {
          uiCount++;
        } else {
          const gameEntity = world.get(entity, GameEntity) as GameEntity | undefined;
          if (gameEntity) {
            demoCount++;
          }
        }
      }

      expect(uiCount).toBe(2); // UI preserved
      expect(demoCount).toBe(3); // Demo re-created
    });
  });

  describe("dispose", () => {
    it("should cleanup all entities including UI on dispose", () => {
      scene.init(world);
      expect(world.getAllEntities().length).toBe(5);

      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });
  });

  describe("custom descriptions and instructions", () => {
    it("should use custom description", () => {
      const customDescription = "Custom demo description";
      scene.demoDescription = customDescription;

      scene.init(world);

      let found = false;
      const entities = world.getAllEntities();
      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui && ui.config.position === "bottom-left") {
          expect(ui.config.lines[0]).toBe(customDescription);
          found = true;
        }
      }

      expect(found).toBe(true);
    });

    it("should use custom instructions", () => {
      const customInstructions = ["Custom - Custom Control", "Keys - Key Control"];
      scene.demoInstructions = customInstructions;

      scene.init(world);

      let found = false;
      const entities = world.getAllEntities();
      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui && ui.config.position === "top-left") {
          expect(ui.config.lines).toEqual(customInstructions);
          found = true;
        }
      }

      expect(found).toBe(true);
    });
  });

  describe("multiple resets", () => {
    it("should handle multiple resets without UI duplication", () => {
      scene.init(world);
      expect(world.getAllEntities().length).toBe(5);

      scene.reset(world);
      expect(world.getAllEntities().length).toBe(5);

      scene.reset(world);
      expect(world.getAllEntities().length).toBe(5);

      scene.reset(world);
      expect(world.getAllEntities().length).toBe(5);

      // Verify UI count is still 2
      let uiCount = 0;
      const entities = world.getAllEntities();
      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui) uiCount++;
      }

      expect(uiCount).toBe(2);
    });

    it("should track demo entity creation across resets", () => {
      scene.init(world);
      expect(scene.demoEntitiesCreated).toBe(3);

      scene.reset(world);
      expect(scene.demoEntitiesCreated).toBe(6);

      scene.reset(world);
      expect(scene.demoEntitiesCreated).toBe(9);
    });
  });

  describe("extension and customization", () => {
    it("should allow extending DemoBaseScene", () => {
      class CustomDemoScene extends DemoBaseScene {
        customProperty = "custom";

        constructor() {
          super("custom-demo");
        }

        initDemo(world: World): void {
          const e = this.createEntity(world);
          world.add(e, new GameEntity(this.customProperty));
        }
      }

      const customScene = new CustomDemoScene();
      customScene.init(world);

      expect(world.getAllEntities().length).toBe(3); // 1 demo + 2 UI

      const entities = world.getAllEntities();
      let found = false;
      for (const entity of entities) {
        const gameEntity = world.get(entity, GameEntity) as GameEntity | undefined;
        if (gameEntity?.type === "custom") {
          found = true;
        }
      }

      expect(found).toBe(true);
    });

    it("should override demoDescription per instance", () => {
      const scene1 = new TestDemoScene();
      scene1.demoDescription = "Scene 1 description";

      const scene2 = new TestDemoScene();
      scene2.demoDescription = "Scene 2 description";

      scene1.init(world);

      let found = false;
      const entities = world.getAllEntities();
      for (const entity of entities) {
        const ui = world.get(entity, DemoUIText) as DemoUIText | undefined;
        if (ui && ui.config.position === "bottom-left") {
          expect(ui.config.lines[0]).toBe("Scene 1 description");
          found = true;
        }
      }

      expect(found).toBe(true);
    });
  });
});
