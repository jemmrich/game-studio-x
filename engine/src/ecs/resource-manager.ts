export class ResourceManager {
  private resources = new Map<string, any>();

  add(name: string, resource: any) {
    this.resources.set(name, resource);
  }

  get<T>(name: string): T {
    const res = this.resources.get(name);
    if (!res) throw new Error(`Resource '${name}' not found`);
    return res;
  }

  has(name: string): boolean {
    return this.resources.has(name);
  }
}
