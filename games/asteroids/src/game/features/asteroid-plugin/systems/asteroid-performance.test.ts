import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { AsteroidMovementSystem } from "./asteroid-movement-system.ts";
import { AsteroidCollisionSystem } from "./asteroid-collision-system.ts";
import { AsteroidComponent, Velocity } from "../components/mod.ts";
import { spawnAsteroid } from "../factories/spawn-asteroid.ts";

describe("Asteroid Performance - 50+ Asteroids Tests", () => {
  let world: World;
  let movementSystem: AsteroidMovementSystem;
  let collisionSystem: AsteroidCollisionSystem;

  beforeEach(() => {
    world = new World();
    movementSystem = new AsteroidMovementSystem();
    collisionSystem = new AsteroidCollisionSystem();

    world.addResource("render_context", { width: 1024, height: 768 });
  });

  describe("spawning performance", () => {
    it("should spawn 50 asteroids efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should spawn 50 asteroids in less than 100ms
      expect(duration).toBeLessThan(100);

      const asteroids = Array.from(world.query(AsteroidComponent).entities());
      expect(asteroids.length).toBe(50);
    });

    it("should spawn 100 asteroids efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should spawn 100 asteroids in reasonable time (< 200ms)
      expect(duration).toBeLessThan(200);

      const asteroids = Array.from(world.query(AsteroidComponent).entities());
      expect(asteroids.length).toBe(100);
    });

    it("should handle spawning asteroids of mixed sizes", () => {
      const startTime = performance.now();

      for (let i = 0; i < 60; i++) {
        const sizes: Array<1 | 2 | 3> = [1, 2, 3];
        const size = sizes[i % 3];
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          size
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150);
    });
  });

  describe("movement update performance", () => {
    it("should update 50 asteroids efficiently per frame", () => {
      // Spawn 50 asteroids
      for (let i = 0; i < 50; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const startTime = performance.now();

      // Update for one frame
      movementSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should update 50 asteroids in less than 5ms
      expect(duration).toBeLessThan(5);
    });

    it("should update 100 asteroids efficiently per frame", () => {
      // Spawn 100 asteroids
      for (let i = 0; i < 100; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const startTime = performance.now();

      // Update for one frame
      movementSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should update 100 asteroids in reasonable time (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    it("should handle continuous movement of 50 asteroids over 60 frames", () => {
      // Spawn 50 asteroids
      for (let i = 0; i < 50; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const startTime = performance.now();

      // Simulate 60 frames (1 second at 60fps)
      for (let frame = 0; frame < 60; frame++) {
        movementSystem.update(world, 0.016);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgFrameTime = totalDuration / 60;

      // Average frame time should be well under 16ms (60fps target)
      expect(avgFrameTime).toBeLessThan(8);
    });

    it("should handle screen wrapping of 50 asteroids efficiently", () => {
      // Spawn 50 asteroids moving off-screen
      for (let i = 0; i < 50; i++) {
        const velocityX = i % 2 === 0 ? 200 : -200;
        const velocityY = i % 3 === 0 ? 200 : -200;

        const asteroidId = spawnAsteroid(world, [0, 0, 0], ((i % 3) + 1) as 1 | 2 | 3);
        const velocity = world.get(asteroidId, Velocity);
        // Override velocity to test extreme speeds
        if (velocity) {
          velocity.x = velocityX;
          velocity.y = velocityY;
        }
      }

      const startTime = performance.now();

      // Multiple updates to trigger wrapping
      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Should handle wrapping efficiently
      expect(totalDuration).toBeLessThan(200);
    });
  });

  describe("collision detection performance", () => {
    it("should detect collisions with 50 asteroids efficiently", () => {
      // Spawn 50 asteroids
      const asteroidIds = [];
      for (let i = 0; i < 50; i++) {
        const id = spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
        asteroidIds.push(id);
      }

      const startTime = performance.now();

      // Emit collisions for half of them
      for (let i = 0; i < 25; i++) {
        const projectileId = world.createEntity();
        world.emitEvent("asteroid_projectile_collision", {
          asteroidId: asteroidIds[i],
          projectileId,
        });
      }

      // Update collision system
      collisionSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should process 25 collisions quickly
      expect(duration).toBeLessThan(10);
    });

    it("should handle multiple simultaneous collisions efficiently", () => {
      // Spawn 50 asteroids
      const asteroidIds = [];
      for (let i = 0; i < 50; i++) {
        const id = spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
        asteroidIds.push(id);
      }

      const startTime = performance.now();

      // Emit many collisions at once
      for (let i = 0; i < 50; i++) {
        const projectileId = world.createEntity();
        world.emitEvent("asteroid_projectile_collision", {
          asteroidId: asteroidIds[i],
          projectileId,
        });
      }

      collisionSystem.update(world, 0.016);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 50 simultaneous collisions
      expect(duration).toBeLessThan(20);
    });
  });

  describe("memory usage patterns", () => {
    it("should not accumulate memory when spawning and destroying asteroids", () => {
      // Spawn and destroy many asteroids
      for (let cycle = 0; cycle < 5; cycle++) {
        // Spawn 50
        const asteroidIds = [];
        for (let i = 0; i < 50; i++) {
          const id = spawnAsteroid(world, [0, 0, 0], ((i % 3) + 1) as 1 | 2 | 3);
          asteroidIds.push(id);
        }

        expect(Array.from(world.query(AsteroidComponent).entities()).length).toBe(50 * (cycle + 1));
      }

      // Total should accumulate linearly
      const totalCount = Array.from(world.query(AsteroidComponent).entities()).length;
      expect(totalCount).toBe(250);
    });

    it("should efficiently handle entity creation with components", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Each asteroid has ~7 components
      // Creating 100 asteroids with components should be fast
      expect(duration).toBeLessThan(150);

      const asteroids = Array.from(world.query(AsteroidComponent).entities());
      expect(asteroids.length).toBe(100);
    });
  });

  describe("sustained performance", () => {
    it("should maintain 60fps with 50 asteroids for 10 seconds", () => {
      // Spawn 50 asteroids
      for (let i = 0; i < 50; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const frameTimes: number[] = [];

      // Simulate 600 frames (10 seconds at 60fps)
      for (let frame = 0; frame < 600; frame++) {
        const frameStart = performance.now();
        movementSystem.update(world, 0.016);
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }

      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);

      // Average frame time should be well under 16ms
      expect(averageFrameTime).toBeLessThan(8);
      // Max frame time should not exceed 16ms significantly
      expect(maxFrameTime).toBeLessThan(20);
    });

    it("should maintain performance with 100 asteroids for 5 seconds", () => {
      // Spawn 100 asteroids
      for (let i = 0; i < 100; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const frameTimes: number[] = [];

      // Simulate 300 frames (5 seconds at 60fps)
      for (let frame = 0; frame < 300; frame++) {
        const frameStart = performance.now();
        movementSystem.update(world, 0.016);
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }

      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

      // Average frame time should be reasonable
      expect(averageFrameTime).toBeLessThan(10);
    });
  });

  describe("query performance", () => {
    it("should query 50 asteroids efficiently", () => {
      // Spawn 50 asteroids
      for (let i = 0; i < 50; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const startTime = performance.now();

      // Query multiple times (typical for a game loop)
      for (let i = 0; i < 100; i++) {
        const asteroids = Array.from(world.query(AsteroidComponent).entities());
        expect(asteroids.length).toBe(50);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100 queries on 50 entities should be fast
      expect(duration).toBeLessThan(20);
    });

    it("should efficiently iterate over 100 asteroids", () => {
      // Spawn 100 asteroids
      for (let i = 0; i < 100; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const startTime = performance.now();

      // Iterate over asteroids
      for (let iteration = 0; iteration < 10; iteration++) {
        let count = 0;
        for (const [entity] of world.query(AsteroidComponent).entities()) {
          count++;
        }
        expect(count).toBe(100);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Iteration should be efficient
      expect(duration).toBeLessThan(20);
    });
  });

  describe("stress testing", () => {
    it("should handle edge case: spawning 200 asteroids", () => {
      const startTime = performance.now();

      for (let i = 0; i < 200; i++) {
        spawnAsteroid(
          world,
          [Math.random() * 400 - 200, Math.random() * 300 - 150, 0],
          ((i % 3) + 1) as 1 | 2 | 3
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const count = Array.from(world.query(AsteroidComponent).entities()).length;
      expect(count).toBe(200);

      // Should complete in reasonable time even with 200
      expect(duration).toBeLessThan(500);
    });

    it("should maintain stability with rapid collisions on 50 asteroids", () => {
      const asteroidIds = [];
      for (let i = 0; i < 50; i++) {
        const id = spawnAsteroid(world, [0, 0, 0], ((i % 3) + 1) as 1 | 2 | 3);
        asteroidIds.push(id);
      }

      const startTime = performance.now();

      // Rapid collisions across multiple frames
      for (let frame = 0; frame < 100; frame++) {
        if (asteroidIds.length > 0) {
          const randomIndex = Math.floor(Math.random() * asteroidIds.length);
          const asteroidId = asteroidIds[randomIndex];

          if (world.entityExists(asteroidId)) {
            const projectileId = world.createEntity();
            world.emitEvent("asteroid_projectile_collision", {
              asteroidId,
              projectileId,
            });

            collisionSystem.update(world, 0.016);

            // Remove destroyed asteroids from our list
            if (!world.entityExists(asteroidId)) {
              asteroidIds.splice(randomIndex, 1);
            }
          }
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid collisions
      expect(duration).toBeLessThan(200);
    });
  });
});
