import { EntityManager } from "../ecs/entity-manager.ts";
import { ComponentManager } from "../ecs/component-manager.ts";
import { SystemManager } from "../ecs/system-manager.ts";
import { ResourceManager } from "../ecs/resource-manager.ts";
import { Query } from "./query.ts";
import type { GUID } from "../utils/guid.ts";

export class World {
  private entityManager = new EntityManager();
  private componentManager = new ComponentManager();
  private resourceManager = new ResourceManager();
  private systemManager = new SystemManager(this);

  // ─────────────────────────────────────────────
  // ENTITY
  // ─────────────────────────────────────────────

  createEntity(): GUID {
    return this.entityManager.create();
  }

  destroyEntity(entity: GUID): void {
    this.componentManager.removeAllForEntity(entity);
    this.entityManager.destroy(entity);
  }

  entityExists(entity: GUID): boolean {
    return this.entityManager.exists(entity);
  }

  getAllEntities(): GUID[] {
    return this.entityManager.getAllEntities();
  }

  /**
   * Clear the recycled entity ID pool to prevent ID reuse.
   * Useful after major cleanup operations to ensure fresh entity IDs.
   */
  clearEntityRecycling(): void {
    this.entityManager.clearRecycledPool();
  }

  // ─────────────────────────────────────────────
  // COMPONENTS
  // ─────────────────────────────────────────────

  add<T>(entity: GUID, component: T): void {
    this.componentManager.add(entity, component);
  }

  get<T>(entity: GUID, componentClass: Function): T | undefined {
    return this.componentManager.get(entity, componentClass);
  }

  remove(entity: GUID, componentClass: Function): void {
    this.componentManager.remove(entity, componentClass);
  }

  has(entity: GUID, componentClass: Function): boolean {
    return this.componentManager.has(entity, componentClass);
  }

  getComponentsForEntity(entity: GUID): [Function, any][] {
    return this.componentManager.getComponentsForEntity(entity);
  }

  // ─────────────────────────────────────────────
  // RESOURCES
  // ─────────────────────────────────────────────

  addResource(name: string, resource: any) {
    this.resourceManager.add(name, resource);
  }

  getResource<T>(name: string): T {
    return this.resourceManager.get<T>(name);
  }

  // ─────────────────────────────────────────────
  // SYSTEMS
  // ─────────────────────────────────────────────

  addSystem(system: any) {
    this.systemManager.add(system);
  }

  updateSystems(dt: number) {
    this.systemManager.updateAll(dt);
  }

  // ─────────────────────────────────────────────
  // QUERY
  // ─────────────────────────────────────────────

  query(...components: Function[]) {
    return new Query(this, components);
  }

  // internal access
  _entities() {
    return this.entityManager;
  }
  _components() {
    return this.componentManager;
  }
}
