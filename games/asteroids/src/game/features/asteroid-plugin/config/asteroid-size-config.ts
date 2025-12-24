import type { AsteroidSizeTier } from "../components/asteroid.ts";

/**
 * Configuration for each asteroid size tier
 * Defines visual scale, velocity, and world scale
 * Collision radius is automatically calculated: meshScale * worldScale
 */
export interface AsteroidSizeConfig {
  /** Relative scale within the normalized [-1, 1] space (affects shape size) */
  meshScale: number;
  /** Velocity range in units per second */
  velocityRange: { min: number; max: number };
  /** World scale multiplier (scales normalized [-1, 1] geometry to world space) */
  worldScale: number;
  /** Number of asteroids to spawn when destroyed */
  spawnCount: number;
}

/**
 * Asteroid size tier configurations
 * Collision radius is automatically derived: meshScale * worldScale
 * This ensures visual size and collision detection stay perfectly synchronized
 */
export const ASTEROID_SIZE_CONFIG: Record<AsteroidSizeTier, AsteroidSizeConfig> = {
  3: {
    meshScale: 1.0,
    velocityRange: { min: 10, max: 10 },
    worldScale: 7.5,
    spawnCount: 2,
  },
  2: {
    meshScale: 0.6,
    velocityRange: { min: 12, max: 12 },
    worldScale: 7.5,
    spawnCount: 2,
  },
  1: {
    meshScale: 0.3,
    velocityRange: { min: 18, max: 18 },
    worldScale: 7,
    spawnCount: 0,
  },
};

/**
 * Helper function to get collision radius for a size tier
 * Collision radius = meshScale * worldScale
 */
export function getCollisionRadius(sizeTier: AsteroidSizeTier): number {
  const config = ASTEROID_SIZE_CONFIG[sizeTier];
  return config.meshScale * config.worldScale;
}
