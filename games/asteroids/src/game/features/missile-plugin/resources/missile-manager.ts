import type { GUID } from "@engine/utils/guid.ts";

/**
 * MissileManager Resource
 *
 * A world resource that tracks active missiles per spawner. This is used to:
 * - Enforce the maximum missile count per spawner (default: 10)
 * - Clean up missile references when missiles are destroyed
 * - Query missile counts before spawning new missiles
 *
 * Structure:
 * - activeMissiles: Map<spawnerId, missileEntityIds[]>
 *   Maps each spawner entity to its list of active missile entity IDs.
 */
export class MissileManager {
  activeMissiles: Map<GUID, GUID[]> = new Map();

  /**
   * Register a new missile for a spawner
   */
  addMissile(spawnerId: GUID, missileId: GUID): void {
    if (!this.activeMissiles.has(spawnerId)) {
      this.activeMissiles.set(spawnerId, []);
    }
    this.activeMissiles.get(spawnerId)!.push(missileId);
  }

  /**
   * Unregister a missile when it is destroyed
   */
  removeMissile(spawnerId: GUID, missileId: GUID): void {
    const missiles = this.activeMissiles.get(spawnerId);
    if (missiles) {
      const index = missiles.indexOf(missileId);
      if (index > -1) {
        missiles.splice(index, 1);
      }
      if (missiles.length === 0) {
        this.activeMissiles.delete(spawnerId);
      }
    }
  }

  /**
   * Get the number of active missiles for a spawner
   */
  getMissileCount(spawnerId: GUID): number {
    return this.activeMissiles.get(spawnerId)?.length ?? 0;
  }

  /**
   * Get all missile IDs for a spawner
   */
  getMissiles(spawnerId: GUID): GUID[] {
    return this.activeMissiles.get(spawnerId) ?? [];
  }

  /**
   * Check if a spawner can spawn a new missile (within limit)
   */
  canSpawnMissile(spawnerId: GUID, maxMissiles: number = 10): boolean {
    return this.getMissileCount(spawnerId) < maxMissiles;
  }
}
