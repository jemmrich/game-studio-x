/**
 * AlienComponent
 * Marks an entity as an alien and tracks alien state.
 * Works in composition with Transform, Velocity, and other movement components.
 */

export interface AlienComponentOptions {
  alienType?: string;
}

/**
 * Represents an alien entity in the game.
 * Used by ECS queries to track active aliens during gameplay.
 */
export class AlienComponent {
  alienType: string;

  constructor(options?: AlienComponentOptions) {
    const { alienType = "standard" } = options || {};
    this.alienType = alienType;
  }
}
