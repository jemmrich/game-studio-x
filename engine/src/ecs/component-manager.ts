import type { GUID } from "../utils/guid.ts";

export class ComponentManager {
  private stores = new Map<Function, Map<GUID, any>>();

  add(entity: GUID, component: any): void {
    const compClass = component.constructor;
    if (!this.stores.has(compClass)) {
      this.stores.set(compClass, new Map());
    }
    this.stores.get(compClass)!.set(entity, component);
  }

  get(entity: GUID, compClass: Function): any {
    return this.stores.get(compClass)?.get(entity);
  }

  has(entity: GUID, compClass: Function): boolean {
    return this.stores.get(compClass)?.has(entity) ?? false;
  }

  remove(entity: GUID, compClass: Function): void {
    this.stores.get(compClass)?.delete(entity);
  }

  removeAllForEntity(entity: GUID): void {
    for (const store of this.stores.values()) {
      store.delete(entity);
    }
  }

  getStore(compClass: Function) {
    return this.stores.get(compClass);
  }

  /**
   * Get all components attached to a given entity
   * Returns an array of [componentClass, componentInstance] tuples
   */
  getComponentsForEntity(entity: GUID): [Function, any][] {
    const components: [Function, any][] = [];
    for (const [compClass, store] of this.stores.entries()) {
      const component = store.get(entity);
      if (component !== undefined) {
        components.push([compClass, component]);
      }
    }
    return components;
  }
}
