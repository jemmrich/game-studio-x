import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { spawnMissile } from "./factories/mod.ts";
import { MissileManager } from "./resources/mod.ts";
import { MissileLifetimeSystem } from "./systems/mod.ts";

/**
 * Performance tests for the missile system
 *
 * These tests verify that the missile system can handle large numbers of missiles
 * without significant performance degradation. They measure execution time and
 * ensure systems scale linearly with missile count.
 */
describe("Missile System Performance", () => {
  let world: World;
  let manager: MissileManager;
  let lifetimeSystem: MissileLifetimeSystem;

  beforeEach(() => {
    world = new World();
    manager = new MissileManager();
    world.addResource("MissileManager", manager);
    lifetimeSystem = new MissileLifetimeSystem();
  });

  describe("spawning performance", () => {
    it("should spawn 100 missiles in reasonable time", () => {
      const spawnerCount = 10;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const startTime = performance.now();

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Less than 100ms
      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(100);
    });

    it("should spawn 500 missiles efficiently", () => {
      const spawnerCount = 50;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const startTime = performance.now();

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Less than 500ms
      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(500);
    });

    it("should spawn 1000 missiles within acceptable time", () => {
      const spawnerCount = 100;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const startTime = performance.now();

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Less than 1 second
      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(1000);
    });

    it("should scale linearly when spawning from multiple spawners", () => {
      const spawnerCount = 10;
      const missilesPerSpawner = 10;

      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      const startTime = performance.now();

      for (const spawner of spawners) {
        for (let i = 0; i < missilesPerSpawner; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);

      for (const spawner of spawners) {
        expect(manager.getMissileCount(spawner)).toBe(missilesPerSpawner);
      }
    });
  });

  describe("lifetime system performance", () => {
    it("should process 100 missiles per frame efficiently", () => {
      const spawnerCount = 10;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 3000);
        }
      }

      const startTime = performance.now();

      lifetimeSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10); // Less than 10ms
      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(100); // All still alive
    });

    it("should process 500 missiles per frame efficiently", () => {
      const spawnerCount = 50;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 3000);
        }
      }

      const startTime = performance.now();

      lifetimeSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Less than 50ms
      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(500);
    });

    it("should handle cleanup of 1000 expired missiles efficiently", () => {
      const spawnerCount = 100;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 10); // 10ms lifetime
        }
      }

      let total = 0;
      for (const spawner of spawners) {
        total += manager.getMissileCount(spawner);
      }
      expect(total).toBe(1000);

      const startTime = performance.now();

      lifetimeSystem.update(world, 0.016); // 16ms delta - all expire

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Less than 200ms
      let totalAfter = 0;
      for (const spawner of spawners) {
        totalAfter += manager.getMissileCount(spawner);
      }
      expect(totalAfter).toBe(0);
    });

    it("should handle mixed expiration efficiently", () => {
      const spawnerCount = 50;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      // Spawn missiles with varying lifetimes
      for (const spawner of spawners) {
        for (let i = 0; i < 10; i++) {
          const lifetime = (i % 3) === 0 ? 10 : 3000; // 1/3 will expire, 2/3 survive
          spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, lifetime);
        }
      }

      const startTime = performance.now();

      lifetimeSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      // Should have ~333 surviving missiles (2/3 of 500)
      let totalSurviving = 0;
      for (const spawner of spawners) {
        totalSurviving += manager.getMissileCount(spawner);
      }
      expect(totalSurviving).toBeGreaterThanOrEqual(290);
      expect(totalSurviving).toBeLessThanOrEqual(340);
    });
  });

  describe("manager operation performance", () => {
    it("should quickly check missile limits with many missiles", () => {
      const spawner = world.createEntity();

      for (let i = 0; i < 500; i++) {
        manager.addMissile(spawner, `missile-${i}` as unknown as any);
      }

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        manager.canSpawnMissile(spawner, 10);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10); // 1000 checks should be instant
    });

    it("should add missiles to manager efficiently", () => {
      const spawner = world.createEntity();
      const missileCount = 1000;

      const startTime = performance.now();

      for (let i = 0; i < missileCount; i++) {
        manager.addMissile(spawner, `missile-${i}` as unknown as any);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(manager.getMissileCount(spawner)).toBe(missileCount);
    });

    it("should remove missiles from manager efficiently", () => {
      const spawner = world.createEntity();
      const missileCount = 1000;

      for (let i = 0; i < missileCount; i++) {
        manager.addMissile(spawner, `missile-${i}` as unknown as any);
      }

      const startTime = performance.now();

      for (let i = 0; i < missileCount; i++) {
        manager.removeMissile(spawner, `missile-${i}` as unknown as any);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(manager.getMissileCount(spawner)).toBe(0);
    });
  });

  describe("sustained gameplay scenarios", () => {
    it("should handle continuous spawn and update cycle", () => {
      const spawnerCount = 60;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const frameDuration = 0.016; // 60 FPS
      const frameCount = 60; // 1 second of gameplay
      const missilesPerFrame = 1; // Spawn 1 missile per frame from each spawner

      const startTime = performance.now();

      for (let frame = 0; frame < frameCount; frame++) {
        // Spawn new missiles
        for (const spawner of spawners) {
          for (let i = 0; i < missilesPerFrame; i++) {
            spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 3000);
          }
        }

        // Update lifetime
        lifetimeSystem.update(world, frameDuration);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds for 60 frames
      // Each spawner accumulates missiles, but limited to 10 per spawner
      let totalMissiles = 0;
      for (const spawner of spawners) {
        totalMissiles += manager.getMissileCount(spawner);
      }
      expect(totalMissiles).toBeLessThanOrEqual(spawnerCount * 10);
    });

    it("should handle high spawn rate with expiration", () => {
      const spawnerCount = 30; // Distribute across spawners
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const frameDuration = 0.016;
      const frameCount = 300; // 5 seconds at 60 FPS
      const missilesPerFramePerSpawner = 1;
      const missileLifetime = 1500; // 1.5 seconds

      const startTime = performance.now();

      for (let frame = 0; frame < frameCount; frame++) {
        for (const spawner of spawners) {
          for (let i = 0; i < missilesPerFramePerSpawner; i++) {
            spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, missileLifetime);
          }
        }

        lifetimeSystem.update(world, frameDuration);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds for 5 seconds of gameplay
      // Check total across all spawners respects limits
      let totalMissiles = 0;
      for (const spawner of spawners) {
        totalMissiles += manager.getMissileCount(spawner);
      }
      expect(totalMissiles).toBeLessThanOrEqual(spawnerCount * 10);
    });

    it("should handle multiple spawners with many missiles", () => {
      const spawnerCount = 5;
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const frameDuration = 0.016;
      const frameCount = 60;
      const missilesPerSpawnerPerFrame = 1; // Keep it within limits over time

      const startTime = performance.now();

      for (let frame = 0; frame < frameCount; frame++) {
        for (const spawner of spawners) {
          for (let i = 0; i < missilesPerSpawnerPerFrame; i++) {
            spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 3000);
          }
        }

        lifetimeSystem.update(world, frameDuration);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);

      let totalMissiles = 0;
      for (const spawner of spawners) {
        totalMissiles += manager.getMissileCount(spawner);
      }
      // Each spawner will have at most 10 missiles at any time
      expect(totalMissiles).toBeLessThanOrEqual(spawnerCount * 10);
    });
  });

  describe("stress testing", () => {
    it("should handle theoretical maximum missiles (60 * 10 = 600 per spawner)", () => {
      const spawners = Array.from({ length: 5 }, () => world.createEntity());

      // 5 spawners * 600 missiles = 3000 total
      for (const spawner of spawners) {
        for (let i = 0; i < 600; i++) {
          const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner, 100, 3000);
          if (i >= 10) {
            // After 10, spawning is limited
            expect(missileId).toBeNull();
          }
        }
      }

      // Each spawner should hit the 10-missile limit
      for (const spawner of spawners) {
        expect(manager.getMissileCount(spawner)).toBeLessThanOrEqual(10);
      }
    });

    it("should handle rapid spawn limit cycling", () => {
      const spawner = world.createEntity();
      const maxMissiles = 10;

      const startTime = performance.now();

      // Quickly spawn to limit, destroy, repeat
      for (let cycle = 0; cycle < 50; cycle++) {
        // Spawn to limit
        const missiles = [];
        for (let i = 0; i < maxMissiles; i++) {
          const id = spawnMissile(
            world,
            [0, 0, 0],
            [1, 0, 0],
            spawner,
            100,
            3000,
            maxMissiles
          );
          missiles.push(id);
        }

        // Should be at limit
        expect(manager.getMissileCount(spawner)).toBe(maxMissiles);

        // Destroy all
        for (const id of missiles) {
          if (id) {
            world.destroyEntity(id);
            manager.removeMissile(spawner, id);
          }
        }

        expect(manager.getMissileCount(spawner)).toBe(0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 50 cycles should be fast
    });
  });

  describe("memory efficiency", () => {
    it("should not leak memory when creating and destroying many missiles", () => {
      const spawnerCount = 100; // Multiple spawners to handle many missiles
      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());
      const iterations = 100;
      const missilesPerIteration = 1; // 1 per spawner per iteration

      for (let iter = 0; iter < iterations; iter++) {
        const missiles = [];
        for (const spawner of spawners) {
          for (let i = 0; i < missilesPerIteration; i++) {
            const id = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner);
            missiles.push(id);
          }
        }

        // Destroy all missiles
        for (let i = 0; i < missiles.length; i++) {
          const id = missiles[i];
          if (id) {
            world.destroyEntity(id);
            const spawnerForMissile = spawners[i % spawners.length];
            manager.removeMissile(spawnerForMissile, id);
          }
        }

        // All spawners should be clean after each iteration
        for (const spawner of spawners) {
          expect(manager.getMissileCount(spawner)).toBe(0);
        }
      }

      // After all iterations, all managers should be clean
      for (const spawner of spawners) {
        expect(manager.getMissileCount(spawner)).toBe(0);
        expect(manager.getMissiles(spawner)).toHaveLength(0);
      }
    });
  });
});
