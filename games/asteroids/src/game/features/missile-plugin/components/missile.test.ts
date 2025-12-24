import { describe, it, expect } from "vitest";
import { MissileComponent } from "./missile.ts";

describe("MissileComponent", () => {
  describe("constructor", () => {
    it("should create a missile component with provided values", () => {
      const lifetime = 3.0;
      const speed = 100;
      const spawnerId = "player-ship-id" as unknown as any;

      const missile = new MissileComponent(lifetime, speed, spawnerId);

      expect(missile.lifetime).toBe(lifetime);
      expect(missile.speed).toBe(speed);
      expect(missile.spawnerId).toBe(spawnerId);
    });

    it("should store lifetime in seconds", () => {
      const missile = new MissileComponent(2.5, 50, "spawner-1" as unknown as any);
      expect(missile.lifetime).toBe(2.5);
    });

    it("should handle different speed values", () => {
      const missile1 = new MissileComponent(1, 50, "s1" as unknown as any);
      const missile2 = new MissileComponent(1, 150, "s2" as unknown as any);
      const missile3 = new MissileComponent(1, 200, "s3" as unknown as any);

      expect(missile1.speed).toBe(50);
      expect(missile2.speed).toBe(150);
      expect(missile3.speed).toBe(200);
    });

    it("should allow zero lifetime (instant destroy)", () => {
      const missile = new MissileComponent(0, 100, "spawner" as unknown as any);
      expect(missile.lifetime).toBe(0);
    });

    it("should allow negative speed (reverse direction)", () => {
      const missile = new MissileComponent(1, -100, "spawner" as unknown as any);
      expect(missile.speed).toBe(-100);
    });

    it("should preserve spawnerId reference", () => {
      const spawnerId = "specific-spawner-id" as unknown as any;
      const missile = new MissileComponent(1, 100, spawnerId);
      expect(missile.spawnerId).toBe(spawnerId);
    });
  });

  describe("component usage", () => {
    it("should be usable as a data container", () => {
      const missile = new MissileComponent(3.0, 100, "spawner" as unknown as any);

      // Simulate system behavior - modifying lifetime
      missile.lifetime -= 0.016; // 16ms delta
      expect(missile.lifetime).toBeLessThan(3.0);
      expect(missile.lifetime).toBeCloseTo(2.984, 3);
    });

    it("should track lifetime decay correctly", () => {
      const initialLifetime = 3.0;
      const missile = new MissileComponent(initialLifetime, 100, "spawner" as unknown as any);

      // Simulate multiple updates
      const deltaTime = 0.016; // 60 FPS
      for (let i = 0; i < 5; i++) {
        missile.lifetime -= deltaTime;
      }

      expect(missile.lifetime).toBeCloseTo(initialLifetime - deltaTime * 5, 5);
    });

    it("should be destroyed when lifetime reaches zero", () => {
      const missile = new MissileComponent(0.016, 100, "spawner" as unknown as any);
      missile.lifetime -= 0.016;
      expect(missile.lifetime).toBeLessThanOrEqual(0);
    });
  });
});
