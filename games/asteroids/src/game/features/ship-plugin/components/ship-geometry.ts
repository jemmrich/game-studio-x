/**
 * ShipGeometry - Simple line-based geometry
 * Just stores points to be rendered as lines
 */
export class ShipGeometry {
  points: Array<{ x: number; y: number }> = [];

  constructor(points: Array<{ x: number; y: number }> = []) {
    this.points = points;
  }
}
