export class CameraState {
  position: [number, number, number] = [0, 0, 5];
  target: [number, number, number] = [0, 0, 0];
  up: [number, number, number] = [0, 1, 0];
  fov: number = 75;
  near: number = 0.1;
  far: number = 1000;
  aspectRatio: number = 16 / 9;

  constructor(
    position: [number, number, number] = [0, 0, 5],
    target: [number, number, number] = [0, 0, 0],
    up: [number, number, number] = [0, 1, 0],
    fov: number = 75,
    near: number = 0.1,
    far: number = 1000,
    aspectRatio: number = 16 / 9
  ) {
    this.position = position;
    this.target = target;
    this.up = up;
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspectRatio = aspectRatio;
  }
}
