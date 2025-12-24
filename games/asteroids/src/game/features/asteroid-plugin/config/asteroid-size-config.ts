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
export const ASTEROID_SIZE_CONFIG = Object.freeze({
  3: Object.freeze({
    meshScale: 1.0,
    velocityRange: Object.freeze({ min: 10, max: 10 }),
    worldScale: 7.5,
    spawnCount: 2,
  }),
  2: Object.freeze({
    meshScale: 0.6,
    velocityRange: Object.freeze({ min: 12, max: 12 }),
    worldScale: 7.5,
    spawnCount: 2,
  }),
  1: Object.freeze({
    meshScale: 0.3,
    velocityRange: Object.freeze({ min: 18, max: 18 }),
    worldScale: 7,
    spawnCount: 0,
  }),
} as const) as Record<AsteroidSizeTier, AsteroidSizeConfig>;

/**
 * Helper function to get collision radius for a size tier
 * Collision radius = meshScale * worldScale
 */
export function getCollisionRadius(sizeTier: AsteroidSizeTier): number {
  const config = ASTEROID_SIZE_CONFIG[sizeTier];
  return config.meshScale * config.worldScale;
}
