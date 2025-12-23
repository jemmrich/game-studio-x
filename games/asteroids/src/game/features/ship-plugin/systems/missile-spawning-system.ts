import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";

/**
 * MissileSpawningSystem
 * Listens for missile spawn requests and creates missiles.
 * Prevents spawning more than 10 missiles per ship.
 */
export class MissileSpawningSystem {
  private missileCountPerShip: Map<GUID, number> = new Map();
  private maxMissilesPerShip = 10;

  update(world: World, _dt: number): void {
    // Get all missile spawn events
    const events = world.getEvents("missile_spawn_requested");

    for (const event of events) {
      const shipEntityId = event.data.shipEntityId as GUID;
      const position = event.data.position as [number, number, number];
      const direction = event.data.direction as number;

      // Check if ship has reached missile limit
      const count = this.missileCountPerShip.get(shipEntityId) ?? 0;
      if (count >= this.maxMissilesPerShip) {
        continue; // Skip spawning
      }

      // Spawn missile
      const missileId = this.spawnMissile(world, position, direction, shipEntityId);
      if (missileId !== null) {
        this.missileCountPerShip.set(shipEntityId, count + 1);
      }
    }
  }

  private spawnMissile(
    world: World,
    position: [number, number, number],
    direction: number,
    shipEntityId: GUID,
  ): GUID | null {
    try {
      const missile = world.createEntity();

      // For now, just mark it as a missile in the world
      // Full implementation would require a Missile component and rendering
      const eventData = {
        position,
        direction,
        shipEntityId,
        spawnedAt: Date.now(),
      };

      // Emit event for other systems to handle actual missile creation
      world.emitEvent("missile_spawned", eventData);

      return missile;
    } catch {
      return null;
    }
  }

  onShipDestroyed(shipEntityId: GUID): void {
    this.missileCountPerShip.delete(shipEntityId);
  }
}
