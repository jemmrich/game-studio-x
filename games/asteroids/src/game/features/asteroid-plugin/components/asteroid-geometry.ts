/**
 * AsteroidGeometry - Line-based geometry for rendering asteroids
 * Stores points to be rendered as connected lines forming the asteroid shape
 */
export class AsteroidGeometry {
  points: Array<{ x: number; y: number }> = [];

  constructor(points: Array<{ x: number; y: number }> = []) {
    // Create a copy to avoid sharing references with other entities
    this.points = points.map(p => ({ ...p }));
  }

  getPoints(): Array<{ x: number; y: number }> {
    return this.points;
  }
}
