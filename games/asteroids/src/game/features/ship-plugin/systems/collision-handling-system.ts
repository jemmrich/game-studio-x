import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import type { PlayerInputSystem } from "./player-input-system.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { AudioSystem } from "../../../systems/audio-system.ts";
import type { GameStats } from "../../../resources/game-stats.ts";

/**
 * CollisionHandlingSystem
 * Handles ship collisions with asteroids.
 * Decrements lives, respawns at center, or emits game over event.
 */
export class CollisionHandlingSystem {
  private shipEntityId: GUID | null = null;
  private world: World | null = null;
  private playerInputSystem: PlayerInputSystem | null = null;

  setShipEntityId(id: GUID): void {
    this.shipEntityId = id;
  }

  setPlayerInputSystem(system: PlayerInputSystem): void {
    this.playerInputSystem = system;
  }

  update(world: World, _dt: number): void {
    this.world = world;

    if (this.shipEntityId === null || !world.entityExists(this.shipEntityId)) {
      return;
    }

    const shipComponent = world.get<ShipComponent>(
      this.shipEntityId,
      ShipComponent,
    );
    if (!shipComponent) return;

    // Check for collision events
    const collisions = world.getEvents("ship_asteroid_collision");
    for (const collision of collisions) {
      const data = collision.data as unknown;
      // Accept any collision event (tests may not provide full data)
      if (data && typeof data === "object") {
        const collisionData = data as { shipId?: GUID; asteroidId?: GUID };
        this.handleCollision(world, shipComponent, {
          shipId: collisionData.shipId || this.shipEntityId,
          asteroidId: collisionData.asteroidId || "unknown",
        });
      }
    }
  }

  private handleCollision(
    world: World,
    shipComponent: ShipComponent,
    collision: { shipId: GUID; asteroidId: GUID },
  ): void {
    if (this.shipEntityId === null) return;

    // Ignore collision if ship is invincible
    if (shipComponent.isInvincible) {
      return;
    }

    // Set invincibility immediately to protect player
    // - Prevents secondary collisions in the same frame (e.g., if ship hits a big asteroid that spawns smaller ones)
    // - Provides protection during the death and respawn sequence
    // - Maintained until player moves or shoots after respawning
    shipComponent.isInvincible = true;

    // Get GameStats resource to track death
    const gameStats = world.getResource<GameStats>("gameStats");
    if (gameStats) {
      gameStats.recordDeathByAsteroid();
      console.log("[CollisionHandling] Player hit! Invincibility activated. Lives: " + gameStats.currentLives);
    } else {
      console.log("[CollisionHandling] Player hit! Invincibility activated.");
    }

    // Play explosion sound
    AudioSystem.playSound(world, 'explosion', 0.15);

    const { asteroidId } = collision;

    // Destroy the asteroid that we collided with
    if (world.entityExists(asteroidId)) {
      const asteroidTransform = world.get<Transform>(asteroidId, Transform);
      const position = asteroidTransform
        ? (asteroidTransform.position as [number, number, number])
        : [0, 0, 0];

      // Emit destruction event to handle asteroid break-up
      world.emitEvent("asteroid_destroyed", { asteroidId, position });
    }

    // Check if game is over using GameStats
    if (gameStats && !gameStats.isGameOver()) {
      // Game continues - respawn the player
      // Disable input and movement while waiting for respawn
      shipComponent.isThrusting = false;
      shipComponent.rotationDirection = 0;

      // Clear any buffered keyboard input to prevent movement on respawn
      if (this.playerInputSystem) {
        this.playerInputSystem.clearInput();
      }

      // Stop the ship immediately by clearing velocity
      const velocity = world.get<Velocity>(this.shipEntityId, Velocity);
      if (velocity) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
      }

      // Reset rotation and position
      const transform = world.get<Transform>(this.shipEntityId, Transform);
      if (transform) {
        transform.rotation = [0, 0, 0];
        transform.position = [0, 0, 0];
      }

      // Make the ship invisible
      const visible = world.get<Visible>(this.shipEntityId, Visible);
      if (visible) {
        visible.enabled = false;
      }

      console.log("[CollisionHandling] Player destroyed. Emitting respawn event...");

      // Emit respawn event - PlayerRespawnSystem will handle the actual respawn
      // This goes through the centralized respawn logic which handles wave transitions
      world.emitEvent("respawn_player", {
        position: [0, 0, 0] as [number, number, number],
      });
    } else {
      // Game over - no more lives
      world.emitEvent("game_over", {
        reason: "no_lives_remaining",
        finalLives: gameStats?.currentLives ?? 0,
      });

      console.log("Game Over!");

      // Make the ship invisible
      const visible = world.get<Visible>(this.shipEntityId, Visible);
      if (visible) {
        visible.enabled = false;
      }

      // Destroy the ship entity
      world.destroyEntity(this.shipEntityId);

      this.shipEntityId = null;
    }
  }

  private respawnShipAfterCooldown(world: World): void {
    if (this.shipEntityId === null || !world.entityExists(this.shipEntityId)) {
      return;
    }

    this.respawnShip(world);
  }
}
