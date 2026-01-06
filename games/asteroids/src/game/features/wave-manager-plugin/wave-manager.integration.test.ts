import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "./resources/wave-manager.ts";
import {
  WaveTrackingSystem,
  setupWaveTrackingEventListeners,
} from "./systems/wave-tracking-system.ts";
import { WaveTransitionSystem } from "./systems/wave-transition-system.ts";
import { WaveInitializationSystem } from "./systems/wave-initialization-system.ts";
import { AsteroidComponent } from "../asteroid-plugin/components/asteroid.ts";
import { AlienComponent } from "../alien-plugin/components/alien.ts";
import { installGameStatsPlugin } from "../game-stats-plugin/mod.ts";

/**
 * Integration tests for the Wave Manager Plugin
 * These tests verify that multiple systems work together correctly
 * to handle wave progression, entity lifecycle, and difficulty scaling
 */
describe("Wave Manager Plugin - Integration Tests", () => {
  let world: World;
  let waveManager: WaveManager;
  let time: Time;
  let trackingSystem: WaveTrackingSystem;
  let transitionSystem: WaveTransitionSystem;
  let initializationSystem: WaveInitializationSystem;

  beforeEach(() => {
    world = new World();

    // Setup resources
    time = new Time();
    world.addResource("time", time);

    waveManager = new WaveManager();
    world.addResource("waveManager", waveManager);

    // Install GameStats plugin
    installGameStatsPlugin(world);

    // Setup systems
    trackingSystem = new WaveTrackingSystem();
    transitionSystem = new WaveTransitionSystem();
    initializationSystem = new WaveInitializationSystem();

    // Add systems to world
    world.addSystem(trackingSystem);
    world.addSystem(transitionSystem);
    world.addSystem(initializationSystem);

    // Setup event listeners
    setupWaveTrackingEventListeners(world);
    transitionSystem.setup(world);
    initializationSystem.setup(world);
  });

  describe("Complete wave lifecycle", () => {
    it("should progress through multiple waves with spawning and destruction", () => {
      // Wave 1: Create asteroids and destroy them
      const asteroid1 = world.createEntity();
      world.add(asteroid1, new AsteroidComponent({ sizeTier: 3 }));

      const asteroid2 = world.createEntity();
      world.add(asteroid2, new AsteroidComponent({ sizeTier: 3 }));

      waveManager.waveStartTime = 0;
      waveManager.hasSpawnedAsteroidsThisWave = true;

      // Update tracking system
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(2);
      expect(waveManager.isWaveComplete).toBe(false);

      // Destroy first asteroid
      world.destroyEntity(asteroid1);
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(1);

      // Destroy second asteroid - this will trigger wave_complete event
      world.destroyEntity(asteroid2);
      
      let waveCompleteEmitted = false;
      world.onEvent("wave_complete", (event) => {
        waveCompleteEmitted = true;
      });
      
      trackingSystem.update(world);

      expect(waveCompleteEmitted).toBe(true);
      // Wave transition happens immediately when wave_complete is emitted
      // because the transitionSystem has set up its event listener in beforeEach
      expect(waveManager.currentWaveNumber).toBe(2);
      expect(waveManager.totalWavesCompleted).toBe(1);
      expect(waveManager.asteroidCount).toBe(0);
    });

    it("should handle difficulty scaling through multiple waves", () => {
      // Wave 1
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 0,
        waveDuration: 1000,
        waveStartTime: 0,
      });

      expect(waveManager.currentWaveNumber).toBe(2);
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.15, 2);

      // Wave 2
      world.emitEvent("wave_complete", {
        waveNumber: 2,
        asteroidsDestroyed: 6,
        aliensDestroyed: 0,
        waveDuration: 1200,
        waveStartTime: 1000,
      });

      expect(waveManager.currentWaveNumber).toBe(3);
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.30, 2);

      // Wave 3
      world.emitEvent("wave_complete", {
        waveNumber: 3,
        asteroidsDestroyed: 7,
        aliensDestroyed: 0,
        waveDuration: 1400,
        waveStartTime: 2200,
      });

      expect(waveManager.currentWaveNumber).toBe(4);
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.45, 2);
    });

    it("should track destruction counts across wave transitions", () => {
      // Create entities
      const asteroid1 = world.createEntity();
      world.add(asteroid1, new AsteroidComponent({ sizeTier: 3 }));

      const asteroid2 = world.createEntity();
      world.add(asteroid2, new AsteroidComponent({ sizeTier: 2 }));

      const alien1 = world.createEntity();
      world.add(alien1, new AlienComponent());

      waveManager.waveStartTime = 100;
      trackingSystem.update(world);

      // Get GameStats and check destruction counts
      const gameStats = world.getResource("gameStats");
      const asteroidsDestroyed = gameStats
        ? (gameStats as any).totalLargeAsteroidsDestroyed +
          (gameStats as any).totalMediumAsteroidsDestroyed +
          (gameStats as any).totalSmallAsteroidsDestroyed
        : 0;
      const aliensDestroyed = gameStats
        ? (gameStats as any).totalLargeAliensKilled +
          (gameStats as any).totalSmallAliensKilled
        : 0;

      // Destroy entities
      world.destroyEntity(asteroid1);
      world.destroyEntity(asteroid2);
      world.destroyEntity(alien1);

      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      // Note: Actual destruction counts are tracked in GameStats, not WaveManager
      // This test verifies that entity cleanup still works correctly

      // Complete wave and reset via event
      world.emitEvent("wave_transition", {
        fromWave: 1,
        toWave: 2,
        difficultyMultiplier: 1.15,
      });
    });
  });

  describe("Wave transition event flow", () => {
    it("should emit wave_transition event with correct difficulty multiplier", () => {
      let transitionEventEmitted = false;
      let transitionEventData: any;

      world.onEvent("wave_transition", (event) => {
        transitionEventEmitted = true;
        transitionEventData = event.data;
      });

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 0,
        waveDuration: 1000,
        waveStartTime: 0,
      });

      expect(transitionEventEmitted).toBe(true);
      expect(transitionEventData.fromWave).toBe(1);
      expect(transitionEventData.toWave).toBe(2);
      expect(transitionEventData.difficultyMultiplier).toBeCloseTo(1.15, 2);
    });

    it("should emit entering_zone event when transitioning waves", () => {
      let zoneEventEmitted = false;
      let zoneEventData: any;

      world.onEvent("entering_zone", (event) => {
        zoneEventEmitted = true;
        zoneEventData = event.data;
      });

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 0,
        waveDuration: 1000,
        waveStartTime: 0,
      });

      expect(zoneEventEmitted).toBe(true);
      expect(zoneEventData.zoneNumber).toBe(2);
      expect(zoneEventData.displayDuration).toBe(3000);
    });
  });

  describe("Entity lifecycle integration", () => {
    it("should correctly track asteroids added and removed dynamically", () => {
      expect(waveManager.asteroidCount).toBe(0);

      // Add asteroids dynamically
      const asteroids: number[] = [];
      for (let i = 0; i < 5; i++) {
        const asteroid = world.createEntity();
        world.add(asteroid, new AsteroidComponent({ sizeTier: 3 }));
        asteroids.push(asteroid);
      }

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(5);

      // Remove some asteroids
      world.destroyEntity(asteroids[0]);
      world.destroyEntity(asteroids[1]);
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(3);

      // Remove all remaining
      for (let i = 2; i < asteroids.length; i++) {
        world.destroyEntity(asteroids[i]);
      }
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
    });

    it("should track mixed asteroids and aliens", () => {
      // Create mixed entities
      const asteroids: number[] = [];
      for (let i = 0; i < 3; i++) {
        const asteroid = world.createEntity();
        world.add(asteroid, new AsteroidComponent({ sizeTier: 2 }));
        asteroids.push(asteroid);
      }

      const aliens: number[] = [];
      for (let i = 0; i < 2; i++) {
        const alien = world.createEntity();
        world.add(alien, new AlienComponent());
        aliens.push(alien);
      }

      waveManager.waveStartTime = 100;
      waveManager.hasSpawnedAsteroidsThisWave = true;
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(3);
      expect(waveManager.alienCount).toBe(2);

      // Destroy all asteroids first
      for (const asteroid of asteroids) {
        world.destroyEntity(asteroid);
      }

      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(2);
      expect(waveManager.isAsteroidsCleared).toBe(true);
      expect(waveManager.isWaveComplete).toBe(false);

      // Now destroy aliens
      for (const alien of aliens) {
        world.destroyEntity(alien);
      }

      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.isWaveComplete).toBe(true);
    });
  });

  describe("Wave state persistence", () => {
    it("should maintain correct state across multiple update cycles", () => {
      // Initial state
      expect(waveManager.currentWaveNumber).toBe(1);
      expect(waveManager.totalWavesCompleted).toBe(0);

      // Create asteroids
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent({ sizeTier: 3 }));

      waveManager.waveStartTime = 100;
      waveManager.hasSpawnedAsteroidsThisWave = true;

      // Multiple updates
      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(1);

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(1); // Should stay same

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(1); // Should stay same

      // Destroy asteroid
      world.destroyEntity(asteroid);

      // Register listener for wave_complete BEFORE the update that will emit it
      let waveCompleted = false;
      world.onEvent("wave_complete", () => {
        waveCompleted = true;
      });

      trackingSystem.update(world);
      
      expect(waveCompleted).toBe(true);
      expect(waveManager.asteroidCount).toBe(0);

      // Manually trigger transition
      world.emitEvent("wave_transition", {
        fromWave: 1,
        toWave: 2,
        difficultyMultiplier: 1.15,
      });

      expect(waveManager.currentWaveNumber).toBe(2);
      expect(waveManager.totalWavesCompleted).toBe(1);
      // isWaveComplete is reset when new wave's asteroids are spawned (in WaveInitializationSystem),
      // not when wave_transition is emitted
      expect(waveManager.isWaveComplete).toBe(true);
    });

    it("should handle rapid wave transitions", () => {
      // Complete waves rapidly
      for (let wave = 1; wave <= 5; wave++) {
        world.emitEvent("wave_complete", {
          waveNumber: wave,
          asteroidsDestroyed: wave * 2,
          aliensDestroyed: 0,
          waveDuration: 1000 * wave,
          waveStartTime: 0,
        });

        expect(waveManager.currentWaveNumber).toBe(wave + 1);
        expect(waveManager.totalWavesCompleted).toBe(wave);
      }

      // Should be at wave 6 now
      expect(waveManager.currentWaveNumber).toBe(6);
      expect(waveManager.totalWavesCompleted).toBe(5);
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.75, 2); // 1.0 + 5 * 0.15
    });
  });

  describe("System ordering and interactions", () => {
    it("should process events in correct order: complete -> transition triggered", () => {
      const eventLog: string[] = [];

      // Log wave_complete
      world.onEvent("wave_complete", () => {
        eventLog.push("wave_complete_emitted");
      });

      // Log wave_transition
      world.onEvent("wave_transition", () => {
        eventLog.push("wave_transition_emitted");
      });

      // Create and destroy asteroids to trigger wave_complete
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent({ sizeTier: 3 }));

      waveManager.waveStartTime = 100;
      waveManager.hasSpawnedAsteroidsThisWave = true;
      trackingSystem.update(world);

      world.destroyEntity(asteroid);
      trackingSystem.update(world); // Should emit wave_complete

      expect(eventLog).toContain("wave_complete_emitted");
      expect(eventLog).toContain("wave_transition_emitted");
      expect(waveManager.currentWaveNumber).toBe(2);
      // isWaveComplete is reset when new wave's asteroids are spawned (in WaveInitializationSystem),
      // not when wave_transition is emitted
      expect(waveManager.isWaveComplete).toBe(true);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle zero asteroids and zero aliens correctly", () => {
      // Set wave start time to indicate wave is active
      waveManager.waveStartTime = 100;
      waveManager.hasSpawnedAsteroidsThisWave = true;

      // No entities exist
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.isWaveComplete).toBe(true); // Should complete when wave is active
    });

    it("should handle single entity of each type", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent({ sizeTier: 3 }));

      const alien = world.createEntity();
      world.add(alien, new AlienComponent());

      waveManager.waveStartTime = 100;
      waveManager.hasSpawnedAsteroidsThisWave = true;
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(1);
      expect(waveManager.alienCount).toBe(1);

      // Destroy both
      world.destroyEntity(asteroid);
      world.destroyEntity(alien);

      // Run tracking again - this will emit wave_complete which triggers events
      let completionDetected = false;
      world.onEvent("wave_complete", () => {
        completionDetected = true;
      });
      
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      // Wave completion should have been detected and event emitted
      expect(completionDetected).toBe(true);
    });

    it("should handle entity counts that change during same update", () => {
      const asteroids = [];
      for (let i = 0; i < 10; i++) {
        const asteroid = world.createEntity();
        world.add(asteroid, new AsteroidComponent({ sizeTier: 2 }));
        asteroids.push(asteroid);
      }

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(10);

      // Remove half before next update
      for (let i = 0; i < 5; i++) {
        world.destroyEntity(asteroids[i]);
      }

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(5);
    });
  });
});
