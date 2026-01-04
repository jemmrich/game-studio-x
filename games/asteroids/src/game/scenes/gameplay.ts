import { BaseScene } from "@engine/core/base-scene.ts";
import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";
import {
  spawnPlayerShip,
  type ShipPluginContext,
} from "../features/ship-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { AsteroidComponent } from "../features/asteroid-plugin/components/asteroid.ts";
import { EnteringZoneScene } from "./entering-zone-scene.ts";
import * as THREE from "three";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * GameplayScene - Main game loop and wave management
 *
 * This scene handles all gameplay logic including:
 * - Player ship initialization and management
 * - Wave manager coordination
 * - Wave transitions (pushing EnteringZoneScene onto stack)
 * - Game over handling
 * - Asteroid lifecycle during gameplay
 *
 * Architecture Notes:
 * - All plugins are installed globally in main.tsx, not per-scene
 * - This scene spawns the player and coordinates entity lifecycle
 * - Wave transitions use scene stack (pushes EnteringZoneScene on top)
 * - Scene remains initialized during pauses (doesn't dispose/reinit)
 *
 * Scene Lifecycle:
 * - init(): Spawn player, setup wave listeners, start first wave
 * - dispose(): Clean up event listeners and entities
 * - pause()/resume(): Called when entering/exiting zone scenes
 */
export class GameplayScene extends BaseScene {
  private shipEntityId: GUID | null = null;
  private threeJsScene: THREE.Scene;
  private unsubscribeEffectComplete?: () => void;
  private unsubscribeWaveComplete?: () => void;
  private unsubscribeEnteringZone?: () => void;

  constructor(threeJsScene: THREE.Scene) {
    super("asteroids-main");
    this.threeJsScene = threeJsScene;
  }

  /**
   * Initialize gameplay scene
   *
   * Steps:
   * 1. Spawn the player ship (invisible during warp effect)
   * 2. Connect ship plugin systems
   * 3. Set asteroids to fade in for gameplay
   * 4. Listen for wave lifecycle events
   * 5. Emit start_wave to begin Wave 1
   */
  init(world: World): void {
    // NOTE: All plugins are already installed in main.tsx
    // This scene sets up gameplay-specific entities and events
    // and coordinates the timing of ship and asteroid spawning

    // Emit scene-transition event for UI
    world.emitEvent("scene-transition", { view: "gameplay" });
    
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
    this.unsubscribeEffectComplete = world.onEvent("entering_zone_effect_complete", (event) => {
      this.onEnteringZoneEffectComplete(world, event);
    });

    // Setup listener for wave completion
    this.unsubscribeWaveComplete = world.onEvent("wave_complete", (event) => {
      this.onWaveComplete(world, event);
    });

    // Setup listener for entering zone start
    // This allows us to push EnteringZoneScene onto scene stack for wave transitions
    this.unsubscribeEnteringZone = world.onEvent("entering_zone", (event) => {
      this.onEnteringZone(world, event);
    });

    // Emit start_wave event AFTER scene is fully loaded
    // We use setTimeout to defer this to the next frame, ensuring:
    // 1. This scene's init() completes and scene is marked as loaded
    // 2. Scene stack is properly initialized before entering_zone event fires
    // 3. When entering_zone fires, GameplayScene is ready to push EnteringZoneScene
    setTimeout(() => {
      world.emitEvent("start_wave", {
        waveNumber: 1,
      });
    }, 0);
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
   * Called when entering a new zone (wave transition begins)
   *
   * This is where we push the EnteringZoneScene onto the scene stack,
   * creating a paused overlay effect while the wave transition happens.
   */
  private onEnteringZone(world: World, event: WorldEvent): void {
    const waveNumber = (event.data.waveNumber as number) ?? 1;

    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (sceneManager) {
      // Push entering zone scene on top of scene stack
      // This pauses the current gameplay scene while showing the transition effect
      sceneManager.pushScene(new EnteringZoneScene(waveNumber));
      console.log(`[GameplayScene] Pushed EnteringZoneScene for wave ${waveNumber}`);
    }
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
   * Clean up gameplay scene resources
   *
   * Removes all event listeners and cleans up entities tagged with this scene
   */
  dispose(): void {
    // Unsubscribe from all events
    if (this.unsubscribeEffectComplete) {
      this.unsubscribeEffectComplete();
    }
    if (this.unsubscribeWaveComplete) {
      this.unsubscribeWaveComplete();
    }
    if (this.unsubscribeEnteringZone) {
      this.unsubscribeEnteringZone();
    }

    console.log("[GameplayScene] Disposed");
  }
}
