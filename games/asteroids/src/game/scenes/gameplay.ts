import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import {
  installShipPlugin,
  spawnPlayerShip,
  ShipRenderSystem,
  type ShipPluginContext,
} from "../features/ship-plugin/mod.ts";
import * as THREE from "three";

export class GameplayScene extends BaseScene {
  private shipPluginContext: ShipPluginContext | null = null;
  private shipEntityId: GUID | null = null;
  private threeJsScene: THREE.Scene;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-main");
    this.threeJsScene = threeJsScene;
  }

  init(world: World): void {
    // Install the ship plugin (sets up all ship-related systems)
    this.shipPluginContext = installShipPlugin(world);

    // Spawn the player ship
    this.shipEntityId = spawnPlayerShip(world);

    // Connect plugin systems to the spawned ship entity
    this.shipPluginContext.setShipEntityId(this.shipEntityId);

    // Create and register Three.js rendering system
    const shipRenderSystem = new ShipRenderSystem(this.threeJsScene);
    world.addSystem(shipRenderSystem);
  }
}
