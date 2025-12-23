/**
 * PlayerShipGeometry
 * Processes and manages ship geometry from point arrays
 * Handles centering, scaling, and rotation to prepare geometry for rendering
 */
export interface Point {
  x: number;
  y: number;
  z?: number;
}

export class PlayerShipGeometry {
  points: Point[];
  originalPoints: Point[];

  constructor(pointArray: Point[]) {
    // Keep original for reference
    this.originalPoints = [...pointArray];
    // Work with a copy
    this.points = this.copyPoints(pointArray);
    
    // Apply transformations in order
    this.center();
    this.scale(0.5, 0.5);  // Larger scale
    this.rotateZ(Math.PI); // Face north
  }

  /**
   * Center geometry around origin
   */
  private center(): void {
    if (this.points.length === 0) return;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    // Calculate center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Translate all points
    for (const point of this.points) {
      point.x -= centerX;
      point.y -= centerY;
    }
  }

  /**
   * Scale geometry by given factors
   */
  private scale(scaleX: number, scaleY: number): void {
    for (const point of this.points) {
      point.x *= scaleX;
      point.y *= scaleY;
    }
  }

  /**
   * Rotate geometry around Z axis (2D rotation)
   */
  private rotateZ(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const point of this.points) {
      const x = point.x;
      const y = point.y;
      point.x = x * cos - y * sin;
      point.y = x * sin + y * cos;
    }
  }

  /**
   * Helper to copy points array
   */
  private copyPoints(points: Point[]): Point[] {
    return points.map(p => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
  }

  /**
   * Get vertices as a flat array for rendering (x, y, 0 for each point)
   */
  getVertices(): number[] {
    const vertices: number[] = [];
    for (const point of this.points) {
      vertices.push(point.x, point.y, point.z ?? 0);
    }
    return vertices;
  }

  /**
   * Get points for rendering as 2D
   */
  getPoints(): Array<{ x: number; y: number }> {
    return this.points.map(p => ({ x: p.x, y: p.y }));
  }
}
