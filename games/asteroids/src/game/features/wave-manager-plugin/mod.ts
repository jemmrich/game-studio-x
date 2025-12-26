import type { World } from "@engine/core/world.ts";

// Resources
export { WaveManager, type WaveManagerOptions } from "./resources/mod.ts";

// Systems
export {
  WaveTrackingSystem,
  WaveTransitionSystem,
  WaveInitializationSystem,
  InitialZoneEntrySystem,
  PlayerRespawnSystem,
  MissileClearSystem,
  AsteroidClearSystem,
  setupWaveTrackingEventListeners,
} from "./systems/mod.ts";

import { WaveManager } from "./resources/wave-manager.ts";
import {
  WaveTrackingSystem,
  WaveTransitionSystem,
  WaveInitializationSystem,
  InitialZoneEntrySystem,
  PlayerRespawnSystem,
  MissileClearSystem,
  AsteroidClearSystem,
  AsteroidDestructionTrackerSystem,
  setupWaveTrackingEventListeners,
} from "./systems/mod.ts";

/**
 * Install the Wave Manager Plugin
 * Sets up all systems needed for wave progression and management
 */
export function installWaveManagerPlugin(
  world: World,
): WaveManagerPluginContext {
  // Create and add WaveManager resource
  const waveManager = new WaveManager({
    initialDifficulty: 1.0,
    maxWaves: 10,
  });
  world.addResource("waveManager", waveManager);

  // Create and register systems
  const waveTrackingSystem = new WaveTrackingSystem();
  const waveTransitionSystem = new WaveTransitionSystem();
  const initialZoneEntrySystem = new InitialZoneEntrySystem();
  const waveInitializationSystem = new WaveInitializationSystem();
  const playerRespawnSystem = new PlayerRespawnSystem();
  const missileClearSystem = new MissileClearSystem();
  const asteroidClearSystem = new AsteroidClearSystem();
  const asteroidDestructionTrackerSystem = new AsteroidDestructionTrackerSystem();

  // Setup event listeners for wave tracking
  setupWaveTrackingEventListeners(world);

  // Setup event listeners for all event-driven systems
  waveTransitionSystem.setup(world);
  initialZoneEntrySystem.setup(world);  // Emit entering_zone for Wave 1
  asteroidClearSystem.setup(world);  // Must be before waveInitializationSystem to clear old asteroids before spawning new ones
  waveInitializationSystem.setup(world);
  playerRespawnSystem.setup(world);
  missileClearSystem.setup(world);
  asteroidDestructionTrackerSystem.setup(world);

  // Add frame-update systems
  world.addSystem(waveTrackingSystem);
  world.addSystem(waveTransitionSystem);

  // Add event-driven systems (they have setup() called above)
  world.addSystem(initialZoneEntrySystem);
  world.addSystem(asteroidClearSystem);
  world.addSystem(waveInitializationSystem);
  world.addSystem(playerRespawnSystem);
  world.addSystem(missileClearSystem);
  world.addSystem(asteroidDestructionTrackerSystem);

  return {
    waveTrackingSystem,
    waveTransitionSystem,
    initialZoneEntrySystem,
    waveInitializationSystem,
    playerRespawnSystem,
    missileClearSystem,
    asteroidClearSystem,
    asteroidDestructionTrackerSystem,
  };
}

/**
 * Context returned from installWaveManagerPlugin
 * Provides access to all wave management systems
 */
export interface WaveManagerPluginContext {
  waveTrackingSystem: WaveTrackingSystem;
  waveTransitionSystem: WaveTransitionSystem;
  initialZoneEntrySystem: InitialZoneEntrySystem;
  waveInitializationSystem: WaveInitializationSystem;
  playerRespawnSystem: PlayerRespawnSystem;
  missileClearSystem: MissileClearSystem;
  asteroidClearSystem: AsteroidClearSystem;
  asteroidDestructionTrackerSystem: AsteroidDestructionTrackerSystem;
}
