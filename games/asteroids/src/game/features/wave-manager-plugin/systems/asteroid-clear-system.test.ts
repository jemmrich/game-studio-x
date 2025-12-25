import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";
import { AsteroidClearSystem } from "./asteroid-clear-system.ts";

describe("AsteroidClearSystem", () => {
  let world: World;
  let asteroidClearSystem: AsteroidClearSystem;

  beforeEach(() => {
    world = new World();
    asteroidClearSystem = new AsteroidClearSystem();
    asteroidClearSystem.setup(world);
  });

  describe("wave completion cleanup", () => {
    it("should destroy all asteroids when wave_complete event is received", () => {
      // Create some asteroids
      const asteroid1 = world.createEntity();
      const asteroid2 = world.createEntity();
      const asteroid3 = world.createEntity();

      world.add(asteroid1, new AsteroidComponent({ sizeTier: 3, rotationSpeed: 1, boundingSphereEnabled: false }));
      world.add(asteroid2, new AsteroidComponent({ sizeTier: 2, rotationSpeed: 1, boundingSphereEnabled: false }));
      world.add(asteroid3, new AsteroidComponent({ sizeTier: 1, rotationSpeed: 1, boundingSphereEnabled: false }));

      // Verify asteroids exist
      const beforeCount = world.query(AsteroidComponent).entities().length;
      expect(beforeCount).toBe(3);

      // Emit wave_complete event
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 10,
        aliensDestroyed: 0,
        waveDuration: 30,
        waveStartTime: 0,
      });

      // Run the system to process the event
      asteroidClearSystem.update();

      // Verify all asteroids are destroyed
      const afterCount = world.query(AsteroidComponent).entities().length;
      expect(afterCount).toBe(0);
    });

    it("should handle case where no asteroids exist", () => {
      // Emit wave_complete with no asteroids
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 10,
        aliensDestroyed: 0,
        waveDuration: 30,
        waveStartTime: 0,
      });

      // Run the system - should not error
      expect(() => asteroidClearSystem.update()).not.toThrow();
    });

    it("should only destroy asteroids, not other entities", () => {
      // Create an asteroid
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent({ sizeTier: 3, rotationSpeed: 1, boundingSphereEnabled: false }));

      // Create some non-asteroid entity
      const otherEntity = world.createEntity();

      // Verify initial state
      expect(world.query(AsteroidComponent).entities().length).toBe(1);
      expect(world.entityExists(otherEntity)).toBe(true);

      // Emit wave_complete event
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 10,
        aliensDestroyed: 0,
        waveDuration: 30,
        waveStartTime: 0,
      });

      // Run the system
      asteroidClearSystem.update();

      // Verify asteroid is destroyed but other entity is not
      expect(world.query(AsteroidComponent).entities().length).toBe(0);
      expect(world.entityExists(otherEntity)).toBe(true);
    });
  });
});
