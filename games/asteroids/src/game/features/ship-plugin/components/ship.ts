/**
 * ShipComponent
 * Represents the player-controlled ship with physics state and game rules.
 */
export class ShipComponent {
  lives: number;
  acceleration: number;
  maxVelocity: number;
  rotationSpeed: number;
  rotationDirection: 0 | 1 | -1; // -1 = left, 0 = none, 1 = right
  isThrusting: boolean;
  isInvincible: boolean;

  constructor(
    lives: number = 3,
    acceleration: number = 80,
    maxVelocity: number = 120,
    rotationSpeed: number = 4.71, // radians per second (~270 degrees/second)
  ) {
    this.lives = lives;
    this.acceleration = acceleration;
    this.maxVelocity = maxVelocity;
    this.rotationSpeed = rotationSpeed;
    this.rotationDirection = 0;
    this.isThrusting = false;
    this.isInvincible = true; // Start invincible
  }
}
