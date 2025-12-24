import { describe, it, expect, beforeEach } from "vitest";
import { MissileManager } from "./missile-manager.ts";

describe("MissileManager", () => {
  let manager: MissileManager;
  const spawnerId1 = "spawner-1" as unknown as any;
  const spawnerId2 = "spawner-2" as unknown as any;
  const missileId1 = "missile-1" as unknown as any;
  const missileId2 = "missile-2" as unknown as any;
  const missileId3 = "missile-3" as unknown as any;

  beforeEach(() => {
    manager = new MissileManager();
  });

  describe("addMissile", () => {
    it("should add a missile for a new spawner", () => {
      manager.addMissile(spawnerId1, missileId1);
      expect(manager.getMissileCount(spawnerId1)).toBe(1);
      expect(manager.getMissiles(spawnerId1)).toContain(missileId1);
    });

    it("should add multiple missiles for the same spawner", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);
      manager.addMissile(spawnerId1, missileId3);

      expect(manager.getMissileCount(spawnerId1)).toBe(3);
      expect(manager.getMissiles(spawnerId1)).toEqual([missileId1, missileId2, missileId3]);
    });

    it("should track missiles for multiple spawners independently", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);
      manager.addMissile(spawnerId2, missileId3);

      expect(manager.getMissileCount(spawnerId1)).toBe(2);
      expect(manager.getMissileCount(spawnerId2)).toBe(1);
      expect(manager.getMissiles(spawnerId1)).toContain(missileId1);
      expect(manager.getMissiles(spawnerId1)).toContain(missileId2);
      expect(manager.getMissiles(spawnerId2)).toContain(missileId3);
    });

    it("should maintain order of added missiles", () => {
      const missiles = [missileId1, missileId2, missileId3];
      missiles.forEach((id) => manager.addMissile(spawnerId1, id));

      expect(manager.getMissiles(spawnerId1)).toEqual(missiles);
    });
  });

  describe("removeMissile", () => {
    it("should remove a missile from a spawner", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);

      manager.removeMissile(spawnerId1, missileId1);

      expect(manager.getMissileCount(spawnerId1)).toBe(1);
      expect(manager.getMissiles(spawnerId1)).toEqual([missileId2]);
    });

    it("should remove spawner entry when last missile is removed", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.removeMissile(spawnerId1, missileId1);

      expect(manager.getMissileCount(spawnerId1)).toBe(0);
      expect(manager.getMissiles(spawnerId1)).toEqual([]);
    });

    it("should not affect other spawners when removing a missile", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId2, missileId2);

      manager.removeMissile(spawnerId1, missileId1);

      expect(manager.getMissileCount(spawnerId1)).toBe(0);
      expect(manager.getMissileCount(spawnerId2)).toBe(1);
      expect(manager.getMissiles(spawnerId2)).toContain(missileId2);
    });

    it("should handle removing non-existent missile gracefully", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.removeMissile(spawnerId1, missileId2); // Remove non-existent

      expect(manager.getMissileCount(spawnerId1)).toBe(1);
      expect(manager.getMissiles(spawnerId1)).toContain(missileId1);
    });

    it("should handle removing from non-existent spawner gracefully", () => {
      expect(() => {
        manager.removeMissile(spawnerId1, missileId1);
      }).not.toThrow();
      expect(manager.getMissileCount(spawnerId1)).toBe(0);
    });

    it("should handle removing multiple missiles in sequence", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);
      manager.addMissile(spawnerId1, missileId3);

      manager.removeMissile(spawnerId1, missileId2);
      expect(manager.getMissiles(spawnerId1)).toEqual([missileId1, missileId3]);

      manager.removeMissile(spawnerId1, missileId1);
      expect(manager.getMissiles(spawnerId1)).toEqual([missileId3]);

      manager.removeMissile(spawnerId1, missileId3);
      expect(manager.getMissileCount(spawnerId1)).toBe(0);
    });
  });

  describe("getMissileCount", () => {
    it("should return 0 for spawner with no missiles", () => {
      expect(manager.getMissileCount(spawnerId1)).toBe(0);
    });

    it("should return correct count after additions", () => {
      for (let i = 0; i < 5; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      expect(manager.getMissileCount(spawnerId1)).toBe(5);
    });

    it("should return correct count after removals", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);
      manager.addMissile(spawnerId1, missileId3);

      manager.removeMissile(spawnerId1, missileId2);
      expect(manager.getMissileCount(spawnerId1)).toBe(2);
    });
  });

  describe("getMissiles", () => {
    it("should return empty array for spawner with no missiles", () => {
      expect(manager.getMissiles(spawnerId1)).toEqual([]);
    });

    it("should return all missiles for a spawner", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId2);
      manager.addMissile(spawnerId1, missileId3);

      expect(manager.getMissiles(spawnerId1)).toEqual([missileId1, missileId2, missileId3]);
    });

    it("should return missiles in insertion order", () => {
      const missiles = [
        `missile-a` as unknown as any,
        `missile-b` as unknown as any,
        `missile-c` as unknown as any,
      ];
      missiles.forEach((id) => manager.addMissile(spawnerId1, id));

      expect(manager.getMissiles(spawnerId1)).toEqual(missiles);
    });
  });

  describe("canSpawnMissile", () => {
    it("should return true when spawner has no missiles (default limit 10)", () => {
      expect(manager.canSpawnMissile(spawnerId1)).toBe(true);
    });

    it("should return true when under the limit", () => {
      for (let i = 0; i < 5; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      expect(manager.canSpawnMissile(spawnerId1)).toBe(true);
    });

    it("should return false when at limit (default 10)", () => {
      for (let i = 0; i < 10; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      expect(manager.canSpawnMissile(spawnerId1)).toBe(false);
    });

    it("should return false when over limit", () => {
      for (let i = 0; i < 15; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      expect(manager.canSpawnMissile(spawnerId1)).toBe(false);
    });

    it("should respect custom max missiles limit", () => {
      const customMax = 5;
      for (let i = 0; i < 4; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }

      expect(manager.canSpawnMissile(spawnerId1, customMax)).toBe(true);

      manager.addMissile(spawnerId1, `missile-4` as unknown as any);
      expect(manager.canSpawnMissile(spawnerId1, customMax)).toBe(false);
    });

    it("should work independently for different spawners", () => {
      for (let i = 0; i < 10; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      // spawnerId1 is at limit

      expect(manager.canSpawnMissile(spawnerId1)).toBe(false);
      expect(manager.canSpawnMissile(spawnerId2)).toBe(true); // Different spawner

      manager.addMissile(spawnerId2, missileId1);
      expect(manager.canSpawnMissile(spawnerId2)).toBe(true);
    });

    it("should return true after removing missiles below limit", () => {
      for (let i = 0; i < 10; i++) {
        manager.addMissile(spawnerId1, `missile-${i}` as unknown as any);
      }
      expect(manager.canSpawnMissile(spawnerId1)).toBe(false);

      manager.removeMissile(spawnerId1, `missile-0` as unknown as any);
      expect(manager.canSpawnMissile(spawnerId1)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle simultaneous operations on different spawners", () => {
      const s1m1 = `s1m1` as unknown as any;
      const s1m2 = `s1m2` as unknown as any;
      const s2m1 = `s2m1` as unknown as any;

      manager.addMissile(spawnerId1, s1m1);
      manager.addMissile(spawnerId2, s2m1);
      manager.addMissile(spawnerId1, s1m2);

      expect(manager.getMissileCount(spawnerId1)).toBe(2);
      expect(manager.getMissileCount(spawnerId2)).toBe(1);

      manager.removeMissile(spawnerId1, s1m1);
      expect(manager.getMissileCount(spawnerId1)).toBe(1);
      expect(manager.getMissileCount(spawnerId2)).toBe(1);
    });

    it("should handle re-adding missiles after removal", () => {
      manager.addMissile(spawnerId1, missileId1);
      manager.removeMissile(spawnerId1, missileId1);
      manager.addMissile(spawnerId1, missileId1);

      expect(manager.getMissileCount(spawnerId1)).toBe(1);
      expect(manager.getMissiles(spawnerId1)).toContain(missileId1);
    });

    it("should maintain state consistency with many operations", () => {
      const count = 100;
      const missiles = Array.from({ length: count }, (_, i) => `missile-${i}` as unknown as any);

      missiles.forEach((id) => manager.addMissile(spawnerId1, id));
      expect(manager.getMissileCount(spawnerId1)).toBe(count);

      // Remove every other missile
      for (let i = 0; i < count; i += 2) {
        manager.removeMissile(spawnerId1, missiles[i]);
      }

      expect(manager.getMissileCount(spawnerId1)).toBe(Math.ceil(count / 2));
    });
  });
});
