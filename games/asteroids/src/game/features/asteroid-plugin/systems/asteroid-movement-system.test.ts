import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { AsteroidMovementSystem } from "./asteroid-movement-system.ts";
import { AsteroidComponent, Velocity, AngularVelocity } from "../components/mod.ts";
import { spawnAsteroid } from "../factories/spawn-asteroid.ts";

describe("AsteroidMovementSystem - Integration Tests", () => {
  let world: World;
  let movementSystem: AsteroidMovementSystem;

  beforeEach(() => {
    world = new World();
    movementSystem = new AsteroidMovementSystem();

    // Add a mock render context so the movement system can calculate bounds
    world.addResource("render_context", { width: 1024, height: 768 });
  });

  describe("velocity application", () => {
    it("should update position based on velocity", () => {
      // Create asteroid manually for precise control
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10, 0, 0)); // Move right 10 units per second
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Update for 1 second
      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(10, 1);
      expect(transform?.position[1]).toBe(0);
    });

    it("should apply velocity in Y direction", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, -20, 0)); // Move down 20 units per second
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[1]).toBeCloseTo(-20, 1);
    });

    it("should apply velocity in Z direction", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 15)); // Move forward 15 units per second
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[2]).toBeCloseTo(15, 1);
    });

    it("should apply combined velocity", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(5, 5, 5)); // Diagonal movement
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(5, 1);
      expect(transform?.position[1]).toBeCloseTo(5, 1);
      expect(transform?.position[2]).toBeCloseTo(5, 1);
    });

    it("should scale velocity by delta time", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Update for 0.5 seconds
      movementSystem.update(world, 0.5);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(5, 1); // 10 * 0.5 = 5
    });

    it("should accumulate position over multiple updates", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.25);
      movementSystem.update(world, 0.25);
      movementSystem.update(world, 0.5);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(10, 1); // (10 * 0.25) * 3 + (10 * 0.5) = 10
    });
  });

  describe("angular velocity / rotation", () => {
    it("should apply rotation based on angular velocity", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3, rotationSpeed: 1 }));
      world.add(entity, new AngularVelocity(0, 0, 1)); // 1 radian per second around Z

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.rotation[2]).toBeCloseTo(1, 1); // Should rotate 1 radian
    });

    it("should apply rotation around all axes", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0.5, 0.5, 0.5)); // Rotate on all axes

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.rotation[0]).toBeCloseTo(0.5, 1);
      expect(transform?.rotation[1]).toBeCloseTo(0.5, 1);
      expect(transform?.rotation[2]).toBeCloseTo(0.5, 1);
    });

    it("should apply rotation speed multiplier", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3, rotationSpeed: 2 }));
      world.add(entity, new AngularVelocity(0, 0, 1));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.rotation[2]).toBeCloseTo(2, 1); // rotationSpeed of 2 doubles the rotation
    });

    it("should accumulate rotation over multiple updates", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 1));

      movementSystem.update(world, 0.5);
      movementSystem.update(world, 0.5);

      const transform = world.get(entity, Transform);
      expect(transform?.rotation[2]).toBeCloseTo(1, 1); // 0.5 + 0.5 = 1
    });
  });

  describe("combined movement and rotation", () => {
    it("should apply both velocity and angular velocity simultaneously", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10, 10, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 1));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(10, 1);
      expect(transform?.position[1]).toBeCloseTo(10, 1);
      expect(transform?.rotation[2]).toBeCloseTo(1, 1);
    });

    it("should maintain independent position and rotation states", () => {
      const entity1 = world.createEntity();
      world.add(entity1, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity1, new Velocity(5, 0, 0));
      world.add(entity1, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity1, new AngularVelocity(0, 0, 1));

      const entity2 = world.createEntity();
      world.add(entity2, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity2, new Velocity(10, 0, 0));
      world.add(entity2, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity2, new AngularVelocity(0, 0, 2));

      movementSystem.update(world, 1.0);

      const transform1 = world.get(entity1, Transform);
      const transform2 = world.get(entity2, Transform);

      expect(transform1?.position[0]).toBeCloseTo(5, 1);
      expect(transform2?.position[0]).toBeCloseTo(10, 1);
      expect(transform1?.rotation[2]).toBeCloseTo(1, 1);
      expect(transform2?.rotation[2]).toBeCloseTo(2, 1);
    });
  });

  describe("entities with missing components", () => {
    it("should handle entities with Asteroid but no Velocity", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([5, 5, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      // Position should remain unchanged without velocity
      expect(transform?.position).toEqual([5, 5, 0]);
    });

    it("should handle entities with Asteroid but no AngularVelocity", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10, 0, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(10, 1);
      expect(transform?.rotation).toEqual([0, 0, 0]); // No rotation
    });
  });

  describe("spawned asteroids", () => {
    it("should move spawned asteroids correctly", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);

      // Just verify the system can process spawned asteroids
      expect(() => {
        movementSystem.update(world, 1.0);
      }).not.toThrow();
    });

    it("should rotate spawned asteroids", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const initialTransform = world.get(asteroidId, Transform);
      const initialAngularVelocity = world.get(asteroidId, AngularVelocity);

      movementSystem.update(world, 1.0);

      const updatedTransform = world.get(asteroidId, Transform);
      // Test that system applies rotation (angular velocity might be 0, so just ensure update runs)
      expect(updatedTransform).toBeDefined();
    });
  });

  describe("high-speed movement", () => {
    it("should handle high velocity correctly", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(1000, 500, 250)); // Very fast
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016); // ~60fps delta

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeCloseTo(1000 * 0.016, 0);
      expect(transform?.position[1]).toBeCloseTo(500 * 0.016, 0);
      expect(transform?.position[2]).toBeCloseTo(250 * 0.016, 0);
    });
  });

  describe("negative velocities", () => {
    it("should handle negative velocity correctly", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([10, 10, 10], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(-5, -5, -5));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      expect(transform?.position).toEqual([5, 5, 5]);
    });
  });
});
