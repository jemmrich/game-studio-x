import { describe, it, expect, beforeEach, vi } from "vitest";
import { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { AsteroidCollisionSystem } from "./asteroid-collision-system.ts";
import { AsteroidDestructionSystem } from "./asteroid-destruction-system.ts";
import { AsteroidSpawningSystem } from "./asteroid-spawning-system.ts";
import { AsteroidComponent, Velocity, AngularVelocity } from "../components/mod.ts";
import { spawnAsteroid } from "../factories/spawn-asteroid.ts";
import { installGameStatsPlugin } from "../../game-stats-plugin/mod.ts";

describe("Asteroid Collision & Destruction - Integration Tests", () => {
  let world: World;
  let collisionSystem: AsteroidCollisionSystem;
  let destructionSystem: AsteroidDestructionSystem;
  let spawningSystem: AsteroidSpawningSystem;

  beforeEach(() => {
    world = new World();
    collisionSystem = new AsteroidCollisionSystem();
    destructionSystem = new AsteroidDestructionSystem();
    spawningSystem = new AsteroidSpawningSystem();

    // Mock render context
    world.addResource("render_context", { width: 1024, height: 768 });

    // Install game stats plugin
    installGameStatsPlugin(world);
  });

  describe("projectile collision handling", () => {
    it("should handle asteroid-projectile collision event", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const projectileId = world.createEntity();
      world.add(projectileId, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));

      // Emit collision event
      world.emitEvent("asteroid_projectile_collision", {
        asteroidId,
        projectileId,
      });

      // Process collision
      collisionSystem.update(world, 0.016);

      // Destruction event should be emitted
      const destructionEvents = world.getEvents("asteroid_destroyed");
      expect(destructionEvents.length).toBe(1);
      expect(destructionEvents[0].data).toEqual({
        asteroidId,
        position: [0, 0, 0],
      });
    });

    it("should remove projectile on collision", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const projectileId = world.createEntity();
      world.add(projectileId, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));

      expect(world.entityExists(projectileId)).toBe(true);

      world.emitEvent("asteroid_projectile_collision", {
        asteroidId,
        projectileId,
      });

      collisionSystem.update(world, 0.016);

      expect(world.entityExists(projectileId)).toBe(false);
    });

    it("should not crash if asteroid is invalid", () => {
      const invalidAsteroidId = "invalid-id" as any;
      const projectileId = world.createEntity();

      world.emitEvent("asteroid_projectile_collision", {
        asteroidId: invalidAsteroidId,
        projectileId,
      });

      // Should not throw
      expect(() => collisionSystem.update(world, 0.016)).not.toThrow();
    });

    it("should not crash if projectile is invalid", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const invalidProjectileId = "invalid-id" as any;

      world.emitEvent("asteroid_projectile_collision", {
        asteroidId,
        projectileId: invalidProjectileId,
      });

      expect(() => collisionSystem.update(world, 0.016)).not.toThrow();
    });

    it("should preserve asteroid position in destruction event", () => {
      const position: [number, number, number] = [100, 200, 50];
      const asteroidId = spawnAsteroid(world, position, 2);
      const projectileId = world.createEntity();

      world.emitEvent("asteroid_projectile_collision", {
        asteroidId,
        projectileId,
      });

      collisionSystem.update(world, 0.016);

      const destructionEvents = world.getEvents("asteroid_destroyed");
      expect(destructionEvents[0].data.position).toEqual(position);
    });
  });

  describe("asteroid destruction and spawning", () => {
    it("should spawn 2 smaller asteroids when size 3 is destroyed", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      const spawnEvents = world.getEvents("spawn_asteroid");
      expect(spawnEvents.length).toBe(2);
      spawnEvents.forEach((event) => {
        expect(event.data.sizeTier).toBe(2);
      });
    });

    it("should spawn 2 smaller asteroids when size 2 is destroyed", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      const spawnEvents = world.getEvents("spawn_asteroid");
      expect(spawnEvents.length).toBe(2);
      spawnEvents.forEach((event) => {
        expect(event.data.sizeTier).toBe(1);
      });
    });

    it("should not spawn asteroids when size 1 is destroyed", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 1);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      const spawnEvents = world.getEvents("spawn_asteroid");
      expect(spawnEvents.length).toBe(0);
    });

    it("should remove destroyed asteroid from world", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      expect(world.entityExists(asteroidId)).toBe(true);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(world.entityExists(asteroidId)).toBe(false);
    });

    it("should spawn new asteroids at destruction location", () => {
      const position: [number, number, number] = [100, 200, 50];
      const asteroidId = spawnAsteroid(world, position, 3);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position,
      });

      destructionSystem.update(world, 0.016);

      const spawnEvents = world.getEvents("spawn_asteroid");
      expect(spawnEvents.length).toBe(2);
      spawnEvents.forEach((event) => {
        expect(event.data.position).toEqual(position);
      });
    });

    it("should actually create entities for spawn events", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const initialCount = Array.from(world.query(AsteroidComponent).entities()).length;

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);
      spawningSystem.update(world, 0.016);

      const finalCount = Array.from(world.query(AsteroidComponent).entities()).length;
      // Size 3 destroyed (1 removed) -> 2 size 2 created = initialCount - 1 + 2 = initialCount + 1
      expect(finalCount).toBe(initialCount + 1);
    });
  });

  describe("score tracking", () => {
    it("should call score callback when asteroid is destroyed", () => {
      const scoreCallback = vi.fn();
      destructionSystem.setScoreCallback(scoreCallback);

      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(scoreCallback).toHaveBeenCalled();
    });

    it("should award correct points for size 3 asteroid", () => {
      const scoreCallback = vi.fn();
      destructionSystem.setScoreCallback(scoreCallback);

      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(scoreCallback).toHaveBeenCalledWith(20);
    });

    it("should award correct points for size 2 asteroid", () => {
      const scoreCallback = vi.fn();
      destructionSystem.setScoreCallback(scoreCallback);

      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(scoreCallback).toHaveBeenCalledWith(50);
    });

    it("should award correct points for size 1 asteroid", () => {
      const scoreCallback = vi.fn();
      destructionSystem.setScoreCallback(scoreCallback);

      const asteroidId = spawnAsteroid(world, [0, 0, 0], 1);

      world.emitEvent("asteroid_destroyed", {
        asteroidId,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(scoreCallback).toHaveBeenCalledWith(100);
    });

    it("should accumulate points for multiple destroyed asteroids", () => {
      const scoreCallback = vi.fn();
      destructionSystem.setScoreCallback(scoreCallback);

      const asteroid1 = spawnAsteroid(world, [0, 0, 0], 3);
      const asteroid2 = spawnAsteroid(world, [0, 0, 0], 2);

      world.emitEvent("asteroid_destroyed", {
        asteroidId: asteroid1,
        position: [0, 0, 0] as [number, number, number],
      });
      world.emitEvent("asteroid_destroyed", {
        asteroidId: asteroid2,
        position: [0, 0, 0] as [number, number, number],
      });

      destructionSystem.update(world, 0.016);

      expect(scoreCallback).toHaveBeenCalledTimes(2);
      expect(scoreCallback).toHaveBeenNthCalledWith(1, 20);
      expect(scoreCallback).toHaveBeenNthCalledWith(2, 50);
    });
  });

  describe("full collision flow", () => {
    it("should handle complete projectile hit -> destruction -> spawn flow", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const projectileId = world.createEntity();
      world.add(projectileId, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));

      // Step 1: Emit collision
      world.emitEvent("asteroid_projectile_collision", {
        asteroidId,
        projectileId,
      });

      // Step 2: Process collision
      collisionSystem.update(world, 0.016);

      // Asteroid should still exist (will be destroyed by destruction system)
      expect(world.entityExists(asteroidId)).toBe(true);

      // Step 3: Process destruction
      destructionSystem.update(world, 0.016);

      // Original asteroid should be gone
      expect(world.entityExists(asteroidId)).toBe(false);

      // Step 4: Process spawning
      spawningSystem.update(world, 0.016);

      // Should have 2 new size-2 asteroids
      const asteroids = Array.from(world.query(AsteroidComponent).entities());
      expect(asteroids.length).toBe(2);

      const sizes = asteroids.map((id) => world.get(id, AsteroidComponent)?.sizeTier);
      expect(sizes).toEqual([2, 2]);
    });

    it("should handle chain destruction (size 3 -> 2 -> 1)", () => {
      const size3Id = spawnAsteroid(world, [0, 0, 0], 3);
      const projectileId1 = world.createEntity();
      const projectileId2 = world.createEntity();

      // Hit size 3
      world.emitEvent("asteroid_projectile_collision", {
        asteroidId: size3Id,
        projectileId: projectileId1,
      });

      collisionSystem.update(world, 0.016);
      destructionSystem.update(world, 0.016);
      spawningSystem.update(world, 0.016);

      // Get one of the spawned size-2 asteroids
      const size2Asteroids = Array.from(world.query(AsteroidComponent).entities()).filter(
        (id) => world.get(id, AsteroidComponent)?.sizeTier === 2
      );
      expect(size2Asteroids.length).toBe(2);

      const size2Id = size2Asteroids[0];

      // Hit size 2
      world.emitEvent("asteroid_projectile_collision", {
        asteroidId: size2Id,
        projectileId: projectileId2,
      });

      collisionSystem.update(world, 0.016);
      destructionSystem.update(world, 0.016);
      spawningSystem.update(world, 0.016);

      // Should now have size-1 asteroids
      const allAsteroids = Array.from(world.query(AsteroidComponent).entities());
      // 1 size-2 from original + 2 size-1 from the destroyed size-2
      expect(allAsteroids.length).toBeGreaterThan(0);

      const size1Count = allAsteroids.filter(
        (id) => world.get(id, AsteroidComponent)?.sizeTier === 1
      ).length;
      expect(size1Count).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should gracefully handle destruction of non-existent asteroid", () => {
      const invalidId = "non-existent" as any;

      world.emitEvent("asteroid_destroyed", {
        asteroidId: invalidId,
        position: [0, 0, 0] as [number, number, number],
      });

      // Should not throw
      expect(() => destructionSystem.update(world, 0.016)).not.toThrow();
    });

    it("should handle multiple collisions in single frame", () => {
      const asteroid1 = spawnAsteroid(world, [0, 0, 0], 3);
      const asteroid2 = spawnAsteroid(world, [100, 100, 0], 2);
      const projectile1 = world.createEntity();
      const projectile2 = world.createEntity();

      world.emitEvent("asteroid_projectile_collision", {
        asteroidId: asteroid1,
        projectileId: projectile1,
      });
      world.emitEvent("asteroid_projectile_collision", {
        asteroidId: asteroid2,
        projectileId: projectile2,
      });

      expect(() => collisionSystem.update(world, 0.016)).not.toThrow();

      const destructionEvents = world.getEvents("asteroid_destroyed");
      expect(destructionEvents.length).toBe(2);
    });
  });
});
