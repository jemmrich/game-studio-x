export class CylinderGeometry {
  radiusTop: number = 1;
  radiusBottom: number = 1;
  height: number = 2;
  segments: number = 32;

  constructor(
    radiusTop: number = 1,
    radiusBottom: number = 1,
    height: number = 2,
    segments: number = 32,
  ) {
    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.height = height;
    this.segments = segments;
  }
}
