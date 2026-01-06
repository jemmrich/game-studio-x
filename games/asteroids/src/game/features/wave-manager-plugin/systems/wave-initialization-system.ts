import type { World } from "@engine/core/world.ts";
import { Time } from "@engine/resources/time.ts";
import { WaveManager } from "../resources/wave-manager.ts";
import { spawnAsteroid } from "../../asteroid-plugin/factories/spawn-asteroid.ts";
import { AsteroidComponent } from "../../asteroid-plugin/components/asteroid.ts";
import { getCollisionRadius } from "../../asteroid-plugin/config/asteroid-size-config.ts";
import { ShipComponent } from "../../ship-plugin/components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * WaveInitializationSystem
 * Spawns asteroids and resets the player position when a new wave begins.
 * - Listens for entering_zone_effect_complete event (waits for warp effect to finish)
 * - Spawns asteroids with difficulty scaling
 * - Respawns player at center of screen
 * - Sets wave start time for duration tracking
 */
export class WaveInitializationSystem {
  private effectCompleteListener?: (event: WorldEvent) => void;
  private lastInitializedWave: number = -1;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.effectCompleteListener = (event) => {
      this.onInitializeWave(world, event);
    };

    // Listen for entering_zone_effect_complete event (warp effect finished playing)
    // This delays asteroid spawning until after the warp effect completes
    world.onEvent("entering_zone_effect_complete", this.effectCompleteListener);
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
    
    // Reset wave state now that we're about to spawn asteroids
    const time = world.getResource<Time>("time");
    waveManager.resetForNewWave(time.elapsed);
    
    // Get difficulty multiplier from event data, fallback to waveManager value
    const difficultyMultiplier = (eventData.difficultyMultiplier as number) || waveManager.difficultyMultiplier;
    
    console.log(
      `[Wave Initialization] Difficulty multiplier: ${difficultyMultiplier} (from event: ${eventData.difficultyMultiplier}, from manager: ${waveManager.difficultyMultiplier})`,
    );

    // Reset ship position BEFORE spawning asteroids to prevent collision with old ship position
    // This ensures asteroids spawn without colliding with the ship from the previous wave
    const ships = world.query(ShipComponent);
    const shipEntities = ships.entities();
    if (shipEntities.length > 0) {
      const shipEntity = shipEntities[0];
      
      // Move ship to center and make invisible
      const transform = world.get<Transform>(shipEntity, Transform);
      if (transform) {
        transform.position = [0, 0, 0];
        transform.rotation = [0, 0, 0];
      }
      
      const visible = world.get<Visible>(shipEntity, Visible);
      if (visible) {
        visible.enabled = false;
      }
      
      const shipComponent = world.get<ShipComponent>(shipEntity, ShipComponent);
      if (shipComponent) {
        shipComponent.isInvincible = true;
      }
    }

    // Verify no old asteroids are lingering (debug check)
    const existingAsteroids = world.query(AsteroidComponent);
    const asteroidCount = existingAsteroids.entities().length;
    
    // Calculate asteroid spawn count based on difficulty
    // Base: 10 asteroids per wave
    const baseAsteroidCount = 10;
    const scaledAsteroidCount = Math.ceil(
      baseAsteroidCount * difficultyMultiplier,
    );
    
    if (scaledAsteroidCount <= 0) {
      return;
    }
    
    // Game world bounds are approximately X[-130, 130] Y[-57, 57]
    const spawnPositions: Array<[number, number, number]> = this
      .generateSpawnPositions(scaledAsteroidCount);
    
    if (spawnPositions.length === 0) {
      return;
    }

    // Spawn asteroids for the new wave
    let spawnedCount = 0;
    for (const position of spawnPositions) {
      try {
        spawnAsteroid(world, position, 3); // Size 3 = Large
        spawnedCount++;
      } catch (error) {
        console.error(
          `[Wave Initialization] Error spawning asteroid at [${position[0]}, ${position[1]}, ${position[2]}]: ${error}`,
        );
      }
    }

    // Verify asteroids were actually added
    const verifyQuery = world.query(AsteroidComponent);
    const verifyCount = verifyQuery.entities().length;

    // Mark that asteroids have been spawned for this wave
    waveManager.hasSpawnedAsteroidsThisWave = true;

    // Update wave start time (in milliseconds from performance.now())
    waveManager.waveStartTime = time.elapsed;

    // Delay player respawn slightly so asteroids appear first
    // This gives the player a moment to see the asteroid field before their ship spawns
    setTimeout(() => {
      world.emitEvent("respawn_player", {
        position: [0, 0, 0],
      });
    }, 200); // 200ms delay
  }

  /**
   * Generate spawn positions distributed across the game world
   * Ensures asteroids spawn far from the player at [0, 0, 0]
   */
  private generateSpawnPositions(
    count: number,
  ): Array<[number, number, number]> {
    const positions: Array<[number, number, number]> = [];
    const maxX = 130;
    const maxY = 57;
    
    // Calculate safe distance: player radius + asteroid radius + buffer
    // Player collision radius ≈ 8 units (from bounding box)
    // Size 3 asteroid collision radius = 1.0 * 7.5 = 7.5 units
    // Buffer = 15 units for safety margin
    // Total = 8 + 7.5 + 15 = 30.5, rounded to 35 for margin
    const playerCollisionRadius = 8;
    const asteroidCollisionRadius = getCollisionRadius(3); // Size 3 asteroids spawn at wave start
    const safetyBuffer = 15;
    const playerSafeDistance = playerCollisionRadius + asteroidCollisionRadius + safetyBuffer;

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

      // Ensure asteroid doesn't spawn too close to player center [0, 0, 0]
      // Distance must account for both player and asteroid collision radii
      const distanceFromPlayer = Math.sqrt(x * x + y * y);
      if (distanceFromPlayer < playerSafeDistance) {
        // Push asteroid further away from player
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * playerSafeDistance;
        y = Math.sin(angle) * playerSafeDistance;
      }

      positions.push([x, y, 0]);
    }

    return positions;
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.effectCompleteListener = undefined;
  }
}
