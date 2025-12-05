export class Time {
  dt = 0;
  elapsed = 0;

  update(dt: number) {
    this.dt = dt;
    this.elapsed += dt;
  }
}
