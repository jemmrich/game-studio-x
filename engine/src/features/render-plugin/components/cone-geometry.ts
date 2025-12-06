export class ConeGeometry {
  radius: number = 1;
  height: number = 2;
  segments: number = 32;

  constructor(radius: number = 1, height: number = 2, segments: number = 32) {
    this.radius = radius;
    this.height = height;
    this.segments = segments;
  }
}
