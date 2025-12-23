import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { ShipComponent } from "../components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";

/**
 * CollisionHandlingSystem
 * Handles ship collisions with asteroids.
 * Decrements lives, respawns at center, or emits game over event.
 */
export class CollisionHandlingSystem {
  private shipEntityId: GUID | null = null;

  setShipEntityId(id: GUID): void {
    this.shipEntityId = id;
  }

  update(world: World, _dt: number): void {
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
      this.handleCollision(world, shipComponent);
    }
  }

  private handleCollision(
    world: World,
    shipComponent: ShipComponent,
  ): void {
    if (this.shipEntityId === null) return;

    // Decrement lives
    shipComponent.lives -= 1;

    if (shipComponent.lives > 0) {
      // Respawn at center
      const transform = world.get<Transform>(this.shipEntityId, Transform);
      if (transform) {
        const canvasWidth = 800; // TODO: get from render context
        const canvasHeight = 600;
        transform.position[0] = canvasWidth / 2;
        transform.position[1] = canvasHeight / 2;
        transform.rotation[2] = 0;
      }

      // Make invincible for a moment
      shipComponent.isInvincible = true;

      // Emit respawn event
      world.emitEvent("ship_respawned", {
        lives: shipComponent.lives,
        position: transform?.position ?? [0, 0, 0],
      });
    } else {
      // Game over
      world.emitEvent("game_over", {
        reason: "no_lives_remaining",
        finalLives: shipComponent.lives,
      });

      // Optionally destroy the ship entity
      world.destroyEntity(this.shipEntityId);
      this.shipEntityId = null;
    }
  }
}
