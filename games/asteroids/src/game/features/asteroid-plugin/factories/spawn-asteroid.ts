import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { AsteroidComponent, type AsteroidSizeTier, Velocity, AngularVelocity, AsteroidGeometry } from "../components/mod.ts";
import { BasicMaterial, Visible } from "@engine/features/render-plugin/mod.ts";
import { Name } from "@engine/components/mod.ts";
import { getAsteroidGeometryByTier } from "../utils/asteroid-geometry.ts";
import { ASTEROID_SIZE_CONFIG } from "../config/asteroid-size-config.ts";

/**
 * Spawn an asteroid at the given position with specified size tier.
 * Constructs complete asteroid entity with:
 * - Transform (position, rotation, scale based on size)
 * - Velocity (random direction, speed based on size tier)
 * - AngularVelocity (rotation around Z axis)
 * - AsteroidComponent (size tier, rotation speed)
 * - Mesh/Collider (via shared engine components)
 */
export function spawnAsteroid(
  world: World,
  position: [number, number, number],
  sizeTier: AsteroidSizeTier,
): GUID {
  const entity = world.createEntity();

  // Get configuration for this size tier
  const config = ASTEROID_SIZE_CONFIG[sizeTier];
  const velocityRange = config.velocityRange;

  // Random direction for velocity

  // Random direction for velocity
  const angle = Math.random() * Math.PI * 2;
  const speed =
    velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;

  // Random rotation
  const randomRotation = Math.random() * Math.PI * 2;

  // Random Z-axis rotation speed (angular velocity)
  const angularVelocityZ = Math.random() * 2 - 1; // -1 to 1

  // Transform: position at given location, scale based on size
  // Use worldScale from config to expand from normalized [-1,1] coordinates to visible world space
  const finalScale = config.meshScale * config.worldScale;
  world.add(
    entity,
    new Transform(position, [0, 0, randomRotation], [finalScale, finalScale, finalScale]),
  );

  // Velocity component
  world.add(entity, new Velocity(velocityX, velocityY, 0));

  // Angular velocity component
  world.add(entity, new AngularVelocity(0, 0, angularVelocityZ));

  // Asteroid-specific component
  world.add(entity, new AsteroidComponent({ sizeTier, rotationSpeed: 1, boundingSphereEnabled: false }));

  // Geometry for rendering
  const geometryProcessor = getAsteroidGeometryByTier(sizeTier);
  const processedPoints = geometryProcessor.getPoints();
  world.add(entity, new AsteroidGeometry(processedPoints));
  // Visual components - default to full opacity (title screen asteroids will be visible)
  // GameplayScene will set to 0 before warp effect for fade-in animation
  const asteroidMaterial = new BasicMaterial([0.8, 0.8, 0.8, 1.0], 0.0, 0.5, 1.0); // light gray, fully opaque

  world.add(entity, asteroidMaterial);

  world.add(entity, new Visible(true));

  // Debug name
  const tierName = {
    3: "Large",
    2: "Medium",
    1: "Small",
  }[sizeTier];
  world.add(entity, new Name(`Asteroid_${tierName}_${entity}`));

  return entity;
}
