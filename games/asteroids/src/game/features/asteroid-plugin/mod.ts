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

/**
 * Install the Asteroid Plugin
 * Sets up all systems needed for asteroid movement, collision, and destruction
 */
export function installAsteroidPlugin(world: World): void {
  const asteroidMovementSystem = new AsteroidMovementSystem();
  const asteroidCollisionSystem = new AsteroidCollisionSystem();
  const asteroidDestructionSystem = new AsteroidDestructionSystem();
  const asteroidSpawningSystem = new AsteroidSpawningSystem();

  world.addSystem(asteroidMovementSystem);
  world.addSystem(asteroidCollisionSystem);
  world.addSystem(asteroidDestructionSystem);
  world.addSystem(asteroidSpawningSystem);
}
