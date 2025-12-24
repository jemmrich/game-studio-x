import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import { spawnAsteroid, AsteroidRenderSystem, installAsteroidPlugin } from "../features/asteroid-plugin/mod.ts";
import * as THREE from "three";

export class TitleScene extends BaseScene {
  private threeJsScene: THREE.Scene;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-title");
    this.threeJsScene = threeJsScene;
  }

  init(world: World): void {
    // Install the asteroid plugin (sets up asteroid systems)
    const { destructionSystem: asteroidDestructionSystem, spawningSystem: asteroidSpawningSystem } = installAsteroidPlugin(world);

    // Add asteroid destruction system
    world.addSystem(asteroidDestructionSystem);

    // Add asteroid spawning system
    world.addSystem(asteroidSpawningSystem);

    // Spawn 30 asteroids of mixed sizes across the screen
    // Game world bounds are approximately X[-130, 130] Y[-57, 57]
    const spawnPositions: Array<[number, number, number]> = [
      // Large asteroids (size 3) - 10 total
      [-100, -40, 0],
      [100, -40, 0],
      [-100, 40, 0],
      [100, 40, 0],
      [0, -50, 0],
      [0, 50, 0],
      [-120, 0, 0],
      [120, 0, 0],
      [-110, -50, 0],
      [110, 50, 0],
      // Medium asteroids (size 2) - 10 total
      [-60, -30, 0],
      [60, -30, 0],
      [-60, 30, 0],
      [60, 30, 0],
      [-30, -50, 0],
      [30, -50, 0],
      [-30, 50, 0],
      [30, 50, 0],
      [0, 0, 0],
      [-70, 0, 0],
      // Small asteroids (size 1) - 10 total
      [-80, -20, 0],
      [80, -20, 0],
      [-80, 20, 0],
      [80, 20, 0],
      [-40, 0, 0],
      [40, 0, 0],
      [-15, -35, 0],
      [15, 35, 0],
      [-50, -45, 0],
      [50, 45, 0],
    ];

    // Spawn asteroids with mixed sizes
    for (let i = 0; i < spawnPositions.length; i++) {
      const position = spawnPositions[i];
      let size: 1 | 2 | 3;
      
      if (i < 10) {
        size = 3; // Large
      } else if (i < 20) {
        size = 2; // Medium
      } else {
        size = 1; // Small
      }
      
      spawnAsteroid(world, position, size);
    }

    // Create and register Three.js rendering system
    const asteroidRenderSystem = new AsteroidRenderSystem(this.threeJsScene);
    world.addSystem(asteroidRenderSystem);

    // Connect destruction system to render system so it can clean up visuals
    asteroidDestructionSystem.setRenderSystem(asteroidRenderSystem);
  }
}
