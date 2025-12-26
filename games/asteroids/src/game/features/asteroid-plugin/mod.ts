/**
 * Asteroid Plugin
 * Provides components, systems, and factories for asteroid entities in the Asteroids game.
 */

export * from "./components/mod.ts";
export * from "./systems/mod.ts";
export * from "./factories/mod.ts";

import type { World } from "@engine/core/world.ts";
import { AsteroidMovementSystem } from "./systems/asteroid-movement-system.ts";
import { AsteroidCollisionSystem } from "./systems/asteroid-collision-system.ts";
import { AsteroidDestructionSystem } from "./systems/asteroid-destruction-system.ts";
import { AsteroidSpawningSystem } from "./systems/asteroid-spawning-system.ts";
import { AsteroidFadeInSystem } from "./systems/asteroid-fade-in-system.ts";

// Track whether the asteroid plugin has been installed to prevent duplicate systems
let asteroidPluginInstalled = false;
// Store references to systems for reuse on subsequent installs
let cachedSystems: {
  movementSystem: AsteroidMovementSystem;
  collisionSystem: AsteroidCollisionSystem;
  destructionSystem: AsteroidDestructionSystem;
  spawningSystem: AsteroidSpawningSystem;
  fadeInSystem: AsteroidFadeInSystem;
} | null = null;

/**
 * Install the Asteroid Plugin
 * Sets up all systems needed for asteroid movement, collision, and destruction
 * 
 * NOTE: The plugin is designed to be installed once globally on the World, not per-scene.
 * Subsequent calls will return the existing systems without adding duplicates.
 * 
 * The reason for this design:
 * - TitleScene needs the movement and collision systems to animate asteroids
 * - GameplayScene needs the same systems plus destruction and spawning for gameplay
 * - Since World is shared across scenes, we only install once to avoid duplicate systems
 * - Scene cleanup via dispose() removes scene-specific entities (title asteroids) without affecting game systems
 */
export function installAsteroidPlugin(world: World): {
  movementSystem: AsteroidMovementSystem;
  collisionSystem: AsteroidCollisionSystem;
  destructionSystem: AsteroidDestructionSystem;
  fadeInSystem: AsteroidFadeInSystem;
} {
  // If already installed, return the cached systems without creating duplicates
  if (asteroidPluginInstalled && cachedSystems) {
    return cachedSystems;
  }

  const asteroidMovementSystem = new AsteroidMovementSystem();
  const asteroidCollisionSystem = new AsteroidCollisionSystem();
  const asteroidDestructionSystem = new AsteroidDestructionSystem();
  const asteroidSpawningSystem = new AsteroidSpawningSystem();
  const asteroidFadeInSystem = new AsteroidFadeInSystem(1000); // 1 second fade-in

  // Add movement system early
  world.addSystem(asteroidMovementSystem);
  // Add fade-in system to handle asteroid opacity animation
  world.addSystem(asteroidFadeInSystem);
  // NOTE: AsteroidCollisionSystem will be added later by scenes in the correct order
  // to ensure it runs AFTER MissileCollisionSystem
  // AsteroidDestructionSystem and AsteroidSpawningSystem are NOT added here
  // They will be added after CollisionHandlingSystem in the correct order

  asteroidPluginInstalled = true;
  cachedSystems = {
    movementSystem: asteroidMovementSystem,
    collisionSystem: asteroidCollisionSystem,
    destructionSystem: asteroidDestructionSystem,
    spawningSystem: asteroidSpawningSystem,
    fadeInSystem: asteroidFadeInSystem,
  };

  // Setup event listeners for fade-in system
  asteroidFadeInSystem.setup(world);

  // Return all systems so they can be added in the correct order in gameplay scene
  return cachedSystems;
}
