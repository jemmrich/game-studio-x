export class SystemManager {
  private systems: any[] = [];

  constructor(private world: any) {}

  add(system: any) {
    if (system.enabled === undefined) system.enabled = true;
    this.systems.push(system);
  }

  updateAll(dt: number) {
    for (const system of this.systems) {
      if (system.enabled) system.update(this.world, dt);
    }
  }

  /**
   * Find a system by its constructor name
   * Useful for testing and debugging
   */
  findSystemByName(name: string): any {
    return this.systems.find((s) => s.constructor.name === name);
  }
}
