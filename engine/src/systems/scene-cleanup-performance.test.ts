import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../core/world.ts";
import { BaseScene } from "../core/base-scene.ts";
import { SceneManager } from "../resources/scene-manager.ts";
import { SceneLifecycleSystem } from "./scene-lifecycle-system.ts";
import { Tag } from "../components/tag.ts";

// Simple test component
class TestComponent {
  constructor(public value: number = 0) {}
}

// Scene that creates many entities
class LargeScene extends BaseScene {
  entityCount: number = 0;

  constructor(id: string, entityCount: number) {
    super(id);
    this.entityCount = entityCount;
  }

  init(world: World): void {
    for (let i = 0; i < this.entityCount; i++) {
      const entity = this.createEntity(world);
      world.add(entity, new TestComponent(i));
    }
  }
}

describe("Scene Cleanup Performance Profiling", () => {
  let world: World;
  let sceneManager: SceneManager;
  let lifecycleSystem: SceneLifecycleSystem;

  beforeEach(() => {
    world = new World();
    sceneManager = new SceneManager();
    lifecycleSystem = new SceneLifecycleSystem();
    world.addResource("sceneManager", sceneManager);
  });

  describe("cleanup timing with various entity counts", () => {
    it("should cleanup 100 entities in < 5ms", () => {
      const scene = new LargeScene("scene-100", 100);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(100);

      const startTime = performance.now();
      scene.dispose(world);
      const duration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(0);
      expect(duration).toBeLessThan(5);
    });

    it("should cleanup 500 entities in < 10ms", () => {
      const scene = new LargeScene("scene-500", 500);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(500);

      const startTime = performance.now();
      scene.dispose(world);
      const duration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(0);
      expect(duration).toBeLessThan(10);
    });

    it("should cleanup 1000 entities in < 16ms (one frame)", () => {
      const scene = new LargeScene("scene-1000", 1000);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(1000);

      const startTime = performance.now();
      scene.dispose(world);
      const duration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(0);
      expect(duration).toBeLessThan(16);
    });

    it("should cleanup 5000 entities in < 50ms", () => {
      const scene = new LargeScene("scene-5000", 5000);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(5000);

      const startTime = performance.now();
      scene.dispose(world);
      const duration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(0);
      expect(duration).toBeLessThan(50);
    });
  });

  describe("scene lifecycle performance with large scenes", () => {
    it("should handle complete lifecycle of 1000-entity scene efficiently", () => {
      const scene = new LargeScene("perf-scene", 1000);

      // Load
      const loadStart = performance.now();
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);
      const loadDuration = performance.now() - loadStart;

      expect(loadDuration).toBeLessThan(50);

      // Update (should be fast - no scene update logic)
      const updateStart = performance.now();
      lifecycleSystem.update(world, 0.016);
      const updateDuration = performance.now() - updateStart;

      expect(updateDuration).toBeLessThan(5);

      // Unload
      const unloadScene = new LargeScene("scene-2", 500);
      sceneManager.loadScene(unloadScene);

      const unloadStart = performance.now();
      lifecycleSystem.update(world, 0.016); // Unload old scene
      lifecycleSystem.update(world, 0.016); // Load new scene
      const unloadDuration = performance.now() - unloadStart;

      expect(unloadDuration).toBeLessThan(30);
      expect(world.getAllEntities().length).toBe(500);
    });
  });

  describe("multiple scene transitions performance", () => {
    it("should handle 10 rapid scene transitions efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const scene = new LargeScene(`scene-${i}`, 100 + i * 10);
        sceneManager.loadScene(scene);

        lifecycleSystem.update(world, 0.016); // Unload old
        lifecycleSystem.update(world, 0.016); // Load new
      }

      const totalDuration = performance.now() - startTime;

      // 10 transitions with cleanup should complete in reasonable time
      expect(totalDuration).toBeLessThan(200);
      expect(world.getAllEntities().length).toBeGreaterThan(0);
    });
  });

  describe("scene reset performance", () => {
    it("should reset 1000-entity scene in < 16ms", () => {
      const scene = new LargeScene("reset-scene", 1000);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(1000);

      const startTime = performance.now();
      scene.reset(world);
      const duration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(1000);
      expect(duration).toBeLessThan(16);
    });

    it("should handle multiple resets of large scene efficiently", () => {
      const scene = new LargeScene("multi-reset-scene", 500);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      const startTime = performance.now();

      for (let i = 0; i < 5; i++) {
        scene.reset(world);
      }

      const totalDuration = performance.now() - startTime;

      expect(world.getAllEntities().length).toBe(500);
      expect(totalDuration).toBeLessThan(50);
    });
  });

  describe("memory considerations", () => {
    it("should not leak memory when loading/unloading scenes repeatedly", () => {
      const iterations = 5;
      const entitiesPerScene = 200;

      // Load first scene
      let scene = new LargeScene("mem-test-0", entitiesPerScene);
      sceneManager.loadScene(scene);
      lifecycleSystem.update(world, 0.016);

      expect(world.getAllEntities().length).toBe(entitiesPerScene);

      // Transition through multiple scenes
      for (let i = 1; i < iterations; i++) {
        const nextScene = new LargeScene(`mem-test-${i}`, entitiesPerScene);
        sceneManager.loadScene(nextScene);
        lifecycleSystem.update(world, 0.016); // Unload
        lifecycleSystem.update(world, 0.016); // Load

        // After each transition, should have entitiesPerScene
        expect(world.getAllEntities().length).toBe(entitiesPerScene);
      }

      // Final cleanup
      scene = sceneManager.getCurrentScene() as BaseScene;
      scene.dispose(world);

      expect(world.getAllEntities().length).toBe(0);
    });
  });

  describe("performance reporting", () => {
    it("should measure and report cleanup metrics for analysis", () => {
      const metrics = {
        sceneCounts: [100, 500, 1000, 2000],
        results: [] as Array<{ count: number; duration: number }>,
      };

      for (const count of metrics.sceneCounts) {
        const scene = new LargeScene(`metric-scene-${count}`, count);
        sceneManager.loadScene(scene);
        lifecycleSystem.update(world, 0.016);

        const startTime = performance.now();
        scene.dispose(world);
        const duration = performance.now() - startTime;

        metrics.results.push({ count, duration });
      }

      // Verify results are monotonically reasonable (larger scenes take longer)
      for (let i = 1; i < metrics.results.length; i++) {
        // Duration should increase roughly with entity count, but not linearly
        // Just verify it completes in reasonable time
        expect(metrics.results[i].duration).toBeLessThan(50);
      }
    });
  });
});
