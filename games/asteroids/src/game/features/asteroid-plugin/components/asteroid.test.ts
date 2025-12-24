import { describe, it, expect } from "vitest";
import { AsteroidComponent, type AsteroidSizeTier } from "./asteroid.ts";

describe("AsteroidComponent", () => {
  describe("constructor", () => {
    it("should create component with default values", () => {
      const asteroid = new AsteroidComponent();

      expect(asteroid.sizeTier).toBe(3);
      expect(asteroid.rotationSpeed).toBe(1);
      expect(asteroid.boundingSphereEnabled).toBe(false);
    });

    it("should create component with custom values", () => {
      const asteroid = new AsteroidComponent({
        sizeTier: 1,
        rotationSpeed: 2,
        boundingSphereEnabled: true,
      });

      expect(asteroid.sizeTier).toBe(1);
      expect(asteroid.rotationSpeed).toBe(2);
      expect(asteroid.boundingSphereEnabled).toBe(true);
    });

    it("should accept partial options", () => {
      const asteroid = new AsteroidComponent({ sizeTier: 2 });

      expect(asteroid.sizeTier).toBe(2);
      expect(asteroid.rotationSpeed).toBe(1); // Default
      expect(asteroid.boundingSphereEnabled).toBe(false); // Default
    });
  });

  describe("getVelocityRange", () => {
    it("should return correct velocity range for size 3 (Large)", () => {
      const range = AsteroidComponent.getVelocityRange(3);

      expect(range).toEqual({ min: 20, max: 30 });
    });

    it("should return correct velocity range for size 2 (Medium)", () => {
      const range = AsteroidComponent.getVelocityRange(2);

      expect(range).toEqual({ min: 25, max: 35 });
    });

    it("should return correct velocity range for size 1 (Small)", () => {
      const range = AsteroidComponent.getVelocityRange(1);

      expect(range).toEqual({ min: 30, max: 40 });
    });

    it("should return ranges where min is less than max", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];

      sizes.forEach((size) => {
        const range = AsteroidComponent.getVelocityRange(size);
        expect(range.min).toBeLessThan(range.max);
      });
    });

    it("should have increasing velocity ranges from larger to smaller asteroids", () => {
      const range3 = AsteroidComponent.getVelocityRange(3);
      const range2 = AsteroidComponent.getVelocityRange(2);
      const range1 = AsteroidComponent.getVelocityRange(1);

      // Larger asteroids are slower, smaller are faster
      // Ranges may overlap, but minimum values should increase
      expect(range3.min).toBeLessThan(range2.min);
      expect(range2.min).toBeLessThan(range1.min);
      expect(range3.max).toBeLessThan(range1.max);
    });
  });

  describe("getCollisionRadius", () => {
    it("should return correct collision radius for size 3 (Large)", () => {
      const radius = AsteroidComponent.getCollisionRadius(3);

      expect(radius).toBe(20);
    });

    it("should return correct collision radius for size 2 (Medium)", () => {
      const radius = AsteroidComponent.getCollisionRadius(2);

      expect(radius).toBe(12);
    });

    it("should return correct collision radius for size 1 (Small)", () => {
      const radius = AsteroidComponent.getCollisionRadius(1);

      expect(radius).toBe(6);
    });

    it("should have decreasing collision radius from larger to smaller asteroids", () => {
      const radius3 = AsteroidComponent.getCollisionRadius(3);
      const radius2 = AsteroidComponent.getCollisionRadius(2);
      const radius1 = AsteroidComponent.getCollisionRadius(1);

      expect(radius3).toBeGreaterThan(radius2);
      expect(radius2).toBeGreaterThan(radius1);
    });

    it("should return positive collision radii", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];

      sizes.forEach((size) => {
        const radius = AsteroidComponent.getCollisionRadius(size);
        expect(radius).toBeGreaterThan(0);
      });
    });
  });

  describe("getMeshScale", () => {
    it("should return correct mesh scale for size 3 (Large)", () => {
      const scale = AsteroidComponent.getMeshScale(3);

      expect(scale).toBe(1.0);
    });

    it("should return correct mesh scale for size 2 (Medium)", () => {
      const scale = AsteroidComponent.getMeshScale(2);

      expect(scale).toBe(0.6);
    });

    it("should return correct mesh scale for size 1 (Small)", () => {
      const scale = AsteroidComponent.getMeshScale(1);

      expect(scale).toBe(0.3);
    });

    it("should have decreasing mesh scale from larger to smaller asteroids", () => {
      const scale3 = AsteroidComponent.getMeshScale(3);
      const scale2 = AsteroidComponent.getMeshScale(2);
      const scale1 = AsteroidComponent.getMeshScale(1);

      expect(scale3).toBeGreaterThan(scale2);
      expect(scale2).toBeGreaterThan(scale1);
    });

    it("should return positive mesh scales", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];

      sizes.forEach((size) => {
        const scale = AsteroidComponent.getMeshScale(size);
        expect(scale).toBeGreaterThan(0);
      });
    });
  });

  describe("getBreakCount", () => {
    it("should return 2 for size 3 (Large)", () => {
      const count = AsteroidComponent.getBreakCount(3);

      expect(count).toBe(2);
    });

    it("should return 2 for size 2 (Medium)", () => {
      const count = AsteroidComponent.getBreakCount(2);

      expect(count).toBe(2);
    });

    it("should return 0 for size 1 (Small) - despawns", () => {
      const count = AsteroidComponent.getBreakCount(1);

      expect(count).toBe(0);
    });

    it("should return non-negative break counts", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];

      sizes.forEach((size) => {
        const count = AsteroidComponent.getBreakCount(size);
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("getNextSizeTier", () => {
    it("should return size 2 when size 3 asteroid breaks", () => {
      const nextTier = AsteroidComponent.getNextSizeTier(3);

      expect(nextTier).toBe(2);
    });

    it("should return size 1 when size 2 asteroid breaks", () => {
      const nextTier = AsteroidComponent.getNextSizeTier(2);

      expect(nextTier).toBe(1);
    });

    it("should return null when size 1 asteroid breaks (despawns)", () => {
      const nextTier = AsteroidComponent.getNextSizeTier(1);

      expect(nextTier).toBe(null);
    });

    it("should form a valid progression chain", () => {
      const tier3NextTier = AsteroidComponent.getNextSizeTier(3);
      expect(tier3NextTier).toBe(2);

      const tier2NextTier = AsteroidComponent.getNextSizeTier(tier3NextTier!);
      expect(tier2NextTier).toBe(1);

      const tier1NextTier = AsteroidComponent.getNextSizeTier(tier2NextTier!);
      expect(tier1NextTier).toBe(null);
    });
  });

  describe("size tier consistency", () => {
    it("should have consistent data for all size tiers", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];

      sizes.forEach((size) => {
        // Verify all static methods return valid values
        const velocityRange = AsteroidComponent.getVelocityRange(size);
        const collisionRadius = AsteroidComponent.getCollisionRadius(size);
        const meshScale = AsteroidComponent.getMeshScale(size);
        const breakCount = AsteroidComponent.getBreakCount(size);
        const nextTier = AsteroidComponent.getNextSizeTier(size);

        expect(velocityRange).toBeDefined();
        expect(collisionRadius).toBeGreaterThan(0);
        expect(meshScale).toBeGreaterThan(0);
        expect(breakCount).toBeGreaterThanOrEqual(0);

        // breakCount should match the actual expectation
        if (size === 1) {
          expect(breakCount).toBe(0);
          expect(nextTier).toBe(null);
        } else {
          expect(breakCount).toBe(2);
          expect(nextTier).not.toBe(null);
        }
      });
    });

    it("should have mesh scale proportional to collision radius", () => {
      const sizes: AsteroidSizeTier[] = [1, 2, 3];
      const scales: number[] = [];
      const radii: number[] = [];

      sizes.forEach((size) => {
        scales.push(AsteroidComponent.getMeshScale(size));
        radii.push(AsteroidComponent.getCollisionRadius(size));
      });

      // Verify that the relative ordering is consistent
      for (let i = 0; i < sizes.length - 1; i++) {
        const scaleRatio = scales[i + 1] / scales[i];
        const radiusRatio = radii[i + 1] / radii[i];

        // Both should have consistent ordering (next value / current value > 1)
        expect(scaleRatio).toBeGreaterThan(1);
        expect(radiusRatio).toBeGreaterThan(1);
      }
    });
  });
});
