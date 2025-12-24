/**
 * AsteroidGeometry - Line-based geometry for rendering asteroids
 * Stores points to be rendered as connected lines forming the asteroid shape
 */
export class AsteroidGeometry {
  points: Array<{ x: number; y: number }> = [];

  constructor(points: Array<{ x: number; y: number }> = []) {
    this.points = points;
  }

  getPoints(): Array<{ x: number; y: number }> {
    return this.points;
  }
}
