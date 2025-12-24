/**
 * MissileGeometry - Simple point geometry for rendering missiles as dots
 * Stores a single point at the origin to be rendered as a small dot on screen
 */
export class MissileGeometry {
  points: Array<{ x: number; y: number }> = [];

  constructor() {
    // Single point at origin - will be rendered as a dot
    this.points = [{ x: 0, y: 0 }];
  }

  getPoints(): Array<{ x: number; y: number }> {
    return this.points;
  }
}
