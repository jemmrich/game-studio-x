import { EntityManager } from "../ecs/entity-manager.ts";
import { ComponentManager } from "../ecs/component-manager.ts";
import { SystemManager } from "../ecs/system-manager.ts";
import { ResourceManager } from "../ecs/resource-manager.ts";
import { Query } from "./query.ts";
import type { GUID } from "../utils/guid.ts";

interface WorldEvent {
  type: string;
  data: any;
}

export class World {
  private entityManager = new EntityManager();
  private componentManager = new ComponentManager();
  private resourceManager = new ResourceManager();
  private systemManager = new SystemManager(this);
  private events: WorldEvent[] = [];
  private eventListeners: Map<string, ((event: WorldEvent) => void)[]> = new Map();

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

  hasResource(name: string): boolean {
    return this.resourceManager.has(name);
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

  // ─────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────

  /**
   * Emit a typed event to all listeners.
   * Events are stored for retrieval and notified immediately to listeners.
   * 
   * @param type - The event type identifier
   * @param data - The event payload (typed)
   */
  emitEvent<T = any>(type: string, data: T = {} as T): void {
    const event: WorldEvent = { type, data };
    this.events.push(event);

    // Notify listeners immediately
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  /**
   * Get stored events of a specific type.
   * 
   * @param type - The event type identifier
   * @returns Array of events of that type
   */
  getEvents<T = any>(type: string): WorldEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  /**
   * Subscribe to events of a specific type.
   * Returns an unsubscribe function for cleanup.
   * 
   * @param type - The event type identifier
   * @param listener - Callback function receiving the typed event
   * @returns Unsubscribe function
   */
  onEvent<T = any>(type: string, listener: (event: { type: string; data: T }) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener as any);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener as any);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  clearEvents(): void {
    this.events = [];
  }

  // internal access
  _entities() {
    return this.entityManager;
  }
  _components() {
    return this.componentManager;
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────

  /**
   * Get all entity IDs in the world
   */
  entities(): GUID[] {
    return this.getAllEntities();
  }

  /**
   * Dispose the world and clean up all resources
   */
  dispose(): void {
    // Clear all entities
    const allEntities = this.getAllEntities();
    for (const entity of allEntities) {
      this.destroyEntity(entity);
    }
    this.clearEntityRecycling();
  }
}
