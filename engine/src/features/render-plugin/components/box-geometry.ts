export class BoxGeometry {
  width: number = 1;
  height: number = 1;
  depth: number = 1;

  constructor(width: number = 1, height: number = 1, depth: number = 1) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}
