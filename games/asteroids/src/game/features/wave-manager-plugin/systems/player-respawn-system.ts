import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { ShipComponent } from "../../ship-plugin/components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { SceneManager } from "@engine/resources/scene-manager.ts";

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
 * - Cancels pending respawn if scene transitions occur
 */
export class PlayerRespawnSystem {
  private respawnListener?: (event: WorldEvent) => void;
  private waveCompleteListener?: (event: WorldEvent) => void;
  private waveCompleted: boolean = false;
  private waveCompleteResetTimer: number | null = null;

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.respawnListener = (event) => {
      this.onRespawnPlayer(world, event);
    };

    this.waveCompleteListener = (event) => {
      this.onWaveComplete(world, event);
    };

    world.onEvent("respawn_player", this.respawnListener);
    world.onEvent("wave_complete", this.waveCompleteListener);
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

    // If a wave just completed, skip this respawn - it's from a collision death
    // that triggered the wave completion. Let WaveInitializationSystem handle the respawn.
    if (this.waveCompleted) {
      console.log(
        "[PlayerRespawnSystem] Skipping respawn: wave just completed, WaveInitializationSystem will handle respawn",
      );
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

    // Set invincibility immediately to protect player during respawn sequence
    const shipComponent = world.get<ShipComponent>(shipEntity, ShipComponent);
    if (shipComponent) {
      shipComponent.isInvincible = true;
    }

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
      `[Player Respawn] Ship will respawn at [${position[0]}, ${position[1]}, ${position[2]}] in 2 seconds... (Invincibility: ON)`,
    );
  }

  /**
   * Called when a wave completes
   * Track this so we can skip any collision respawns that triggered the completion
   */
  private onWaveComplete(world: World, _event: WorldEvent): void {
    this.waveCompleted = true;
    console.log("[PlayerRespawnSystem] Wave complete detected - collision respawns will be skipped");

    // Reset the flag after a short delay so normal respawns work again
    // (in case a respawn_player event comes from somewhere else after wave complete)
    if (this.waveCompleteResetTimer !== null) {
      clearTimeout(this.waveCompleteResetTimer);
    }
    this.waveCompleteResetTimer = setTimeout(() => {
      this.waveCompleted = false;
      this.waveCompleteResetTimer = null;
    }, 500) as unknown as number;
  }

  /**
   * Called when a scene transition begins (entering_zone event)
   * Cancels any pending respawn since the game state is transitioning
   */
  private onSceneTransition(world: World, _event: WorldEvent): void {
    if (this.pendingRespawnTimerId !== null) {
      clearTimeout(this.pendingRespawnTimerId);
      this.pendingRespawnTimerId = null;
      console.log("[PlayerRespawnSystem] Cancelled pending respawn due to scene transition");
    }
    
    console.log("[PlayerRespawnSystem] Scene transition started - ignoring respawns");
  }

  /**
   * Called when gameplay scene is resumed after a transition
   * This is when we can re-enable respawning
   */
  private onSceneResume(world: World, event: WorldEvent): void {
    const eventData = event.data as Record<string, unknown>;
    const scene = eventData.scene as any;
    
    // Only clear the transition flag when GameplayScene is resumed
    if (scene && scene.id === "asteroids-main") {
      this.isInSceneTransition = false;
      console.log("[PlayerRespawnSystem] Scene resumed - respawning re-enabled");
    }
  }

  /**
   * Perform the actual respawn (called after delay)
   */
  private performRespawn(
    world: World,
    shipEntity: unknown,
    position: [number, number, number],
  ): void {
    // Get scene manager
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    
    if (!sceneManager || !world.entityExists(shipEntity as GUID)) {
      return;
    }

    const currentScene = sceneManager.getCurrentScene();
    
    // If GameplayScene is not the current scene, don't respawn
    if (!currentScene || currentScene.id !== "asteroids-main") {
      return;
    }

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

    // Ensure invincibility is on during respawn
    // - Set immediately when player is hit (in CollisionHandlingSystem)
    // - Maintained through entire death-respawn sequence
    // - Provides protection during spawn animation
    // - Cleared when player moves or shoots
    const shipComponent = world.get<ShipComponent>(shipEntity, ShipComponent);
    if (shipComponent) {
      shipComponent.isInvincible = true;
      // Also reset thrust state to clear any momentum
      shipComponent.isThrusting = false;
      shipComponent.rotationDirection = 0;
      
      // Get lives from GameStats resource
      const gameStats = world.getResource("gameStats");
      const livesMessage = gameStats ? ` (Lives: ${(gameStats as any).currentLives})` : "";
      
      console.log(
        `[Player Respawn] Ship respawned at position [${position[0]}, ${position[1]}, ${position[2]}] - Invincibility ON${livesMessage}`,
      );
    }
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.respawnListener = undefined;
    this.waveCompleteListener = undefined;
    if (this.waveCompleteResetTimer !== null) {
      clearTimeout(this.waveCompleteResetTimer);
      this.waveCompleteResetTimer = null;
    }
  }
}
