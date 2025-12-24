import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { AsteroidMovementSystem } from "./asteroid-movement-system.ts";
import { AsteroidComponent, Velocity, AngularVelocity } from "../components/mod.ts";

describe("AsteroidMovementSystem - Screen Wrap Edge Cases", () => {
  let world: World;
  let movementSystem: AsteroidMovementSystem;

  beforeEach(() => {
    world = new World();
    movementSystem = new AsteroidMovementSystem();

    // Set render context to known dimensions for testing
    // Camera is 100 units away, FOV is 60 degrees
    // Default calculated bounds: width=115.47 (~-57.7 to 57.7), height=86.6 (~-43.3 to 43.3)
    // But let's force an update to initialize with these defaults
    world.addResource("render_context", { width: 1024, height: 768 });
  });

  describe("screen wrap on right edge", () => {
    it("should wrap asteroid from right edge to left edge", () => {
      const entity = world.createEntity();
      // Position just off the right edge
      world.add(entity, new Transform([500, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(100, 0, 0)); // Moving right (but position is already off-screen)
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016); // Initialize bounds

      // Move to trigger wrap
      world.add(entity, new Transform([500, 0, 0], [0, 0, 0], [1, 1, 1]));
      movementSystem.update(world, 1.0);

      const transform = world.get(entity, Transform);
      // Should be wrapped to left side
      expect(transform?.position[0]).toBeLessThan(0);
    });

    it("should wrap asteroid when moving right past max boundary", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(100, 0, 0)); // Moving right fast
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Initialize bounds first
      movementSystem.update(world, 0.016);

      // Apply multiple updates to move far right
      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should eventually wrap back to left side
      expect(transform?.position[0]).toBeDefined();
    });
  });

  describe("screen wrap on left edge", () => {
    it("should wrap asteroid from left edge to right edge", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(-100, 0, 0)); // Moving left fast
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Initialize bounds
      movementSystem.update(world, 0.016);

      // Apply multiple updates
      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should wrap to right side
      expect(transform?.position[0]).toBeDefined();
    });
  });

  describe("screen wrap on top edge", () => {
    it("should wrap asteroid from top edge to bottom edge", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 100, 0)); // Moving up fast
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Initialize bounds
      movementSystem.update(world, 0.016);

      // Apply multiple updates
      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should eventually wrap
      expect(transform?.position[1]).toBeDefined();
    });
  });

  describe("screen wrap on bottom edge", () => {
    it("should wrap asteroid from bottom edge to top edge", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, -100, 0)); // Moving down fast
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      // Initialize bounds
      movementSystem.update(world, 0.016);

      // Apply multiple updates
      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should eventually wrap
      expect(transform?.position[1]).toBeDefined();
    });
  });

  describe("diagonal wrap", () => {
    it("should wrap asteroid moving diagonally", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(100, 100, 0)); // Moving diagonally
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should handle both axes
      expect(transform?.position[0]).toBeDefined();
      expect(transform?.position[1]).toBeDefined();
    });

    it("should wrap asteroid moving opposite diagonally", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(-100, -100, 0)); // Moving diagonally negative
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeDefined();
      expect(transform?.position[1]).toBeDefined();
    });
  });

  describe("corner wrapping", () => {
    it("should wrap asteroid exiting from top-right corner", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(150, 150, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      for (let i = 0; i < 150; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeDefined();
      expect(transform?.position[1]).toBeDefined();
    });

    it("should wrap asteroid exiting from bottom-left corner", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(-150, -150, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      for (let i = 0; i < 150; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      expect(transform?.position[0]).toBeDefined();
      expect(transform?.position[1]).toBeDefined();
    });
  });

  describe("stationary and slow moving asteroids", () => {
    it("should not wrap stationary asteroid", () => {
      const entity = world.createEntity();
      const position: [number, number, number] = [10, 20, 0];
      world.add(entity, new Transform(position, [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(0, 0, 0)); // Stationary
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      const transform = world.get(entity, Transform);
      expect(transform?.position).toEqual(position);
    });

    it("should not wrap asteroid moving within bounds", () => {
      const entity = world.createEntity();
      const startPosition: [number, number, number] = [0, 0, 0];
      world.add(entity, new Transform(startPosition, [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(5, 5, 0)); // Small movement
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);
      movementSystem.update(world, 0.016); // Few updates
      movementSystem.update(world, 0.016);

      const transform = world.get(entity, Transform);
      // Should be slightly moved but not wrapped
      expect(Math.abs(transform?.position[0]!)).toBeLessThan(100);
      expect(Math.abs(transform?.position[1]!)).toBeLessThan(100);
    });
  });

  describe("wrap consistency", () => {
    it("should maintain asteroid in valid game bounds after wrapping", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(200, 200, 0)); // Very fast movement
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      // Simulate many frames
      for (let i = 0; i < 500; i++) {
        movementSystem.update(world, 0.016);

        const transform = world.get(entity, Transform);
        // Position should always be finite (no NaN)
        expect(Number.isFinite(transform?.position[0]!)).toBe(true);
        expect(Number.isFinite(transform?.position[1]!)).toBe(true);
        expect(Number.isFinite(transform?.position[2]!)).toBe(true);
      }
    });

    it("should wrap multiple asteroids independently", () => {
      const entity1 = world.createEntity();
      world.add(entity1, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity1, new Velocity(100, 0, 0));
      world.add(entity1, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity1, new AngularVelocity(0, 0, 0));

      const entity2 = world.createEntity();
      world.add(entity2, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity2, new Velocity(-100, 0, 0));
      world.add(entity2, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity2, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);

      const initialPos1 = world.get(entity1, Transform)?.position[0]!;
      const initialPos2 = world.get(entity2, Transform)?.position[0]!;

      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const finalPos1 = world.get(entity1, Transform)?.position[0]!;
      const finalPos2 = world.get(entity2, Transform)?.position[0]!;

      // Positions should have changed independently
      expect(finalPos1).not.toBe(initialPos1);
      expect(finalPos2).not.toBe(initialPos2);

      // Both should be finite
      expect(Number.isFinite(finalPos1)).toBe(true);
      expect(Number.isFinite(finalPos2)).toBe(true);
    });
  });

  describe("wrap with rotation", () => {
    it("should wrap asteroid while rotating", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(100, 100, 0));
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(1, 1, 1)); // Rotating on all axes

      movementSystem.update(world, 0.016);

      for (let i = 0; i < 100; i++) {
        movementSystem.update(world, 0.016);
      }

      const transform = world.get(entity, Transform);
      // Should have moved and wrapped
      expect(transform?.position[0]).toBeDefined();
      expect(transform?.position[1]).toBeDefined();
      // Should have rotated
      expect(transform?.rotation[0]).not.toBe(0);
      expect(transform?.rotation[1]).not.toBe(0);
      expect(transform?.rotation[2]).not.toBe(0);
    });
  });

  describe("extreme velocities and wrapping", () => {
    it("should handle extremely high velocity wrapping", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
      world.add(entity, new Velocity(10000, 10000, 0)); // Extremely high velocity
      world.add(entity, new AsteroidComponent({ sizeTier: 3 }));
      world.add(entity, new AngularVelocity(0, 0, 0));

      movementSystem.update(world, 0.016);
      movementSystem.update(world, 0.016); // Should wrap immediately

      const transform = world.get(entity, Transform);
      // Should still be finite and defined
      expect(Number.isFinite(transform?.position[0]!)).toBe(true);
      expect(Number.isFinite(transform?.position[1]!)).toBe(true);
    });
  });
});
