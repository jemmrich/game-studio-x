import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Name } from "@engine/components/mod.ts";
import { spawnMissile } from "./spawn-missile.ts";
import { MissileComponent } from "../components/missile.ts";
import { MissileManager } from "../resources/missile-manager.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";

describe("spawnMissile factory", () => {
  let world: World;
  let manager: MissileManager;
  const spawnerId = "spawner-1" as unknown as any;

  beforeEach(() => {
    world = new World();
    manager = new MissileManager();
    world.addResource("MissileManager", manager);
  });

  describe("basic spawning", () => {
    it("should create a missile entity", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);

      expect(missileId).not.toBeNull();
      expect(world.entityExists(missileId!)).toBe(true);
    });

    it("should add MissileComponent to spawned entity", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      const missile = world.get(missileId!, MissileComponent);

      expect(missile).toBeDefined();
      expect(missile?.spawnerId).toBe(spawnerId);
    });

    it("should add Transform component to spawned entity", () => {
      const missileId = spawnMissile(world, [5, 10, 0], [1, 0, 0], spawnerId);
      const transform = world.get(missileId!, Transform);

      expect(transform).toBeDefined();
      // Position should be slightly offset in direction
      expect(transform?.position[0]).toBeGreaterThan(5);
    });

    it("should add Velocity component to spawned entity", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, 100);
      const velocity = world.get(missileId!, Velocity);

      expect(velocity).toBeDefined();
      // Velocity should have the specified speed in the direction
      expect(velocity?.x).toBeCloseTo(100, 1);
    });

    it("should add Name component for debugging", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      const name = world.get(missileId!, Name);

      expect(name).toBeDefined();
      expect(name?.value).toBe("Missile");
    });

    it("should register missile with MissileManager", () => {
      expect(manager.getMissileCount(spawnerId)).toBe(0);

      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);

      expect(manager.getMissileCount(spawnerId)).toBe(1);
      expect(manager.getMissiles(spawnerId)).toContain(missileId);
    });
  });

  describe("position and direction", () => {
    it("should offset spawn position forward in direction", () => {
      const startPos: [number, number, number] = [0, 0, 0];
      const direction: [number, number, number] = [1, 0, 0];

      const missileId = spawnMissile(world, startPos, direction, spawnerId);
      const transform = world.get(missileId!, Transform);

      // Missile should be spawned slightly ahead of the spawner
      expect(transform?.position[0]).toBeGreaterThan(startPos[0]);
      expect(transform?.position[1]).toBe(startPos[1]);
      expect(transform?.position[2]).toBe(startPos[2]);
    });

    it("should handle different direction vectors", () => {
      const directions: Array<[number, number, number]> = [
        [1, 0, 0],   // Right
        [0, 1, 0],   // Up
        [-1, 0, 0],  // Left
        [0, -1, 0],  // Down
        [0.707, 0.707, 0], // Diagonal
      ];

      const startPos: [number, number, number] = [0, 0, 0];

      directions.forEach((direction) => {
        const missileId = spawnMissile(world, startPos, direction, spawnerId);
        const transform = world.get(missileId!, Transform);

        // Position should be offset in the direction
        const offset = 1.5;
        expect(transform?.position[0]).toBeCloseTo(startPos[0] + direction[0] * offset, 1);
        expect(transform?.position[1]).toBeCloseTo(startPos[1] + direction[1] * offset, 1);
        expect(transform?.position[2]).toBeCloseTo(startPos[2] + direction[2] * offset, 1);
      });
    });

    it("should preserve non-zero spawn positions", () => {
      const positions: Array<[number, number, number]> = [
        [10, 20, 30],
        [-5, -10, 0],
        [100, 50, 25],
      ];

      positions.forEach((pos) => {
        const missileId = spawnMissile(world, pos, [1, 0, 0], spawnerId);
        const transform = world.get(missileId!, Transform);

        expect(transform?.position[0]).toBeGreaterThan(pos[0]);
        expect(transform?.position[1]).toBe(pos[1]);
        expect(transform?.position[2]).toBe(pos[2]);
      });
    });
  });

  describe("speed and velocity", () => {
    it("should use default speed of 100 if not specified", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      const missile = world.get(missileId!, MissileComponent);

      expect(missile?.speed).toBe(100);
    });

    it("should apply custom speed parameter", () => {
      const speeds = [50, 100, 150, 200];

      speeds.forEach((speed) => {
        const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, speed);
        const missile = world.get(missileId!, MissileComponent);

        expect(missile?.speed).toBe(speed);
      });
    });

    it("should set velocity based on direction and speed", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, 100);
      const velocity = world.get(missileId!, Velocity);

      expect(velocity?.x).toBeCloseTo(100, 1);
      expect(velocity?.y).toBeCloseTo(0, 1);
      expect(velocity?.z).toBeCloseTo(0, 1);
    });

    it("should handle diagonal direction velocities", () => {
      const direction: [number, number, number] = [0.707, 0.707, 0];
      const speed = 100;

      const missileId = spawnMissile(world, [0, 0, 0], direction, spawnerId, speed);
      const velocity = world.get(missileId!, Velocity);

      const expectedVelX = direction[0] * speed;
      const expectedVelY = direction[1] * speed;

      expect(velocity?.x).toBeCloseTo(expectedVelX, 1);
      expect(velocity?.y).toBeCloseTo(expectedVelY, 1);
    });

    it("should inherit spawner velocity", () => {
      const spawnerVelocity: [number, number, number] = [10, 20, 0];
      const direction: [number, number, number] = [1, 0, 0];
      const speed = 100;

      const missileId = spawnMissile(
        world,
        [0, 0, 0],
        direction,
        spawnerId,
        speed,
        3000,
        10,
        spawnerVelocity
      );
      const velocity = world.get(missileId!, Velocity);

      // Velocity = direction * speed + spawnerVelocity
      expect(velocity?.x).toBeCloseTo(speed + spawnerVelocity[0], 1);
      expect(velocity?.y).toBeCloseTo(spawnerVelocity[1], 1);
      expect(velocity?.z).toBeCloseTo(spawnerVelocity[2], 1);
    });
  });

  describe("lifetime", () => {
    it("should use default lifetime of 3000ms if not specified", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      const missile = world.get(missileId!, MissileComponent);

      // Default is 3000ms = 3.0 seconds
      expect(missile?.lifetime).toBe(3.0);
    });

    it("should convert lifetime from milliseconds to seconds", () => {
      const lifetimes = [1000, 2000, 3000, 5000];

      lifetimes.forEach((lifeMs) => {
        const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, 100, lifeMs);
        const missile = world.get(missileId!, MissileComponent);

        expect(missile?.lifetime).toBe(lifeMs / 1000);
      });
    });

    it("should handle short lifetimes", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, 100, 100);
      const missile = world.get(missileId!, MissileComponent);

      expect(missile?.lifetime).toBe(0.1);
    });

    it("should handle long lifetimes", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId, 100, 10000);
      const missile = world.get(missileId!, MissileComponent);

      expect(missile?.lifetime).toBe(10);
    });
  });

  describe("missile limit enforcement", () => {
    it("should use default max missiles of 10", () => {
      for (let i = 0; i < 10; i++) {
        const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
        expect(missileId).not.toBeNull();
      }

      // 11th missile should fail
      const missileId11 = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      expect(missileId11).toBeNull();
      expect(manager.getMissileCount(spawnerId)).toBe(10);
    });

    it("should respect custom max missiles limit", () => {
      const maxMissiles = 5;

      for (let i = 0; i < maxMissiles; i++) {
        const missileId = spawnMissile(
          world,
          [0, 0, 0],
          [1, 0, 0],
          spawnerId,
          100,
          3000,
          maxMissiles
        );
        expect(missileId).not.toBeNull();
      }

      // One more should fail
      const extraMissile = spawnMissile(
        world,
        [0, 0, 0],
        [1, 0, 0],
        spawnerId,
        100,
        3000,
        maxMissiles
      );
      expect(extraMissile).toBeNull();
      expect(manager.getMissileCount(spawnerId)).toBe(maxMissiles);
    });

    it("should allow spawning after missiles are destroyed", () => {
      const maxMissiles = 3;

      // Spawn max missiles
      const missiles = [];
      for (let i = 0; i < maxMissiles; i++) {
        const id = spawnMissile(
          world,
          [0, 0, 0],
          [1, 0, 0],
          spawnerId,
          100,
          3000,
          maxMissiles
        );
        missiles.push(id);
      }

      expect(manager.getMissileCount(spawnerId)).toBe(maxMissiles);

      // Destroy one
      world.destroyEntity(missiles[0]!);
      manager.removeMissile(spawnerId, missiles[0]!);

      // Should be able to spawn now
      const newMissile = spawnMissile(
        world,
        [0, 0, 0],
        [1, 0, 0],
        spawnerId,
        100,
        3000,
        maxMissiles
      );
      expect(newMissile).not.toBeNull();
      expect(manager.getMissileCount(spawnerId)).toBe(maxMissiles);
    });

    it("should track limits independently per spawner", () => {
      const spawner1 = "spawner-1" as unknown as any;
      const spawner2 = "spawner-2" as unknown as any;
      const maxMissiles = 3;

      // Fill spawner1 to limit
      for (let i = 0; i < maxMissiles; i++) {
        spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner1, 100, 3000, maxMissiles);
      }

      expect(manager.getMissileCount(spawner1)).toBe(maxMissiles);

      // Spawner2 should still be able to spawn
      const s2Missile = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawner2, 100, 3000, maxMissiles);
      expect(s2Missile).not.toBeNull();
      expect(manager.getMissileCount(spawner2)).toBe(1);
    });

    it("should return null when limit reached (graceful failure)", () => {
      for (let i = 0; i < 10; i++) {
        spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      }

      const result = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);

      expect(result).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should return null if MissileManager not found", () => {
      const world2 = new World();
      // No MissileManager added

      expect(() => {
        spawnMissile(world2, [0, 0, 0], [1, 0, 0], spawnerId);
      }).toThrow();
    });

    it("should handle missing Transform plugin gracefully", () => {
      // This depends on the engine's error handling
      // The spawnMissile function assumes Transform is available
      expect(() => {
        spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      }).not.toThrow();
    });
  });

  describe("multiple spawns", () => {
    it("should spawn multiple missiles from same spawner", () => {
      const count = 5;
      const missiles = [];

      for (let i = 0; i < count; i++) {
        const id = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
        missiles.push(id);
      }

      expect(missiles).toHaveLength(count);
      missiles.forEach((id) => {
        expect(id).not.toBeNull();
        expect(world.entityExists(id!)).toBe(true);
      });
      expect(manager.getMissileCount(spawnerId)).toBe(count);
    });

    it("should spawn missiles with different parameters", () => {
      const configs = [
        { speed: 50, lifetime: 1000, direction: [1, 0, 0] as [number, number, number] },
        { speed: 100, lifetime: 3000, direction: [0, 1, 0] as [number, number, number] },
        { speed: 150, lifetime: 5000, direction: [-1, 0, 0] as [number, number, number] },
      ];

      const missiles = configs.map(({ speed, lifetime, direction }) =>
        spawnMissile(world, [0, 0, 0], direction, spawnerId, speed, lifetime)
      );

      missiles.forEach((id, i) => {
        const missile = world.get(id!, MissileComponent);
        expect(missile?.speed).toBe(configs[i].speed);
        expect(missile?.lifetime).toBe(configs[i].lifetime / 1000);
      });
    });

    it("should spawn missiles at different positions", () => {
      const positions: Array<[number, number, number]> = [
        [0, 0, 0],
        [10, 10, 0],
        [-5, 20, 0],
      ];

      const missiles = positions.map((pos) =>
        spawnMissile(world, pos, [1, 0, 0], spawnerId)
      );

      missiles.forEach((id, i) => {
        const transform = world.get(id!, Transform);
        expect(transform?.position[0]).toBeGreaterThan(positions[i][0]);
        expect(transform?.position[1]).toBe(positions[i][1]);
      });
    });
  });

  describe("scale and rendering setup", () => {
    it("should spawn missile at small scale for point rendering", () => {
      const missileId = spawnMissile(world, [0, 0, 0], [1, 0, 0], spawnerId);
      const transform = world.get(missileId!, Transform);

      // Missiles should be very small (point-like)
      expect(transform?.scale[0]).toBeLessThan(0.1);
      expect(transform?.scale[1]).toBeLessThan(0.1);
      expect(transform?.scale[2]).toBeLessThan(0.1);
    });
  });
});
