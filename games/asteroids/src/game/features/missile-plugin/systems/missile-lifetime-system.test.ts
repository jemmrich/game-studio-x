import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { MissileComponent } from "../components/missile.ts";
import { MissileManager } from "../resources/missile-manager.ts";
import { MissileLifetimeSystem } from "./missile-lifetime-system.ts";

describe("MissileLifetimeSystem", () => {
  let world: World;
  let system: MissileLifetimeSystem;
  let manager: MissileManager;
  const spawnerId = "spawner-1" as unknown as any;

  beforeEach(() => {
    world = new World();
    manager = new MissileManager();
    world.addResource("MissileManager", manager);
    system = new MissileLifetimeSystem();
  });

  describe("lifetime decrement", () => {
    it("should decrement missile lifetime each frame", () => {
      const missile1 = world.createEntity();
      const missileComponent = new MissileComponent(3.0, 100, spawnerId);
      world.add(missile1, missileComponent);
      manager.addMissile(spawnerId, missile1);

      const deltaTime = 0.016; // 16ms
      system.update(world, deltaTime);

      const updated = world.get(missile1, MissileComponent);
      expect(updated?.lifetime).toBeCloseTo(3.0 - deltaTime, 5);
    });

    it("should decrement multiple missiles independently", () => {
      const missile1 = world.createEntity();
      const missile2 = world.createEntity();

      const comp1 = new MissileComponent(2.0, 100, spawnerId);
      const comp2 = new MissileComponent(1.5, 100, spawnerId);

      world.add(missile1, comp1);
      world.add(missile2, comp2);
      manager.addMissile(spawnerId, missile1);
      manager.addMissile(spawnerId, missile2);

      system.update(world, 0.016);

      const updated1 = world.get(missile1, MissileComponent);
      const updated2 = world.get(missile2, MissileComponent);

      expect(updated1?.lifetime).toBeCloseTo(2.0 - 0.016, 5);
      expect(updated2?.lifetime).toBeCloseTo(1.5 - 0.016, 5);
    });

    it("should accumulate lifetime decrements over multiple frames", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(1.0, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 0.016);
      system.update(world, 0.016);
      system.update(world, 0.016);

      const updated = world.get(missile, MissileComponent);
      expect(updated?.lifetime).toBeCloseTo(1.0 - 0.016 * 3, 5);
    });
  });

  describe("lifetime expiration and cleanup", () => {
    it("should destroy missile when lifetime reaches zero", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(0.01, 100, spawnerId); // Very short lifetime
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 0.016); // deltaTime > lifetime

      expect(world.entityExists(missile)).toBe(false);
    });

    it("should destroy missile when lifetime goes negative", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(0.005, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 0.016); // Very large deltaTime

      expect(world.entityExists(missile)).toBe(false);
    });

    it("should remove missile from MissileManager on expiration", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(0.01, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      expect(manager.getMissileCount(spawnerId)).toBe(1);

      system.update(world, 0.016);

      expect(manager.getMissileCount(spawnerId)).toBe(0);
      expect(manager.getMissiles(spawnerId)).not.toContain(missile);
    });

    it("should not destroy missile before lifetime expires", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(1.0, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 0.016); // Small deltaTime

      expect(world.entityExists(missile)).toBe(true);
      const updated = world.get(missile, MissileComponent);
      expect(updated?.lifetime).toBeGreaterThan(0);
    });

    it("should handle destroying multiple missiles in one update", () => {
      const missile1 = world.createEntity();
      const missile2 = world.createEntity();
      const missile3 = world.createEntity();

      world.add(missile1, new MissileComponent(0.01, 100, spawnerId));
      world.add(missile2, new MissileComponent(0.01, 100, spawnerId));
      world.add(missile3, new MissileComponent(0.01, 100, spawnerId));

      manager.addMissile(spawnerId, missile1);
      manager.addMissile(spawnerId, missile2);
      manager.addMissile(spawnerId, missile3);

      expect(manager.getMissileCount(spawnerId)).toBe(3);

      system.update(world, 0.016);

      expect(manager.getMissileCount(spawnerId)).toBe(0);
      expect(world.entityExists(missile1)).toBe(false);
      expect(world.entityExists(missile2)).toBe(false);
      expect(world.entityExists(missile3)).toBe(false);
    });

    it("should handle mixed lifetime missiles (some expire, some survive)", () => {
      const expiredMissile = world.createEntity();
      const survivingMissile = world.createEntity();

      world.add(expiredMissile, new MissileComponent(0.01, 100, spawnerId));
      world.add(survivingMissile, new MissileComponent(1.0, 100, spawnerId));

      manager.addMissile(spawnerId, expiredMissile);
      manager.addMissile(spawnerId, survivingMissile);

      system.update(world, 0.016);

      expect(world.entityExists(expiredMissile)).toBe(false);
      expect(world.entityExists(survivingMissile)).toBe(true);
      expect(manager.getMissileCount(spawnerId)).toBe(1);
      expect(manager.getMissiles(spawnerId)).toContain(survivingMissile);
    });
  });

  describe("multiple spawners", () => {
    it("should track missiles from different spawners independently", () => {
      const spawner1 = "spawner-1" as unknown as any;
      const spawner2 = "spawner-2" as unknown as any;

      const missile1 = world.createEntity();
      const missile2 = world.createEntity();

      world.add(missile1, new MissileComponent(0.01, 100, spawner1));
      world.add(missile2, new MissileComponent(1.0, 100, spawner2));

      manager.addMissile(spawner1, missile1);
      manager.addMissile(spawner2, missile2);

      system.update(world, 0.016);

      expect(world.entityExists(missile1)).toBe(false);
      expect(world.entityExists(missile2)).toBe(true);
      expect(manager.getMissileCount(spawner1)).toBe(0);
      expect(manager.getMissileCount(spawner2)).toBe(1);
    });

    it("should handle cleanup for multiple spawners", () => {
      const spawner1 = "spawner-1" as unknown as any;
      const spawner2 = "spawner-2" as unknown as any;

      const m1s1 = world.createEntity();
      const m2s1 = world.createEntity();
      const m1s2 = world.createEntity();

      world.add(m1s1, new MissileComponent(0.01, 100, spawner1));
      world.add(m2s1, new MissileComponent(1.0, 100, spawner1));
      world.add(m1s2, new MissileComponent(0.01, 100, spawner2));

      manager.addMissile(spawner1, m1s1);
      manager.addMissile(spawner1, m2s1);
      manager.addMissile(spawner2, m1s2);

      system.update(world, 0.016);

      expect(manager.getMissileCount(spawner1)).toBe(1); // m2s1 survives
      expect(manager.getMissileCount(spawner2)).toBe(0); // m1s2 destroyed
      expect(manager.getMissiles(spawner1)).toEqual([m2s1]);
    });
  });

  describe("edge cases", () => {
    it("should handle update with no missiles gracefully", () => {
      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();
    });

    it("should handle update when MissileManager is missing", () => {
      const world2 = new World();
      const missile = world2.createEntity();
      world2.add(missile, new MissileComponent(1.0, 100, spawnerId));

      // No MissileManager added
      expect(() => {
        system.update(world2, 0.016);
      }).toThrow();
    });

    it("should handle missiles with zero initial lifetime", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(0, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 0);

      expect(world.entityExists(missile)).toBe(false);
    });

    it("should handle very large deltaTime values", () => {
      const missile = world.createEntity();
      const comp = new MissileComponent(1.0, 100, spawnerId);
      world.add(missile, comp);
      manager.addMissile(spawnerId, missile);

      system.update(world, 100.0); // Very large delta

      expect(world.entityExists(missile)).toBe(false);
    });

    it("should handle many missiles efficiently", () => {
      const missileCount = 1000;
      const missiles: any[] = [];

      for (let i = 0; i < missileCount; i++) {
        const m = world.createEntity();
        world.add(m, new MissileComponent(0.01, 100, spawnerId));
        manager.addMissile(spawnerId, m);
        missiles.push(m);
      }

      expect(manager.getMissileCount(spawnerId)).toBe(missileCount);

      const startTime = performance.now();
      system.update(world, 0.016);
      const endTime = performance.now();

      expect(manager.getMissileCount(spawnerId)).toBe(0);
      // Should complete in reasonable time (less than 100ms for 1000 missiles)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("iteration safety", () => {
    it("should safely remove missiles during iteration", () => {
      const missiles = Array.from({ length: 5 }, () => {
        const m = world.createEntity();
        world.add(m, new MissileComponent(0.01, 100, spawnerId));
        manager.addMissile(spawnerId, m);
        return m;
      });

      expect(() => {
        system.update(world, 0.016);
      }).not.toThrow();

      for (const missileId of missiles) {
        expect(world.entityExists(missileId)).toBe(false);
      }
    });

    it("should handle adding missiles after some are destroyed", () => {
      const m1 = world.createEntity();
      const m2 = world.createEntity();

      world.add(m1, new MissileComponent(0.01, 100, spawnerId));
      world.add(m2, new MissileComponent(1.0, 100, spawnerId));

      manager.addMissile(spawnerId, m1);
      manager.addMissile(spawnerId, m2);

      system.update(world, 0.016);

      // m1 is destroyed, m2 survives
      expect(world.entityExists(m1)).toBe(false);
      expect(world.entityExists(m2)).toBe(true);

      // Add new missile after update
      const m3 = world.createEntity();
      world.add(m3, new MissileComponent(1.0, 100, spawnerId));
      manager.addMissile(spawnerId, m3);

      expect(manager.getMissileCount(spawnerId)).toBe(2); // m2 and m3
    });
  });
});
