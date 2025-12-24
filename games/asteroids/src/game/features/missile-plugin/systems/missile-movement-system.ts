import type { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";
import { MissileComponent } from "../components/missile.ts";

/**
 * MissileMovementSystem
 * Updates missile positions based on their velocity components.
 * Handles screen wrapping for missiles that leave the visible area.
 */
export class MissileMovementSystem {
  private gameWorldBounds = {
    minX: -400,
    maxX: 400,
    minY: -300,
    maxY: 300,
  };
  private hasLoggedDimensions = false;

  update(world: World, dt: number): void {
    // Calculate game world bounds based on camera FOV and aspect ratio
    if (!this.hasLoggedDimensions) {
      const renderContext = world.getResource("render_context") as
        | { width: number; height: number }
        | undefined;

      if (!renderContext) {
        console.warn("[MissileMovementSystem] render_context resource not found");
        return;
      }

      const width = renderContext.width;
      const height = renderContext.height;
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

      this.hasLoggedDimensions = true;
    }

    // Query for all missiles with Transform and Velocity
    const query = world.query(MissileComponent, Transform, Velocity);

    for (const entity of query.entities()) {
      const transform = world.get<Transform>(entity, Transform);
      const velocity = world.get<Velocity>(entity, Velocity);

      if (!transform || !velocity) continue;

      // Update position based on velocity
      transform.position[0] += velocity.x * dt;
      transform.position[1] += velocity.y * dt;
      transform.position[2] += velocity.z * dt;

      // Screen wrapping (toroidal space)
      if (transform.position[0] < this.gameWorldBounds.minX) {
        transform.position[0] = this.gameWorldBounds.maxX;
      } else if (transform.position[0] > this.gameWorldBounds.maxX) {
        transform.position[0] = this.gameWorldBounds.minX;
      }

      if (transform.position[1] < this.gameWorldBounds.minY) {
        transform.position[1] = this.gameWorldBounds.maxY;
      } else if (transform.position[1] > this.gameWorldBounds.maxY) {
        transform.position[1] = this.gameWorldBounds.minY;
      }
    }
  }
}
