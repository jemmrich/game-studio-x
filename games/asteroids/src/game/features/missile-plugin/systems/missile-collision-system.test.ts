import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { MissileComponent } from "../components/missile.ts";
import { MissileManager } from "../resources/missile-manager.ts";
import { MissileCollisionSystem } from "./missile-collision-system.ts";

describe("MissileCollisionSystem", () => {
  let world: World;
  let system: MissileCollisionSystem;
  let manager: MissileManager;
  const playerId = "player-1" as unknown as any;
  const aliensContainerId = "aliens-1" as unknown as any;

  beforeEach(() => {
    world = new World();
    manager = new MissileManager();
    world.addResource("MissileManager", manager);
    system = new MissileCollisionSystem();
    system.onAttach(world);
  });

  describe("initialization", () => {
    it("should attach and initialize without errors", () => {
      expect(() => {
        system.onAttach(world);
      }).not.toThrow();
    });

    it("should create a query for MissileComponent entities", () => {
      const missile = world.createEntity();
      world.add(missile, new MissileComponent(1.0, 100, playerId));

      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();
    });
  });

  describe("spawner validation", () => {
    it("should handle missiles whose spawner no longer exists", () => {
      const spawner = world.createEntity();
      const missile = world.createEntity();

      world.add(missile, new MissileComponent(1.0, 100, spawner));
      manager.addMissile(spawner, missile);

      // Destroy the spawner
      world.destroyEntity(spawner);

      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();

      // Missile should be cleaned up
      expect(world.entityExists(missile)).toBe(false);
      expect(manager.getMissileCount(spawner)).toBe(0);
    });

    it("should preserve missiles with valid spawners", () => {
      const spawner = world.createEntity();
      const missile = world.createEntity();

      world.add(missile, new MissileComponent(1.0, 100, spawner));
      manager.addMissile(spawner, missile);

      system.update(world, 0.016);

      // Missile should still exist
      expect(world.entityExists(missile)).toBe(true);
    });

    it("should handle multiple missiles from spawner that no longer exists", () => {
      const spawner = world.createEntity();
      const m1 = world.createEntity();
      const m2 = world.createEntity();
      const m3 = world.createEntity();

      world.add(m1, new MissileComponent(1.0, 100, spawner));
      world.add(m2, new MissileComponent(1.0, 100, spawner));
      world.add(m3, new MissileComponent(1.0, 100, spawner));

      manager.addMissile(spawner, m1);
      manager.addMissile(spawner, m2);
      manager.addMissile(spawner, m3);

      world.destroyEntity(spawner);

      system.update(world, 0.016);

      expect(world.entityExists(m1)).toBe(false);
      expect(world.entityExists(m2)).toBe(false);
      expect(world.entityExists(m3)).toBe(false);
      expect(manager.getMissileCount(spawner)).toBe(0);
    });
  });

  describe("system update", () => {
    it("should run update with no missiles", () => {
      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();
    });

    it("should run update with missing MissileManager", () => {
      const world2 = new World();
      const system2 = new MissileCollisionSystem();
      system2.onAttach(world2);

      const missile = world2.createEntity();
      world2.add(missile, new MissileComponent(1.0, 100, "spawner" as unknown as any));

      expect(() => {
        system2.update(world2, 0.016);
      }).toThrow();
    });

    it("should handle deltaTime parameter correctly", () => {
      const missile = world.createEntity();
      const spawner = world.createEntity();

      world.add(missile, new MissileComponent(1.0, 100, spawner));
      manager.addMissile(spawner, missile);

      expect(() => {
        system.update(world, 0.016); // 16ms
        system.update(world, 0.033); // 33ms
        system.update(world, 0.001); // 1ms
      }).not.toThrow();

      expect(world.entityExists(missile)).toBe(true);
    });
  });

  describe("missile preservation", () => {
    it("should preserve missiles with valid spawners during update", () => {
      const spawner = world.createEntity();
      const missiles = Array.from({ length: 10 }, () => {
        const m = world.createEntity();
        world.add(m, new MissileComponent(1.0, 100, spawner));
        manager.addMissile(spawner, m);
        return m;
      });

      system.update(world, 0.016);

      missiles.forEach((m) => {
        expect(world.entityExists(m)).toBe(true);
      });
    });

    it("should handle mixed valid and invalid spawners", () => {
      const validSpawner = world.createEntity();
      const invalidSpawner = world.createEntity();

      const m1 = world.createEntity();
      const m2 = world.createEntity();
      const m3 = world.createEntity();

      world.add(m1, new MissileComponent(1.0, 100, validSpawner));
      world.add(m2, new MissileComponent(1.0, 100, invalidSpawner));
      world.add(m3, new MissileComponent(1.0, 100, validSpawner));

      manager.addMissile(validSpawner, m1);
      manager.addMissile(invalidSpawner, m2);
      manager.addMissile(validSpawner, m3);

      world.destroyEntity(invalidSpawner);

      system.update(world, 0.016);

      expect(world.entityExists(m1)).toBe(true);
      expect(world.entityExists(m2)).toBe(false);
      expect(world.entityExists(m3)).toBe(true);

      expect(manager.getMissileCount(validSpawner)).toBe(2);
      expect(manager.getMissileCount(invalidSpawner)).toBe(0);
    });
  });

  describe("collision handler protection", () => {
    it("should provide onMissileCollision method (for subclass override)", () => {
      expect(typeof system["onMissileCollision"]).toBe("function");
    });

    it("should allow subclass to override collision behavior", () => {
      class TestMissileCollisionSystem extends MissileCollisionSystem {
        collisionsCalled: Array<{ missileId: any; targetId: any }> = [];

        protected onMissileCollision(world: World, missileId: any, targetId: any): void {
          this.collisionsCalled.push({ missileId, targetId });
        }
      }

      const testSystem = new TestMissileCollisionSystem();
      testSystem.onAttach(world);

      const spawner = world.createEntity();
      const missile = world.createEntity();
      const target = world.createEntity();

      world.add(missile, new MissileComponent(1.0, 100, spawner));
      manager.addMissile(spawner, missile);

      // Manually call the protected method (for testing subclass behavior)
      (testSystem as any).onMissileCollision(world, missile, target);

      expect(testSystem.collisionsCalled).toHaveLength(1);
      expect(testSystem.collisionsCalled[0]).toEqual({ missileId: missile, targetId: target });
    });
  });

  describe("scalability", () => {
    it("should handle large number of missiles efficiently", () => {
      const missileCount = 500;
      const spawner = world.createEntity();

      for (let i = 0; i < missileCount; i++) {
        const m = world.createEntity();
        world.add(m, new MissileComponent(1.0, 100, spawner));
        manager.addMissile(spawner, m);
      }

      const startTime = performance.now();
      system.update(world, 0.016);
      const endTime = performance.now();

      // Should complete efficiently (less than 50ms for 500 missiles)
      expect(endTime - startTime).toBeLessThan(50);
      expect(manager.getMissileCount(spawner)).toBe(missileCount);
    });

    it("should handle many different spawners", () => {
      const spawnerCount = 100;
      const missilesPerSpawner = 5;

      const spawners = Array.from({ length: spawnerCount }, () => world.createEntity());

      for (const spawner of spawners) {
        for (let i = 0; i < missilesPerSpawner; i++) {
          const m = world.createEntity();
          world.add(m, new MissileComponent(1.0, 100, spawner));
          manager.addMissile(spawner, m);
        }
      }

      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();

      for (const spawner of spawners) {
        expect(manager.getMissileCount(spawner)).toBe(missilesPerSpawner);
      }
    });
  });

  describe("state consistency", () => {
    it("should maintain manager state consistency", () => {
      const s1 = world.createEntity();
      const s2 = world.createEntity();

      const m1s1 = world.createEntity();
      const m2s1 = world.createEntity();
      const m1s2 = world.createEntity();

      world.add(m1s1, new MissileComponent(1.0, 100, s1));
      world.add(m2s1, new MissileComponent(1.0, 100, s1));
      world.add(m1s2, new MissileComponent(1.0, 100, s2));

      manager.addMissile(s1, m1s1);
      manager.addMissile(s1, m2s1);
      manager.addMissile(s2, m1s2);

      system.update(world, 0.016);

      expect(manager.getMissileCount(s1)).toBe(2);
      expect(manager.getMissileCount(s2)).toBe(1);

      // Destroy s2
      world.destroyEntity(s2);

      system.update(world, 0.016);

      expect(manager.getMissileCount(s1)).toBe(2);
      expect(manager.getMissileCount(s2)).toBe(0);
      expect(world.entityExists(m1s1)).toBe(true);
      expect(world.entityExists(m2s1)).toBe(true);
      expect(world.entityExists(m1s2)).toBe(false);
    });
  });

  describe("repeated updates", () => {
    it("should handle repeated updates without corruption", () => {
      const spawner = world.createEntity();
      const missiles = Array.from({ length: 5 }, () => {
        const m = world.createEntity();
        world.add(m, new MissileComponent(1.0, 100, spawner));
        manager.addMissile(spawner, m);
        return m;
      });

      // Run many updates in a row
      for (let i = 0; i < 100; i++) {
        system.update(world, 0.016);
      }

      // All missiles should still exist (spawner is valid)
      missiles.forEach((m) => {
        expect(world.entityExists(m)).toBe(true);
      });

      expect(manager.getMissileCount(spawner)).toBe(5);
    });

    it("should clean up spawner missiles on first update after destruction", () => {
      const spawner = world.createEntity();
      const m1 = world.createEntity();
      const m2 = world.createEntity();

      world.add(m1, new MissileComponent(1.0, 100, spawner));
      world.add(m2, new MissileComponent(1.0, 100, spawner));

      manager.addMissile(spawner, m1);
      manager.addMissile(spawner, m2);

      system.update(world, 0.016); // First update: healthy
      expect(manager.getMissileCount(spawner)).toBe(2);

      world.destroyEntity(spawner);

      system.update(world, 0.016); // Second update: spawner gone, cleanup
      expect(manager.getMissileCount(spawner)).toBe(0);
      expect(world.entityExists(m1)).toBe(false);
      expect(world.entityExists(m2)).toBe(false);
    });
  });
});
