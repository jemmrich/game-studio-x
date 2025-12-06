import type { World } from "../../../core/world.ts";
import { RenderContext } from "../resources/render-context.ts";
import { CameraState } from "../resources/camera-state.ts";
import * as math from "../../../utils/math.ts";

/**
 * System that updates view and projection matrices based on camera state
 * Runs every frame before rendering
 */
export class CameraUpdateSystem {
  enabled: boolean = true;

  update(world: World, _dt: number): void {
    const renderContext = world.getResource<RenderContext>("RenderContext");
    const cameraState = world.getResource<CameraState>("CameraState");

    if (!renderContext.gl) return;

    // Calculate view matrix from camera position, target, and up vector
    const viewMatrix = math.viewMatrix(
      cameraState.position,
      cameraState.target,
      cameraState.up,
    );

    // Calculate projection matrix from camera parameters
    const fovRadians = (cameraState.fov * Math.PI) / 180;
    const projectionMatrix = math.perspectiveMatrix(
      fovRadians,
      cameraState.aspectRatio,
      cameraState.near,
      cameraState.far,
    );

    // Store in render context
    renderContext.viewMatrix = viewMatrix;
    renderContext.projectionMatrix = projectionMatrix;
  }
}
