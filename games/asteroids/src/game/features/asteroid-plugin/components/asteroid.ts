/**
 * AsteroidComponent
 * Represents an asteroid entity with size tier and rotation properties.
 * Works in composition with Transform, Velocity, and AngularVelocity components.
 */

export type AsteroidSizeTier = 1 | 2 | 3;

export interface AsteroidComponentOptions {
  sizeTier?: AsteroidSizeTier;
  rotationSpeed?: number;
  boundingSphereEnabled?: boolean;
}

/**
 * Asteroid size tier definitions
 * Tier 3: Large - 2-3 u/s velocity, breaks into Medium asteroids
 * Tier 2: Medium - 3-4 u/s velocity, breaks into Small asteroids
 * Tier 1: Small - 4-5 u/s velocity, despawns when destroyed
 */
export class AsteroidComponent {
  sizeTier: AsteroidSizeTier;
  rotationSpeed: number;
  boundingSphereEnabled: boolean;

  constructor(options?: AsteroidComponentOptions) {
    const {
      sizeTier = 3,
      rotationSpeed = 1,
      boundingSphereEnabled = false,
    } = options || {};

    this.sizeTier = sizeTier;
    this.rotationSpeed = rotationSpeed;
    this.boundingSphereEnabled = boundingSphereEnabled;
  }

  /**
   * Get velocity range for asteroid size tier
   */
  static getVelocityRange(sizeTier: AsteroidSizeTier): { min: number; max: number } {
    switch (sizeTier) {
      case 3:
        return { min: 20, max: 30 };
      case 2:
        return { min: 25, max: 35 };
      case 1:
        return { min: 30, max: 40 };
    }
  }

  /**
   * Get collision radius for asteroid size tier
   */
  static getCollisionRadius(sizeTier: AsteroidSizeTier): number {
    switch (sizeTier) {
      case 3:
        return 20;
      case 2:
        return 12;
      case 1:
        return 6;
    }
  }

  /**
   * Get mesh scale for asteroid size tier
   */
  static getMeshScale(sizeTier: AsteroidSizeTier): number {
    switch (sizeTier) {
      case 3:
        return 1.0;
      case 2:
        return 0.6;
      case 1:
        return 0.3;
    }
  }

  /**
   * Get spawn count when asteroid is destroyed
   * Returns 0 if asteroid despawns (size 1)
   */
  static getBreakCount(sizeTier: AsteroidSizeTier): number {
    switch (sizeTier) {
      case 3:
      case 2:
        return 2;
      case 1:
        return 0;
    }
  }

  /**
   * Get next size tier when asteroid breaks
   * Returns 0 if no next tier (size 1 despawns)
   */
  static getNextSizeTier(sizeTier: AsteroidSizeTier): AsteroidSizeTier | null {
    switch (sizeTier) {
      case 3:
        return 2;
      case 2:
        return 1;
      case 1:
        return null;
    }
  }
}
