import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { spawnMissile } from "../factories/mod.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";

/**
 * MissileSpawningSystem
 * Listens for missile spawn requests and creates missiles.
 * Prevents spawning more than 10 missiles per ship.
 *
 * This is a generic system that handles missile spawning when
 * 'missile_spawn_requested' events are emitted (by any entity).
 */
export class MissileSpawningSystem {
  update(world: World, _dt: number): void {
    // Get all missile spawn events
    const events = world.getEvents("missile_spawn_requested");

    for (const event of events) {
      const shipEntityId = event.data.shipEntityId as GUID;
      const position = event.data.position as [number, number, number];
      const direction = event.data.direction as number;

      // Get ship's current velocity
      const shipVelocity = world.get<Velocity>(shipEntityId, Velocity);
      const shipVelocityVector: [number, number, number] = shipVelocity
        ? [shipVelocity.x, shipVelocity.y, shipVelocity.z]
        : [0, 0, 0];

      // Convert rotation angle to direction vector
      // Add π/2 to convert from ship rotation (0 = up) to standard math coords (0 = right)
      const directionAngle = direction + Math.PI / 2;
      const directionVector: [number, number, number] = [
        Math.cos(directionAngle),
        Math.sin(directionAngle),
        0,
      ];

      // Spawn missile using the missile plugin factory
      const missileId = spawnMissile(
        world,
        position,
        directionVector,
        shipEntityId,
        88, // speed (pixels per second)
        1500, // lifetime (milliseconds)
        10,   // max missiles per spawner
        shipVelocityVector // inherit ship's velocity
      );

      if (missileId !== null) {
        // Missile was spawned successfully
        // (MissileManager was already updated by spawnMissile)
      }
    }
  }
}
