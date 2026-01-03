import type { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";

/**
 * ShipMovementSystem
 * Applies physics to ship motion:
 * - Update velocity based on thrust and rotation
 * - Clamp velocity to maxVelocity
 * - Update transform position
 * - Apply screen wrapping
 */
export class ShipMovementSystem {
  // Game world bounds (in world coordinates, not pixels)
  // Camera is at [0, 0, 100] looking at origin, so visible bounds extend from -bounds to +bounds
  private gameWorldBounds = {
    minX: -400,
    maxX: 400,
    minY: -300,
    maxY: 300,
  };
  private lastCanvasWidth = 0;
  private lastCanvasHeight = 0;

  /**
   * Calculate game world bounds based on camera FOV and canvas dimensions.
   * Must be recalculated whenever canvas resizes.
   */
  private updateGameWorldBounds(width: number, height: number): void {
    const aspectRatio = width / height;
    
    // Camera is 100 units away, FOV is 60 degrees
    const vFOV = (60 * Math.PI) / 180; // convert to radians
    const height_at_camera = 2 * Math.tan(vFOV / 2) * 100; // height of visible area
    const width_at_camera = height_at_camera * aspectRatio;
    
    this.gameWorldBounds = {
      minX: -width_at_camera / 2,
      maxX: width_at_camera / 2,
      minY: -height_at_camera / 2,
      maxY: height_at_camera / 2,
    };
  }

  update(world: World, dt: number): void {
    // Get render context and check if canvas was resized
    const renderContext = world.getResource("render_context") as
      | { width: number; height: number }
      | undefined;

    if (!renderContext) {
      console.warn("[ShipMovementSystem] render_context resource not found");
      return;
    }

    // Recalculate bounds if canvas size changed
    if (renderContext.width !== this.lastCanvasWidth || renderContext.height !== this.lastCanvasHeight) {
      this.updateGameWorldBounds(renderContext.width, renderContext.height);
      this.lastCanvasWidth = renderContext.width;
      this.lastCanvasHeight = renderContext.height;
      console.log(`[ShipMovementSystem] Game world bounds: X[${this.gameWorldBounds.minX.toFixed(1)}, ${this.gameWorldBounds.maxX.toFixed(1)}] Y[${this.gameWorldBounds.minY.toFixed(1)}, ${this.gameWorldBounds.maxY.toFixed(1)}]`);
    }

    // Query for all entities with Ship, Transform, and Velocity
    const query = world.query(ShipComponent, Transform, Velocity);

    for (const [entity, shipComponent, transform, velocity] of query) {
      if (!shipComponent || !transform || !velocity) continue;

      // Update rotation based on rotation direction
      if (shipComponent.rotationDirection !== 0) {
        transform.rotation[2] += shipComponent.rotationDirection * shipComponent.rotationSpeed * dt;
      }

      // Update velocity based on thrust
      if (shipComponent.isThrusting) {
        // Direction of travel is based on rotation around Z axis
        // Add π/2 to rotate from math coords (0 = right) to screen coords (0 = up)
        const directionAngle = transform.rotation[2] + Math.PI / 2;
        const thrustX = Math.cos(directionAngle) * shipComponent.acceleration * dt;
        const thrustY = Math.sin(directionAngle) * shipComponent.acceleration * dt;

        velocity.x += thrustX;
        velocity.y += thrustY;
      }

      // Apply friction to velocity each frame
      velocity.x *= shipComponent.velocityFriction;
      velocity.y *= shipComponent.velocityFriction;

      // Clamp velocity to max
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > shipComponent.maxVelocity) {
        const scale = shipComponent.maxVelocity / speed;
        velocity.x *= scale;
        velocity.y *= scale;
      }

      // Update position
      transform.position[0] += velocity.x * dt;
      transform.position[1] += velocity.y * dt;

      // Screen wrapping (toroidal space) - using world coordinates
      // Wrap X position
      if (transform.position[0] < this.gameWorldBounds.minX) {
        transform.position[0] = this.gameWorldBounds.maxX;
      } else if (transform.position[0] > this.gameWorldBounds.maxX) {
        transform.position[0] = this.gameWorldBounds.minX;
      }

      // Wrap Y position - when player goes off top (Y < minY), wrap to bottom (Y = maxY)
      if (transform.position[1] < this.gameWorldBounds.minY) {
        transform.position[1] = this.gameWorldBounds.maxY;
      } else if (transform.position[1] > this.gameWorldBounds.maxY) {
        transform.position[1] = this.gameWorldBounds.minY;
      }
    }
  }
}
