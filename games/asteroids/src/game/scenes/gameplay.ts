import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import {
  spawnPlayerShip,
  type ShipPluginContext,
} from "../features/ship-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { AsteroidComponent } from "../features/asteroid-plugin/components/asteroid.ts";
import * as THREE from "three";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

export class GameplayScene extends BaseScene {
  private shipEntityId: GUID | null = null;
  private threeJsScene: THREE.Scene;
  private effectCompleteListener?: (event: WorldEvent) => void;
  private waveCompleteListener?: (event: WorldEvent) => void;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-main");
    this.threeJsScene = threeJsScene;
  }

  init(world: World): void {
    // NOTE: All plugins are already installed in main.tsx
    // This scene sets up gameplay-specific entities and events
    // and coordinates the timing of ship and asteroid spawning

    // Get the ship plugin context from resources
    const shipPluginContext = world.getResource<ShipPluginContext>("shipPluginContext");
    
    // Spawn the player ship but keep it invisible during warp effect
    this.shipEntityId = spawnPlayerShip(world);
    const shipVisible = world.get<Visible>(this.shipEntityId, Visible);
    if (shipVisible) {
      shipVisible.enabled = false;
    }

    // Connect plugin systems to the spawned ship entity
    shipPluginContext.setShipEntityId(this.shipEntityId);

    // Prepare asteroids for fade-in animation by setting opacity to 0
    // (they start with opacity 1 by default for title screen visibility)
    const asteroidEntities = world.query(AsteroidComponent).entities();
    for (const entity of asteroidEntities) {
      const material = world.get<BasicMaterial>(entity, BasicMaterial);
      if (material) {
        material.opacity = 0;
      }
    }

    // Setup listener for warp effect completion
    this.effectCompleteListener = (event) => {
      this.onEnteringZoneEffectComplete(world, event);
    };
    world.onEvent("entering_zone_effect_complete", this.effectCompleteListener);

    // Setup listener for wave completion
    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };
    world.onEvent("wave_complete", this.waveCompleteListener);

    // Emit start_wave event to initialize Wave 1
    // InitialZoneEntrySystem listens for this and emits entering_zone
    // which triggers the warp effect
    world.emitEvent("start_wave", {
      waveNumber: 1,
    });
  }

  /**
   * Called when the warp effect completes
   * Note: Ship visibility is NOT managed here. The ship remains invisible
   * until the wave initialization spawns asteroids and triggers respawn_player event.
   * This prevents the ship from appearing before asteroids fade in.
   */
  private onEnteringZoneEffectComplete(world: World, _event: WorldEvent): void {
    if (!this.shipEntityId) return;

    // Ship visibility is managed by WaveInitializationSystem and PlayerRespawnSystem
    // Keep ship invisible here to avoid it appearing before asteroids
    console.log("[GameplayScene] Warp effect complete, waiting for wave initialization...");
  }

  /**
   * Called when a wave is complete
   * Makes the ship invisible for the wave transition effect
   */
  private onWaveComplete(world: World, _event: WorldEvent): void {
    if (!this.shipEntityId) return;

    const shipVisible = world.get<Visible>(this.shipEntityId, Visible);
    if (shipVisible) {
      shipVisible.enabled = false;
      console.log("[GameplayScene] Ship hidden for wave transition");
    }
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    if (this.effectCompleteListener) {
      this.effectCompleteListener = undefined;
    }
    if (this.waveCompleteListener) {
      this.waveCompleteListener = undefined;
    }
  }
}
