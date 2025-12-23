/**
 * BoundingBox Component
 * Stores axis-aligned bounding box dimensions for collision/debug visualization
 */
export class BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  get width(): number {
    return this.maxX - this.minX;
  }

  get height(): number {
    return this.maxY - this.minY;
  }

  get centerX(): number {
    return (this.minX + this.maxX) / 2;
  }

  get centerY(): number {
    return (this.minY + this.maxY) / 2;
  }

  static fromPoints(
    points: Array<{ x: number; y: number }>,
  ): BoundingBox {
    if (points.length === 0) {
      return new BoundingBox(0, 0, 0, 0);
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return new BoundingBox(minX, maxX, minY, maxY);
  }
}
