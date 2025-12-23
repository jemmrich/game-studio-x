/**
 * ShipComponent
 * Represents the player-controlled ship with physics state and game rules.
 */

export interface ShipComponentOptions {
  lives?: number;
  acceleration?: number;
  maxVelocity?: number;
  rotationSpeed?: number;
  boundingBoxEnabled?: boolean;
}

export class ShipComponent {
  lives: number;
  acceleration: number;
  maxVelocity: number;
  rotationSpeed: number;
  rotationDirection: 0 | 1 | -1; // -1 = left, 0 = none, 1 = right
  isThrusting: boolean;
  isInvincible: boolean;
  boundingBoxEnabled: boolean;

  constructor(options?: ShipComponentOptions) {
    const {
      lives = 3,
      acceleration = 80,
      maxVelocity = 120,
      rotationSpeed = 4.71,
      boundingBoxEnabled = false,
    } = options || {};

    this.lives = lives;
    this.acceleration = acceleration;
    this.maxVelocity = maxVelocity;
    this.rotationSpeed = rotationSpeed;
    this.rotationDirection = 0;
    this.isThrusting = false;
    this.isInvincible = true; // Start invincible
    this.boundingBoxEnabled = boundingBoxEnabled;
  }
}
