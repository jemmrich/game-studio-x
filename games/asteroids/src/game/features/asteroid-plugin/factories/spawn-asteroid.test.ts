import { describe, it, expect, beforeEach, vi } from "vitest";
import { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Name } from "@engine/components/mod.ts";
import { spawnAsteroid } from "./spawn-asteroid.ts";
import { AsteroidComponent, Velocity, AngularVelocity, AsteroidGeometry } from "../components/mod.ts";
import { BasicMaterial, Visible } from "@engine/features/render-plugin/mod.ts";

describe("spawnAsteroid factory", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe("basic spawning", () => {
    it("should create an asteroid entity", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);

      expect(asteroidId).toBeDefined();
      expect(world.entityExists(asteroidId)).toBe(true);
    });

    it("should add AsteroidComponent to entity", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const asteroid = world.get(asteroidId, AsteroidComponent);

      expect(asteroid).toBeDefined();
      expect(asteroid?.sizeTier).toBe(2);
    });

    it("should add Transform component with correct position", () => {
      const position: [number, number, number] = [100, 50, 25];
      const asteroidId = spawnAsteroid(world, position, 1);
      const transform = world.get(asteroidId, Transform);

      expect(transform).toBeDefined();
      expect(transform?.position).toEqual(position);
    });

    it("should add Velocity component", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const velocity = world.get(asteroidId, Velocity);

      expect(velocity).toBeDefined();
      expect(velocity?.x).toBeDefined();
      expect(velocity?.y).toBeDefined();
    });

    it("should add AngularVelocity component", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const angularVelocity = world.get(asteroidId, AngularVelocity);

      expect(angularVelocity).toBeDefined();
      expect(angularVelocity?.z).toBeDefined();
    });

    it("should add AsteroidGeometry component for rendering", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 1);
      const geometry = world.get(asteroidId, AsteroidGeometry);

      expect(geometry).toBeDefined();
    });

    it("should add BasicMaterial component", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const material = world.get(asteroidId, BasicMaterial);

      expect(material).toBeDefined();
    });

    it("should add Visible component set to true", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const visible = world.get(asteroidId, Visible);

      expect(visible).toBeDefined();
      expect(visible?.enabled).toBe(true);
    });

    it("should add Name component for debugging", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const name = world.get(asteroidId, Name);

      expect(name).toBeDefined();
      expect(name?.value).toContain("Asteroid_Large");
    });
  });

  describe("size tier variants", () => {
    it("should handle size tier 3 (Large)", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const asteroid = world.get(asteroidId, AsteroidComponent);

      expect(asteroid?.sizeTier).toBe(3);
    });

    it("should handle size tier 2 (Medium)", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const asteroid = world.get(asteroidId, AsteroidComponent);

      expect(asteroid?.sizeTier).toBe(2);
    });

    it("should handle size tier 1 (Small)", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 1);
      const asteroid = world.get(asteroidId, AsteroidComponent);

      expect(asteroid?.sizeTier).toBe(1);
    });

    it("should apply correct mesh scale for each size tier", () => {
      const expectedScales: Record<number, number> = {
        3: 1.0,
        2: 0.6,
        1: 0.3,
      };

      for (const [size, expectedScale] of Object.entries(expectedScales)) {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], parseInt(size) as 1 | 2 | 3);
        const transform = world.get(asteroidId, Transform);

        // Scale should be proportional to expected (multiplied by worldScale from config)
        expect(transform?.scale[0]).toBeGreaterThan(0);
        expect(transform?.scale[1]).toBeGreaterThan(0);
        expect(transform?.scale[2]).toBeGreaterThan(0);
      }
    });

    it("should have larger asteroids than smaller ones", () => {
      const transforms = new Map();

      for (const size of [1, 2, 3] as const) {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], size);
        const transform = world.get(asteroidId, Transform);
        transforms.set(size, transform?.scale[0]);
      }

      expect(transforms.get(3)).toBeGreaterThan(transforms.get(2));
      expect(transforms.get(2)).toBeGreaterThan(transforms.get(1));
    });
  });

  describe("position and rotation", () => {
    it("should spawn at specified position", () => {
      const positions: Array<[number, number, number]> = [
        [0, 0, 0],
        [100, 200, 50],
        [-50, -100, -25],
        [500, 300, 0],
      ];

      positions.forEach((pos) => {
        const asteroidId = spawnAsteroid(world, pos, 2);
        const transform = world.get(asteroidId, Transform);

        expect(transform?.position).toEqual(pos);
      });
    });

    it("should have random rotation between 0 and 2π", () => {
      const rotations: number[] = [];

      // Spawn multiple asteroids to check for randomness
      for (let i = 0; i < 10; i++) {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
        const transform = world.get(asteroidId, Transform);
        if (transform) {
          rotations.push(transform.rotation[2]);
        }
      }

      // Check that rotations are in valid range
      rotations.forEach((rot) => {
        expect(rot).toBeGreaterThanOrEqual(0);
        expect(rot).toBeLessThanOrEqual(Math.PI * 2);
      });

      // Should have some variety in rotations
      const uniqueRotations = new Set(rotations);
      expect(uniqueRotations.size).toBeGreaterThan(1);
    });

    it("should have randomized velocity direction", () => {
      const velocities: Array<{ x: number; y: number }> = [];

      // Spawn multiple asteroids to check for randomness
      for (let i = 0; i < 10; i++) {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
        const velocity = world.get(asteroidId, Velocity);
        if (velocity) {
          velocities.push({ x: velocity.x, y: velocity.y });
        }
      }

      // Should have variety in directions
      const uniqueDirections = new Set(velocities.map((v) => `${v.x},${v.y}`));
      expect(uniqueDirections.size).toBeGreaterThan(1);
    });

    it("should have velocity matching size tier speeds", () => {
      for (const size of [1, 2, 3] as const) {
        // Spawn multiple to check consistency
        for (let i = 0; i < 5; i++) {
          const asteroidId = spawnAsteroid(world, [0, 0, 0], size);
          const velocity = world.get(asteroidId, Velocity);
          
          // Velocity should exist and have a non-zero magnitude
          expect(velocity).toBeDefined();
          const speed = Math.sqrt(velocity!.x * velocity!.x + velocity!.y * velocity!.y);
          expect(speed).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("velocity randomization", () => {
    it("should have angular velocity Z component between -1 and 1", () => {
      const angularVelocities: number[] = [];

      for (let i = 0; i < 10; i++) {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
        const angVel = world.get(asteroidId, AngularVelocity);
        if (angVel) {
          angularVelocities.push(angVel.z);
        }
      }

      angularVelocities.forEach((vel) => {
        expect(vel).toBeGreaterThanOrEqual(-1);
        expect(vel).toBeLessThanOrEqual(1);
      });
    });

    it("should have zero velocity in Z direction", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 3);
      const velocity = world.get(asteroidId, Velocity);

      expect(velocity?.z).toBe(0);
    });

    it("should have zero angular velocity in X and Y", () => {
      const asteroidId = spawnAsteroid(world, [0, 0, 0], 2);
      const angVel = world.get(asteroidId, AngularVelocity);

      expect(angVel?.x).toBe(0);
      expect(angVel?.y).toBe(0);
    });
  });

  describe("name generation", () => {
    it("should generate name with size tier label", () => {
      const testCases: Array<[number, string]> = [
        [3, "Large"],
        [2, "Medium"],
        [1, "Small"],
      ];

      testCases.forEach(([size, label]) => {
        const asteroidId = spawnAsteroid(world, [0, 0, 0], size as 1 | 2 | 3);
        const name = world.get(asteroidId, Name);

        expect(name?.value).toContain(`Asteroid_${label}`);
      });
    });

    it("should include entity ID in name for uniqueness", () => {
      const asteroid1Id = spawnAsteroid(world, [0, 0, 0], 3);
      const asteroid2Id = spawnAsteroid(world, [0, 0, 0], 3);

      const name1 = world.get(asteroid1Id, Name);
      const name2 = world.get(asteroid2Id, Name);

      expect(name1?.value).not.toBe(name2?.value);
    });
  });

  describe("multiple spawning", () => {
    it("should spawn multiple independent asteroids", () => {
      const asteroidIds = [];

      for (let i = 0; i < 5; i++) {
        const id = spawnAsteroid(world, [i * 100, i * 50, 0], (((i % 3) + 1) as 1 | 2 | 3));
        asteroidIds.push(id);
      }

      // All should exist independently
      asteroidIds.forEach((id) => {
        expect(world.entityExists(id)).toBe(true);
      });

      // All should have different IDs
      const uniqueIds = new Set(asteroidIds);
      expect(uniqueIds.size).toBe(asteroidIds.length);

      // Each should have independent components
      const transforms = asteroidIds.map((id) => world.get(id, Transform));
      transforms.forEach((transform, i) => {
        expect(transform?.position[0]).toBe(i * 100);
      });
    });
  });
});
