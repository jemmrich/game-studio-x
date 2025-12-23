import type { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { ShipGeometry } from "../components/ship-geometry.ts";
import { PlayerShipGeometry } from "../utils/player-ship-geometry.ts";
import {
  VECTOR_SHIP_WITHOUT_ENGINE,
  VECTOR_SHIP_WITH_ENGINE,
} from "../utils/ship-geometry-constants.ts";

/**
 * ShipThrustVisualSystem
 * Switches ship geometry between normal and thrusting states
 * Shows engine flame when the ship is accelerating
 */
export class ShipThrustVisualSystem {
  private lastThrustState: Map<any, boolean> = new Map();

  update(world: World, _dt: number): void {
    // Query for all entities with Ship and ShipGeometry
    const query = world.query(ShipComponent, ShipGeometry);

    for (const [entity, shipComponent, shipGeometry] of query) {
      if (!shipComponent || !shipGeometry) continue;

      const wasThrusting = this.lastThrustState.get(entity) ?? false;
      const isThrusting = shipComponent.isThrusting;

      // If thrust state changed, update the geometry
      if (wasThrusting !== isThrusting) {
        const geometryPoints = isThrusting 
          ? VECTOR_SHIP_WITH_ENGINE 
          : VECTOR_SHIP_WITHOUT_ENGINE;

        const playerShipGeometry = new PlayerShipGeometry(geometryPoints);
        shipGeometry.points = playerShipGeometry.getPoints();

        this.lastThrustState.set(entity, isThrusting);
      }
    }
  }
}
