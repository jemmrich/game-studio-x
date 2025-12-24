import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import {
  installShipPlugin,
  spawnPlayerShip,
  ShipRenderSystem,
  type ShipPluginContext,
} from "../features/ship-plugin/mod.ts";
import {
  installMissilePlugin,
  MissileRenderSystem,
} from "../features/missile-plugin/mod.ts";
import { spawnAsteroid, AsteroidRenderSystem, installAsteroidPlugin } from "../features/asteroid-plugin/mod.ts";
import * as THREE from "three";

export class GameplayScene extends BaseScene {
  private shipPluginContext: ShipPluginContext | null = null;
  private shipEntityId: GUID | null = null;
  private threeJsScene: THREE.Scene;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-main");
    this.threeJsScene = threeJsScene;
  }

  init(world: World): void {
    // Install the ship plugin (sets up ship control and movement systems)
    this.shipPluginContext = installShipPlugin(world);

    // Spawn the player ship
    this.shipEntityId = spawnPlayerShip(world);

    // Connect plugin systems to the spawned ship entity
    this.shipPluginContext.setShipEntityId(this.shipEntityId);

    // Install the missile plugin (sets up missile systems)
    installMissilePlugin(world);

    // Install the asteroid plugin (sets up asteroid systems)
    const { destructionSystem: asteroidDestructionSystem, spawningSystem: asteroidSpawningSystem } = installAsteroidPlugin(world);

    // Add collision handling LAST, so it processes events from detection systems
    world.addSystem(this.shipPluginContext.collisionHandlingSystem);

    // Add asteroid destruction system AFTER collision handling
    // This ensures destruction events from collisions are processed in the same frame
    world.addSystem(asteroidDestructionSystem);

    // Add asteroid spawning system AFTER destruction system
    // This ensures spawn events from destruction are processed in the same frame
    world.addSystem(asteroidSpawningSystem);

    // Spawn initial asteroids for testing (mix of sizes)
    // Game world bounds are approximately X[-130, 130] Y[-57, 57], leave margin for safe spawn
    const spawnPositions: Array<[number, number, number]> = [
      [-100, -40, 0],  // Top-left
      [100, -40, 0],   // Top-right
      [-100, 40, 0],   // Bottom-left
      [100, 40, 0],    // Bottom-right
      [0, -45, 0],     // Center-top
    ];

    // Spawn 5 large asteroids
    for (const position of spawnPositions) {
      spawnAsteroid(world, position, 3); // Size 3 = Large
    }

    // Spawn 3 medium asteroids for testing
    const mediumPositions: Array<[number, number, number]> = [
      [-70, -20, 0],
      [70, 20, 0],
      [0, 30, 0],
    ];
    for (const position of mediumPositions) {
      spawnAsteroid(world, position, 2); // Size 2 = Medium
    }

    // Spawn 2 small asteroids for testing
    const smallPositions: Array<[number, number, number]> = [
      [-50, 0, 0],
      [50, 0, 0],
    ];
    for (const position of smallPositions) {
      spawnAsteroid(world, position, 1); // Size 1 = Small
    }

    // Create and register Three.js rendering systems
    const shipRenderSystem = new ShipRenderSystem(this.threeJsScene);
    world.addSystem(shipRenderSystem);

    const missileRenderSystem = new MissileRenderSystem(this.threeJsScene);
    world.addSystem(missileRenderSystem);

    const asteroidRenderSystem = new AsteroidRenderSystem(this.threeJsScene);
    world.addSystem(asteroidRenderSystem);

    // Connect destruction system to render system so it can clean up visuals
    asteroidDestructionSystem.setRenderSystem(asteroidRenderSystem);
  }
}
