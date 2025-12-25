import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import {
  spawnPlayerShip,
  type ShipPluginContext,
} from "../features/ship-plugin/mod.ts";
import * as THREE from "three";

export class GameplayScene extends BaseScene {
  private shipEntityId: GUID | null = null;
  private threeJsScene: THREE.Scene;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-main");
    this.threeJsScene = threeJsScene;
  }

  init(world: World): void {
    // NOTE: All plugins are already installed in main.tsx
    // This scene just sets up gameplay-specific entities and events

    // Get the ship plugin context from resources
    const shipPluginContext = world.getResource<ShipPluginContext>("shipPluginContext");
    
    // Spawn the player ship
    this.shipEntityId = spawnPlayerShip(world);

    // Connect plugin systems to the spawned ship entity
    shipPluginContext.setShipEntityId(this.shipEntityId);

    // Emit start_wave event to initialize Wave 1
    // The WaveInitializationSystem listens for this and spawns asteroids
    world.emitEvent("start_wave", {
      waveNumber: 1,
    });
  }
}
