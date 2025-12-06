export class SphereGeometry {
  radius: number = 1;
  segments: number = 32;
  rings: number = 16;

  constructor(radius: number = 1, segments: number = 32, rings: number = 16) {
    this.radius = radius;
    this.segments = segments;
    this.rings = rings;
  }
}
