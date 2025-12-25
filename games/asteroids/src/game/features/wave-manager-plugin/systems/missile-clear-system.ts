import type { World } from "@engine/core/world.ts";
import { MissileComponent } from "../../missile-plugin/components/missile.ts";
import { MissileManager } from "../../missile-plugin/resources/missile-manager.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * MissileClearSystem
 * Destroys all active missiles when a wave completes.
 * - Listens for wave_complete event
 * - Queries for all MissileComponent entities
 * - Destroys each missile entity
 */
export class MissileClearSystem {
  private waveCompleteListener?: (event: WorldEvent) => void;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };

    world.onEvent("wave_complete", this.waveCompleteListener);
  }

  /**
   * Update method (required by ECS, but this system is event-driven)
   */
  update(): void {
    // Event-driven system, no frame-by-frame updates needed
  }

  /**
   * Handle wave completion - destroy all active missiles
   */
  private onWaveComplete(world: World, event: WorldEvent): void {
    // Get the missile manager to update tracking
    const missileManager = world.getResource<MissileManager>("MissileManager");

    // Query for all missile entities
    const missiles = world.query(MissileComponent);
    const missileEntities = missiles.entities();

    if (missileEntities.length === 0) {
      console.log("[MissileClearSystem] No missiles to clear");
      return;
    }

    // Destroy each missile and update the manager
    for (const missileEntity of missileEntities) {
      if (world.entityExists(missileEntity)) {
        // Get the missile component to find its spawner
        const missile = world.get<MissileComponent>(
          missileEntity,
          MissileComponent,
        );

        // Remove from missile manager tracking
        if (missile && missileManager) {
          missileManager.removeMissile(missile.spawnerId, missileEntity);
        }

        // Destroy the entity
        world.destroyEntity(missileEntity);
      }
    }

    console.log(
      `[MissileClearSystem] Cleared ${missileEntities.length} missiles for wave completion`,
    );
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.waveCompleteListener = undefined;
  }
}
