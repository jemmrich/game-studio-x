import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import type { PlayerInputSystem } from "./player-input-system.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { AudioSystem } from "../../../systems/audio-system.ts";

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
      if (data && typeof data === "object" && "asteroidId" in data && "shipId" in data) {
        this.handleCollision(world, shipComponent, data as { shipId: GUID; asteroidId: GUID });
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
    console.log("[CollisionHandling] Player hit! Invincibility activated. Lives: " + shipComponent.lives);

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

    // Decrement lives
    shipComponent.lives -= 1;

    if (shipComponent.lives > 0) {
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

      // Make the ship invisible
      const visible = world.get<Visible>(this.shipEntityId, Visible);
      if (visible) {
        visible.enabled = false;
      }

      console.log("[CollisionHandling] Player destroyed. Scheduling respawn in 3 seconds...");

      // Schedule respawn after 3 seconds
      setTimeout(() => {
        this.respawnShipAfterCooldown(world);
      }, 3000);
    } else {
      // Game over
      world.emitEvent("game_over", {
        reason: "no_lives_remaining",
        finalLives: shipComponent.lives,
      });

      console.log("Game Over!");

      // Make the ship invisible
      const visible = world.get<Visible>(this.shipEntityId, Visible);
      if (visible) {
        visible.enabled = false;
      }

      this.shipEntityId = null;
    }
  }

  private respawnShip(world: World): void {
    if (this.shipEntityId === null) return;

    const shipComponent = world.get<ShipComponent>(
      this.shipEntityId,
      ShipComponent,
    );

    // Ensure invincibility is maintained during respawn (should already be true from collision)
    if (shipComponent) {
      shipComponent.isInvincible = true;
      console.log("[CollisionHandling] Ship respawning with invincibility enabled");
    }

    // Make the ship visible again
    const visible = world.get<Visible>(this.shipEntityId, Visible);
    if (visible) {
      visible.enabled = true;
    }

    // Reset ship to center
    const transform = world.get<Transform>(this.shipEntityId, Transform);
    if (transform) {
      transform.position = [0, 0, 0];
      transform.rotation = [0, 0, 0];
    }

    // Emit respawn event
    world.emitEvent("ship_respawned", {
      lives: shipComponent?.lives ?? 0,
      position: [0, 0, 0] as [number, number, number],
    });
  }

  private respawnShipAfterCooldown(world: World): void {
    if (this.shipEntityId === null || !world.entityExists(this.shipEntityId)) {
      return;
    }

    this.respawnShip(world);
  }
}
