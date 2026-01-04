import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";

/**
 * PlayerInputSystem
 * Captures keyboard input and updates ship rotation/thrust state.
 * Also triggers missile spawning when space is pressed.
 */
export class PlayerInputSystem {
  private keysPressed: Set<string> = new Set();
  private initialized = false;
  private shipEntityId: GUID | null = null;
  private lastMissileFireTime = 0;
  private missileFireCooldown = 120; // milliseconds between missile shots

  constructor(shipEntityId: GUID | null = null) {
    this.shipEntityId = shipEntityId;
  }

  setShipEntityId(id: GUID): void {
    this.shipEntityId = id;
  }

  clearInput(): void {
    this.keysPressed.clear();
  }

  update(world: World, _dt: number): void {
    if (!this.initialized) {
      this.setupKeyboardListeners();
      this.initialized = true;
    }

    if (this.shipEntityId === null || !world.entityExists(this.shipEntityId)) {
      return;
    }

    const shipComponent = world.get<ShipComponent>(
      this.shipEntityId,
      ShipComponent,
    );
    if (!shipComponent) return;

    // Prevent input if ship is not visible (dead/respawning)
    const visible = world.get<Visible>(this.shipEntityId, Visible);
    if (!visible || !visible.enabled) {
      // Clear any active input states
      shipComponent.rotationDirection = 0;
      shipComponent.isThrusting = false;
      return;
    }

    // Handle rotation input
    shipComponent.rotationDirection = 0;
    if (
      this.keysPressed.has("ArrowLeft") ||
      this.keysPressed.has("a") ||
      this.keysPressed.has("A")
    ) {
      shipComponent.rotationDirection = 1;
      // Rotation alone does NOT clear invincibility
    }
    if (
      this.keysPressed.has("ArrowRight") ||
      this.keysPressed.has("d") ||
      this.keysPressed.has("D")
    ) {
      shipComponent.rotationDirection = -1;
      // Rotation alone does NOT clear invincibility
    }

    // Handle thrust input
    const wasPreviouslyThrusting = shipComponent.isThrusting;
    shipComponent.isThrusting =
      this.keysPressed.has("ArrowUp") ||
      this.keysPressed.has("w") ||
      this.keysPressed.has("W");
    if (shipComponent.isThrusting && !wasPreviouslyThrusting) {
      shipComponent.isInvincible = false; // Clear invincibility on first thrust
    }

    // Handle missile spawn request (space bar)
    if (this.keysPressed.has(" ")) {
      const now = performance.now();
      // Only fire if enough time has passed since last shot
      if (now - this.lastMissileFireTime >= this.missileFireCooldown) {
        const transform = world.get<Transform>(this.shipEntityId, Transform);
        // Prevent shooting when invincible
        if (transform && !shipComponent.isInvincible) {
          // Emit missile spawn event
          world.emitEvent("missile_spawn_requested", {
            position: transform.position,
            direction: transform.rotation[2], // rotation around Z axis is our facing direction
            shipEntityId: this.shipEntityId,
          });
          this.lastMissileFireTime = now;
          shipComponent.isInvincible = false; // Clear invincibility on first shot
        }
      }
    }

    // Handle teleport/reset position (Q key)
    if (this.keysPressed.has("q") || this.keysPressed.has("Q")) {
      const transform = world.get<Transform>(this.shipEntityId, Transform);
      const velocity = world.get<Velocity>(this.shipEntityId, Velocity);
      
      if (transform && velocity) {
        // Zero out velocity
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        
        // Move to random position
        // Game world bounds from ShipMovementSystem camera calculation
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        const vFOV = (60 * Math.PI) / 180;
        const height_at_camera = 2 * Math.tan(vFOV / 2) * 100;
        const width_at_camera = height_at_camera * aspectRatio;
        
        const minX = -width_at_camera / 2;
        const maxX = width_at_camera / 2;
        const minY = -height_at_camera / 2;
        const maxY = height_at_camera / 2;
        
        transform.position[0] = minX + Math.random() * (maxX - minX);
        transform.position[1] = minY + Math.random() * (maxY - minY);
        
        console.log(`[PlayerInputSystem] Teleported to ${transform.position[0].toFixed(1)}, ${transform.position[1].toFixed(1)}`);
      }
      
      // Consume the Q key press
      this.keysPressed.delete("q");
      this.keysPressed.delete("Q");
      shipComponent.isInvincible = false; // Clear invincibility on teleport
    }
  }

  private setupKeyboardListeners(): void {
    globalThis.addEventListener("keydown", (event: KeyboardEvent) => {
      this.keysPressed.add(event.key);
    });

    globalThis.addEventListener("keyup", (event: KeyboardEvent) => {
      this.keysPressed.delete(event.key);
    });
  }

  dispose(): void {
    this.keysPressed.clear();
  }
}
