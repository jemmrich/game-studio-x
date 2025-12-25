import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "./resources/wave-manager.ts";
import {
  WaveTrackingSystem,
  setupWaveTrackingEventListeners,
} from "./systems/wave-tracking-system.ts";
import { WaveTransitionSystem } from "./systems/wave-transition-system.ts";
import { AsteroidComponent } from "../asteroid-plugin/components/asteroid.ts";
import { AlienComponent } from "../alien-plugin/components/alien.ts";
import { calculateDifficultyMultiplier } from "../../../shared/config.ts";

// Force TypeScript to recognize imports even if they seem unused

describe("WaveManager Resource", () => {
  let waveManager: WaveManager;

  beforeEach(() => {
    waveManager = new WaveManager();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      expect(waveManager.currentWaveNumber).toBe(1);
      expect(waveManager.totalWavesCompleted).toBe(0);
      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.asteroidsDestroyedThisWave).toBe(0);
      expect(waveManager.aliensDestroyedThisWave).toBe(0);
      expect(waveManager.isWaveComplete).toBe(false);
      expect(waveManager.isAsteroidsCleared).toBe(false);
      expect(waveManager.difficultyMultiplier).toBe(1.0);
    });

    it("should initialize with custom wave number", () => {
      const wm = new WaveManager({ startingWaveNumber: 3 });
      expect(wm.currentWaveNumber).toBe(3);
      expect(wm.totalWavesCompleted).toBe(2);
    });

    it("should initialize with custom difficulty multiplier", () => {
      const wm = new WaveManager({ startingDifficultyMultiplier: 1.5 });
      expect(wm.difficultyMultiplier).toBe(1.5);
    });
  });

  describe("entity count tracking", () => {
    it("should track asteroid count", () => {
      waveManager.asteroidCount = 5;
      expect(waveManager.asteroidCount).toBe(5);
    });

    it("should track alien count", () => {
      waveManager.alienCount = 1;
      expect(waveManager.alienCount).toBe(1);
    });

    it("should record asteroid destruction", () => {
      waveManager.recordAsteroidDestroyed();
      expect(waveManager.asteroidsDestroyedThisWave).toBe(1);

      waveManager.recordAsteroidDestroyed();
      expect(waveManager.asteroidsDestroyedThisWave).toBe(2);
    });

    it("should record alien destruction", () => {
      waveManager.recordAlienDestroyed();
      expect(waveManager.aliensDestroyedThisWave).toBe(1);

      waveManager.recordAlienDestroyed();
      expect(waveManager.aliensDestroyedThisWave).toBe(2);
    });
  });

  describe("wave reset", () => {
    it("should reset counts for new wave", () => {
      waveManager.asteroidCount = 5;
      waveManager.alienCount = 1;
      waveManager.asteroidsDestroyedThisWave = 3;
      waveManager.aliensDestroyedThisWave = 1;
      waveManager.isWaveComplete = true;
      waveManager.isAsteroidsCleared = true;

      waveManager.resetForNewWave(1000);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.asteroidsDestroyedThisWave).toBe(0);
      expect(waveManager.aliensDestroyedThisWave).toBe(0);
      expect(waveManager.isWaveComplete).toBe(false);
      expect(waveManager.isAsteroidsCleared).toBe(false);
      expect(waveManager.waveStartTime).toBe(1000);
    });
  });
});

describe("WaveTrackingSystem", () => {
  let world: World;
  let waveManager: WaveManager;
  let trackingSystem: WaveTrackingSystem;

  beforeEach(() => {
    world = new World();

    // Setup resources
    const time = new Time();
    world.addResource("time", time);

    waveManager = new WaveManager();
    world.addResource("waveManager", waveManager);

    trackingSystem = new WaveTrackingSystem();
    setupWaveTrackingEventListeners(world);
  });

  describe("entity counting", () => {
    it("should count asteroids via query", () => {
      const asteroid1 = world.createEntity();
      world.add(asteroid1, new AsteroidComponent({ sizeTier: 1 }));

      const asteroid2 = world.createEntity();
      world.add(asteroid2, new AsteroidComponent({ sizeTier: 2 }));

      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(2);
    });

    it("should count aliens via query", () => {
      const alien1 = world.createEntity();
      world.add(alien1, new AlienComponent());

      trackingSystem.update(world);

      expect(waveManager.alienCount).toBe(1);
    });

    it("should count both asteroids and aliens", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      const alien = world.createEntity();
      world.add(alien, new AlienComponent());

      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(1);
      expect(waveManager.alienCount).toBe(1);
    });

    it("should update counts when entities are destroyed", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(1);

      world.destroyEntity(asteroid);
      trackingSystem.update(world);
      expect(waveManager.asteroidCount).toBe(0);
    });
  });

  describe("interim state detection", () => {
    it("should detect when asteroids are cleared", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      waveManager.waveStartTime = 0;
      trackingSystem.update(world);

      expect(waveManager.isAsteroidsCleared).toBe(false);

      world.destroyEntity(asteroid);
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.isAsteroidsCleared).toBe(true);
    });

    it("should not re-emit asteroids cleared multiple times", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      waveManager.waveStartTime = 0;
      trackingSystem.update(world);
      world.destroyEntity(asteroid);

      trackingSystem.update(world);
      expect(waveManager.isAsteroidsCleared).toBe(true);

      trackingSystem.update(world);
      expect(waveManager.isAsteroidsCleared).toBe(true);
    });
  });

  describe("wave completion detection", () => {
    it("should detect wave completion when no asteroids and no aliens", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      const alien = world.createEntity();
      world.add(alien, new AlienComponent());

      waveManager.waveStartTime = 0;
      trackingSystem.update(world);

      expect(waveManager.isWaveComplete).toBe(false);

      world.destroyEntity(asteroid);
      world.destroyEntity(alien);
      trackingSystem.update(world);

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.isWaveComplete).toBe(true);
    });

    it("should not detect completion with only asteroids cleared", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      const alien = world.createEntity();
      world.add(alien, new AlienComponent());

      waveManager.waveStartTime = 0;
      trackingSystem.update(world);
      world.destroyEntity(asteroid);
      trackingSystem.update(world);

      expect(waveManager.isAsteroidsCleared).toBe(true);
      expect(waveManager.isWaveComplete).toBe(false);
    });

    it("should emit wave_complete event", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      let eventEmitted = false;
      let eventData: any;

      world.onEvent("wave_complete", (event) => {
        eventEmitted = true;
        eventData = event.data;
      });

      waveManager.waveStartTime = 100;
      waveManager.asteroidsDestroyedThisWave = 3;
      waveManager.aliensDestroyedThisWave = 1;

      trackingSystem.update(world);
      world.destroyEntity(asteroid);
      trackingSystem.update(world);

      expect(eventEmitted).toBe(true);
      expect(eventData.waveNumber).toBe(1);
      expect(eventData.asteroidsDestroyed).toBe(3);
      expect(eventData.aliensDestroyed).toBe(1);
      expect(eventData.waveStartTime).toBe(100);
    });

    it("should not re-emit wave_complete multiple times", () => {
      const asteroid = world.createEntity();
      world.add(asteroid, new AsteroidComponent());

      let emitCount = 0;

      world.onEvent("wave_complete", () => {
        emitCount++;
      });

      waveManager.waveStartTime = 0;
      trackingSystem.update(world);
      world.destroyEntity(asteroid);

      trackingSystem.update(world);
      expect(emitCount).toBe(1);

      trackingSystem.update(world);
      expect(emitCount).toBe(1);
    });
  });

  describe("wave transition reset", () => {
    it("should reset counts when wave_transition event is emitted", () => {
      waveManager.asteroidCount = 5;
      waveManager.alienCount = 1;
      waveManager.asteroidsDestroyedThisWave = 3;
      waveManager.aliensDestroyedThisWave = 1;
      waveManager.isWaveComplete = true;
      waveManager.isAsteroidsCleared = true;

      world.emitEvent("wave_transition", {
        fromWave: 1,
        toWave: 2,
        difficultyMultiplier: 1.15,
      });

      expect(waveManager.asteroidCount).toBe(0);
      expect(waveManager.alienCount).toBe(0);
      expect(waveManager.asteroidsDestroyedThisWave).toBe(0);
      expect(waveManager.aliensDestroyedThisWave).toBe(0);
      expect(waveManager.isWaveComplete).toBe(false);
      expect(waveManager.isAsteroidsCleared).toBe(false);
    });
  });
});

describe("WaveTransitionSystem", () => {
  let world: World;
  let waveManager: WaveManager;
  let transitionSystem: WaveTransitionSystem;

  beforeEach(() => {
    world = new World();

    const time = new Time();
    world.addResource("time", time);

    waveManager = new WaveManager();
    world.addResource("waveManager", waveManager);

    transitionSystem = new WaveTransitionSystem();
    transitionSystem.setup(world);
  });

  describe("wave progression", () => {
    it("should increment wave number on wave_complete", () => {
      expect(waveManager.currentWaveNumber).toBe(1);

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      expect(waveManager.currentWaveNumber).toBe(2);
    });

    it("should increment total waves completed", () => {
      expect(waveManager.totalWavesCompleted).toBe(0);

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      expect(waveManager.totalWavesCompleted).toBe(1);

      world.emitEvent("wave_complete", {
        waveNumber: 2,
        asteroidsDestroyed: 6,
        aliensDestroyed: 1,
        waveDuration: 50000,
      });

      expect(waveManager.totalWavesCompleted).toBe(2);
    });
  });

  describe("difficulty calculation", () => {
    it("should calculate correct difficulty for wave 1", () => {
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      // Wave 2 should have 1.15x difficulty
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.15, 2);
    });

    it("should calculate correct difficulty for wave 2", () => {
      // Simulate moving to wave 2
      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      // Wave 3 should have 1.30x difficulty
      world.emitEvent("wave_complete", {
        waveNumber: 2,
        asteroidsDestroyed: 6,
        aliensDestroyed: 1,
        waveDuration: 50000,
      });

      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.30, 2);
    });

    it("should calculate correct difficulty for wave 5", () => {
      waveManager.currentWaveNumber = 5;
      world.emitEvent("wave_complete", {
        waveNumber: 5,
        asteroidsDestroyed: 8,
        aliensDestroyed: 1,
        waveDuration: 60000,
      });

      // Wave 6 should have 1.75x difficulty
      expect(waveManager.difficultyMultiplier).toBeCloseTo(1.75, 2);
    });
  });

  describe("wave transition events", () => {
    it("should emit wave_transition event with correct data", () => {
      let eventEmitted = false;
      let eventData: any;

      world.onEvent("wave_transition", (event) => {
        eventEmitted = true;
        eventData = event.data;
      });

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      expect(eventEmitted).toBe(true);
      expect(eventData.fromWave).toBe(1);
      expect(eventData.toWave).toBe(2);
      expect(eventData.difficultyMultiplier).toBeCloseTo(1.15, 2);
    });

    it("should emit entering_zone event with zone number", () => {
      let eventEmitted = false;
      let eventData: any;

      world.onEvent("entering_zone", (event) => {
        eventEmitted = true;
        eventData = event.data;
      });

      world.emitEvent("wave_complete", {
        waveNumber: 1,
        asteroidsDestroyed: 5,
        aliensDestroyed: 1,
        waveDuration: 45000,
      });

      expect(eventEmitted).toBe(true);
      expect(eventData.zoneNumber).toBe(2);
      expect(eventData.displayDuration).toBe(3000);
    });
  });
});

describe("Difficulty Calculation", () => {
  it("should calculate correct difficulty multipliers", () => {
    expect(calculateDifficultyMultiplier(1)).toBeCloseTo(1.0, 2);
    expect(calculateDifficultyMultiplier(2)).toBeCloseTo(1.15, 2);
    expect(calculateDifficultyMultiplier(3)).toBeCloseTo(1.3, 2);
    expect(calculateDifficultyMultiplier(5)).toBeCloseTo(1.6, 2);
    expect(calculateDifficultyMultiplier(10)).toBeCloseTo(2.35, 2);
  });

  it("should scale linearly per wave", () => {
    const wave1 = calculateDifficultyMultiplier(1);
    const wave2 = calculateDifficultyMultiplier(2);
    const wave3 = calculateDifficultyMultiplier(3);

    const diff1 = wave2 - wave1;
    const diff2 = wave3 - wave2;

    expect(diff1).toBeCloseTo(0.15, 2);
    expect(diff2).toBeCloseTo(0.15, 2);
  });
});
