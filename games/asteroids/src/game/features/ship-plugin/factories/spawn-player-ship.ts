import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import {
  BasicMaterial,
  Visible,
} from "@engine/features/render-plugin/mod.ts";
import { Name } from "@engine/components/mod.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { ShipGeometry } from "../components/ship-geometry.ts";
import { PlayerShipGeometry } from "../utils/player-ship-geometry.ts";
import { BoundingBox } from "../components/bounding-box.ts";
import { VECTOR_SHIP_WITHOUT_ENGINE } from "../utils/ship-geometry-constants.ts";

/**
 * Spawn the player ship at the center of the screen
 */
export function spawnPlayerShip(world: World): GUID {
  const entity = world.createEntity();

  // Process geometry: center, scale, rotate
  const shipGeometry = new PlayerShipGeometry(VECTOR_SHIP_WITHOUT_ENGINE);

  // Position at center, scaled down to 0.2x
  world.add(entity, new Transform([0, 0, 0], [0, 0, 0], [0.15, 0.15, 0.15]));

  // Velocity for momentum
  world.add(entity, new Velocity(0, 0, 0));

  // Ship-specific component
  world.add(entity, new ShipComponent({ boundingBoxEnabled: false }));

  // Rendering - store processed geometry points
  world.add(entity, new ShipGeometry(shipGeometry.getPoints()));

  // Bounding box for collision and debug visualization
  const bbox = BoundingBox.fromPoints(shipGeometry.getPoints());
  world.add(entity, bbox);

  world.add(entity, new BasicMaterial({
    color: [1.0, 1.0, 1.0, 1.0], // white
  }));

  world.add(entity, new Visible(true));

  // Debug name
  world.add(entity, new Name("PlayerShip"));

  return entity;
}
