/**
 * Asteroid geometry processing utilities
 * Converts asteroid vector definitions to normalized, centered coordinates
 */
import {
  VECTOR_ASTEROID_LARGE,
  VECTOR_ASTEROID_MEDIUM,
  VECTOR_ASTEROID_SMALL,
} from "../utils/asteroid-geometry-constants.ts";

/**
 * AsteroidGeometryProcessor
 * Takes raw asteroid vectors and processes them for rendering:
 * - Centers coordinates around origin
 * - Normalizes to unit scale
 */
export class AsteroidGeometryProcessor {
  private originalPoints: Array<{ x: number; y: number }>;

  constructor(vectors: Array<{ x: number; y: number }>) {
    this.originalPoints = vectors;
  }

  /**
   * Get processed points centered at origin and normalized
   */
  getPoints(): Array<{ x: number; y: number }> {
    // Calculate bounding box
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const point of this.originalPoints) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    // Calculate dimensions
    const width = maxX - minX;
    const height = maxY - minY;
    const maxDim = Math.max(width, height);

    // Center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Normalize and center points
    const processed = this.originalPoints.map((point) => ({
      x: (point.x - centerX) / (maxDim / 2),
      y: (point.y - centerY) / (maxDim / 2),
    }));
    return processed;
  }
}

/**
 * Get processor for large asteroids
 */
export function getLargeAsteroidGeometry(): AsteroidGeometryProcessor {
  return new AsteroidGeometryProcessor(VECTOR_ASTEROID_LARGE);
}

/**
 * Get processor for medium asteroids
 */
export function getMediumAsteroidGeometry(): AsteroidGeometryProcessor {
  return new AsteroidGeometryProcessor(VECTOR_ASTEROID_MEDIUM);
}

/**
 * Get processor for small asteroids
 */
export function getSmallAsteroidGeometry(): AsteroidGeometryProcessor {
  return new AsteroidGeometryProcessor(VECTOR_ASTEROID_SMALL);
}

/**
 * Get processor for any asteroid size tier
 */
export function getAsteroidGeometryByTier(
  sizeTier: 1 | 2 | 3,
): AsteroidGeometryProcessor {
  switch (sizeTier) {
    case 3:
      return getLargeAsteroidGeometry();
    case 2:
      return getMediumAsteroidGeometry();
    case 1:
      return getSmallAsteroidGeometry();
  }
}
