import type { World } from "@engine/core/world.ts";
import { AsteroidComponent, Velocity, AngularVelocity } from "../components/mod.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";

/**
 * AsteroidMovementSystem
 * Applies velocity and rotation to asteroids.
 * - Update position based on velocity
 * - Apply rotation based on angular velocity
 * - Wrap asteroids at screen edges (toroidal space)
 */
export class AsteroidMovementSystem {
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
      return;
    }

    // Recalculate bounds if canvas size changed
    if (renderContext.width !== this.lastCanvasWidth || renderContext.height !== this.lastCanvasHeight) {
      this.updateGameWorldBounds(renderContext.width, renderContext.height);
      this.lastCanvasWidth = renderContext.width;
      this.lastCanvasHeight = renderContext.height;
    }

    // Query for all entities with Asteroid, Transform, and Velocity
    const query = world.query(AsteroidComponent, Transform);

    for (const [entity, asteroidComponent, transform] of query) {
      if (!asteroidComponent || !transform) continue;

      // Get velocity component
      const velocity = world.get<Velocity>(entity, Velocity);

      if (velocity) {
        // Update position based on velocity
        transform.position[0] += velocity.x * dt;
        transform.position[1] += velocity.y * dt;
        transform.position[2] += velocity.z * dt;
      }

      // Get angular velocity component
      const angularVelocity = world.get<AngularVelocity>(entity, AngularVelocity);

      if (angularVelocity) {
        // Update rotation based on angular velocity
        transform.rotation[0] += angularVelocity.x * asteroidComponent.rotationSpeed * dt;
        transform.rotation[1] += angularVelocity.y * asteroidComponent.rotationSpeed * dt;
        transform.rotation[2] += angularVelocity.z * asteroidComponent.rotationSpeed * dt;
      }

      // Apply screen wrapping (toroidal space)
      // Wrap X position
      if (transform.position[0] < this.gameWorldBounds.minX) {
        transform.position[0] = this.gameWorldBounds.maxX;
      } else if (transform.position[0] > this.gameWorldBounds.maxX) {
        transform.position[0] = this.gameWorldBounds.minX;
      }

      // Wrap Y position
      if (transform.position[1] < this.gameWorldBounds.minY) {
        transform.position[1] = this.gameWorldBounds.maxY;
      } else if (transform.position[1] > this.gameWorldBounds.maxY) {
        transform.position[1] = this.gameWorldBounds.minY;
      }
    }
  }
}
