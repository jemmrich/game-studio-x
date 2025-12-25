import type { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "../resources/wave-manager.ts";
import { spawnAsteroid } from "../../asteroid-plugin/factories/spawn-asteroid.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * WaveInitializationSystem
 * Spawns asteroids and resets the player position when a new wave begins.
 * - Listens for wave_transition event
 * - Spawns asteroids with difficulty scaling
 * - Respawns player at center of screen
 * - Sets wave start time for duration tracking
 */
export class WaveInitializationSystem {
  private waveListener?: (event: WorldEvent) => void;
  private lastInitializedWave: number = -1;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.waveListener = (event) => {
      console.log(
        `[Wave Initialization] Received event with data:`,
        event,
      );
      this.onInitializeWave(world, event);
    };

    // Listen for both start_wave (Wave 1) and wave_transition (Wave 2+) events
    world.onEvent("start_wave", this.waveListener);
    world.onEvent("wave_transition", this.waveListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle wave initialization - spawn asteroids and reset player
   * Called for both start_wave (Wave 1) and wave_transition (Wave 2+) events
   */
  private onInitializeWave(world: World, event: WorldEvent): void {
    const waveManager = world.getResource<WaveManager>("waveManager");
    
    // Guard against initializing the same wave twice
    if (this.lastInitializedWave === waveManager.currentWaveNumber) {
      console.log(
        `[Wave Initialization] Wave ${waveManager.currentWaveNumber} already initialized, skipping`,
      );
      return;
    }
    
    this.lastInitializedWave = waveManager.currentWaveNumber;
    
    const eventData = event.data as Record<string, unknown>;
    
    // Get difficulty multiplier from event data, fallback to waveManager value
    const difficultyMultiplier = (eventData.difficultyMultiplier as number) || waveManager.difficultyMultiplier;
    
    console.log(
      `[Wave Initialization] Difficulty multiplier: ${difficultyMultiplier} (from event: ${eventData.difficultyMultiplier}, from manager: ${waveManager.difficultyMultiplier})`,
    );

    // Verify no old asteroids are lingering (debug check)
    const existingAsteroids = world.query(AsteroidComponent);
    const asteroidCount = existingAsteroids.entities().length;
    console.log(
      `[Wave Initialization] Starting wave ${waveManager.currentWaveNumber} with ${asteroidCount} existing asteroids`,
    );
    if (asteroidCount > 0) {
      console.warn(
        `[Wave Initialization] WARNING: Found ${asteroidCount} existing asteroids when spawning wave ${waveManager.currentWaveNumber}! These should have been destroyed.`,
      );
    }

    // Calculate asteroid spawn count based on difficulty
    // Base: 10 asteroids per wave
    const baseAsteroidCount = 10;
    const scaledAsteroidCount = Math.ceil(
      baseAsteroidCount * difficultyMultiplier,
    );
    
    if (scaledAsteroidCount <= 0) {
      console.error(
        `[Wave Initialization] ERROR: Scaled asteroid count is ${scaledAsteroidCount}! Base: ${baseAsteroidCount}, Difficulty: ${difficultyMultiplier}`,
      );
      return;
    }
    
    console.log(
      `[Wave Initialization] Spawning ${scaledAsteroidCount} asteroids for wave ${waveManager.currentWaveNumber}`,
    );

    // Game world bounds are approximately X[-130, 130] Y[-57, 57]
    const spawnPositions: Array<[number, number, number]> = this
      .generateSpawnPositions(scaledAsteroidCount);
    
    console.log(
      `[Wave Initialization] Generated ${spawnPositions.length} spawn positions`,
    );
    
    if (spawnPositions.length === 0) {
      console.error(
        `[Wave Initialization] ERROR: No spawn positions generated!`,
      );
      return;
    }

    // Spawn asteroids for the new wave
    console.log(
      `[Wave Initialization] Starting to spawn ${spawnPositions.length} asteroids...`,
    );
    let spawnedCount = 0;
    for (const position of spawnPositions) {
      try {
        const asteroidId = spawnAsteroid(world, position, 3); // Size 3 = Large
        spawnedCount++;
        console.log(
          `[Wave Initialization] Spawned asteroid ${asteroidId} at [${position[0].toFixed(2)}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)}]`,
        );
      } catch (error) {
        console.error(
          `[Wave Initialization] Error spawning asteroid at [${position[0]}, ${position[1]}, ${position[2]}]: ${error}`,
        );
      }
    }
    console.log(
      `[Wave Initialization] Finished spawning wave. Spawned ${spawnedCount} / ${spawnPositions.length} asteroids`,
    );

    // Verify asteroids were actually added
    const verifyQuery = world.query(AsteroidComponent);
    const verifyCount = verifyQuery.entities().length;
    console.log(
      `[Wave Initialization] Verification: World now contains ${verifyCount} total asteroids`,
    );

    // Emit event to respawn player at center
    world.emitEvent("respawn_player", {
      position: [0, 0, 0],
    });

    // Update wave start time (in milliseconds from performance.now())
    const time = world.getResource<Time>("time");
    waveManager.waveStartTime = time.elapsed;
  }

  /**
   * Generate spawn positions distributed across the game world
   */
  private generateSpawnPositions(
    count: number,
  ): Array<[number, number, number]> {
    const positions: Array<[number, number, number]> = [];
    const maxX = 130;
    const maxY = 57;

    // Create a grid-based pattern with some randomization
    const gridSize = Math.ceil(Math.sqrt(count));
    const stepX = (maxX * 2) / (gridSize + 1);
    const stepY = (maxY * 2) / (gridSize + 1);

    for (let i = 0; i < count; i++) {
      const gridX = (i % gridSize) + 1;
      const gridY = Math.floor(i / gridSize) + 1;

      // Calculate base position
      let x = -maxX + gridX * stepX;
      let y = -maxY + gridY * stepY;

      // Add small random offset to avoid perfectly aligned asteroids
      x += (Math.random() - 0.5) * 20;
      y += (Math.random() - 0.5) * 10;

      // Clamp to game bounds with margin
      x = Math.max(-maxX + 10, Math.min(maxX - 10, x));
      y = Math.max(-maxY + 10, Math.min(maxY - 10, y));

      positions.push([x, y, 0]);
    }

    return positions;
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.waveListener = undefined;
  }
}
