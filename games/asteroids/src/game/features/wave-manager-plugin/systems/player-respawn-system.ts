import type { World } from "@engine/core/world.ts";
import { ShipComponent } from "../../ship-plugin/components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * PlayerRespawnSystem
 * Handles respawning the player ship at a specified position.
 * - Listens for respawn_player events
 * - Moves player ship to the specified position
 * - Resets velocity and rotation
 */
export class PlayerRespawnSystem {
  private respawnListener?: (event: WorldEvent) => void;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.respawnListener = (event) => {
      this.onRespawnPlayer(world, event);
    };

    world.onEvent("respawn_player", this.respawnListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle player respawn
   */
  private onRespawnPlayer(world: World, event: WorldEvent): void {
    const eventData = event.data as Record<string, unknown>;
    const position = eventData.position as [number, number, number] | undefined;

    if (!position) {
      console.warn("[PlayerRespawnSystem] No position specified for respawn");
      return;
    }

    // Find player ship entity
    const ships = world.query(ShipComponent);
    const shipEntities = ships.entities();

    if (shipEntities.length === 0) {
      console.warn("[PlayerRespawnSystem] No player ship found to respawn");
      return;
    }

    // Get the first (and typically only) ship
    const shipEntity = shipEntities[0];

    // Make ship invisible temporarily for respawn sequence
    const visible = world.get<Visible>(shipEntity, Visible);
    if (visible) {
      visible.enabled = false;
    }

    // Schedule respawn after 2 seconds
    setTimeout(() => {
      this.performRespawn(world, shipEntity, position);
    }, 2000);

    console.log(
      `[Player Respawn] Ship will respawn at [${position[0]}, ${position[1]}, ${position[2]}] in 2 seconds...`,
    );
  }

  /**
   * Perform the actual respawn (called after delay)
   */
  private performRespawn(
    world: World,
    shipEntity: unknown,
    position: [number, number, number],
  ): void {
    // Make ship visible
    const visible = world.get<Visible>(shipEntity, Visible);
    if (visible) {
      visible.enabled = true;
    }

    // Reset transform to center of screen
    const transform = world.get<Transform>(shipEntity, Transform);
    if (transform) {
      transform.position = [...position];
      transform.rotation = [0, 0, 0];
    }

    // Reset velocity
    const velocity = world.get<Velocity>(shipEntity, Velocity);
    if (velocity) {
      velocity.x = 0;
      velocity.y = 0;
      velocity.z = 0;
    }

    // Set invincibility (cleared when player moves or shoots)
    const shipComponent = world.get<ShipComponent>(shipEntity, ShipComponent);
    if (shipComponent) {
      shipComponent.isInvincible = true;
      // Also reset thrust state to clear any momentum
      shipComponent.isThrusting = false;
      shipComponent.rotationDirection = 0;
    }

    console.log(
      `[Player Respawn] Ship respawned at position [${position[0]}, ${position[1]}, ${position[2]}] - invincible until movement!`,
    );
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.respawnListener = undefined;
  }
}
