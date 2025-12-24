import type { GUID } from "@engine/utils/guid.ts";

/**
 * MissileComponent
 *
 * Represents a missile/projectile entity that travels in a direction with velocity.
 * Missiles have a limited lifetime and are automatically destroyed when that time expires.
 *
 * The missile composes this component with Transform and Velocity components to create
 * a complete projectile entity that can be spawned by any actor.
 *
 * Properties:
 * - lifetime: Time in seconds before the missile is automatically destroyed
 * - speed: The velocity magnitude in units per second
 * - spawnerId: Reference to the entity that spawned this missile (for collision and tracking)
 */
export class MissileComponent {
  lifetime: number;    // Time in seconds before auto-destroy
  speed: number;       // Missile velocity magnitude (units/second)
  spawnerId: GUID;     // The entity that spawned this missile

  constructor(lifetime: number, speed: number, spawnerId: GUID) {
    this.lifetime = lifetime;
    this.speed = speed;
    this.spawnerId = spawnerId;
  }
}
