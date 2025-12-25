# Entity Lifecycle Improvements

## Problem Statement
Entity ID recycling causes visual artifacts when IDs are reused in the same frame before render systems can clean up old visuals. This issue affects any game using the engine and requires defensive coding in every render system.

## Solution: Engine-Level Entity Lifecycle Management

### Phase 1: Two-Phase Entity Destruction (Critical)

**Location:** `engine/src/core/world.ts`

```typescript
export class World {
  private entitiesToDestroy: Set<GUID> = new Set();

  /**
   * Mark entity for destruction.
   * Entity ID will be recycled at end of frame to allow cleanup.
   */
  destroyEntity(entityId: GUID): void {
    // Emit pre-destruction event
    this.emitEvent("entity_will_destroy", { entityId });
    
    // Remove all components immediately
    this.removeAllComponents(entityId);
    
    // Mark for ID recycling (delayed until end of frame)
    this.entitiesToDestroy.add(entityId);
    
    // Emit post-destruction event
    this.emitEvent("entity_destroyed", { entityId });
  }

  /**
   * Called at end of each frame to recycle destroyed entity IDs
   */
  clearEvents(): void {
    // Clear event queue
    this.events.clear();
    
    // Recycle destroyed entities AFTER all systems have processed
    for (const entityId of this.entitiesToDestroy) {
      this.entityIdPool.recycle(entityId);
    }
    this.entitiesToDestroy.clear();
  }
}
```

**Benefits:**
- Guarantees entity IDs aren't reused until next frame
- Allows all systems to process destruction events
- No game code changes required

**Breaking Changes:** None

### Phase 2: Entity Lifecycle Events

**Location:** `engine/src/core/world.ts`

Add standardized entity lifecycle events:

```typescript
// Events automatically emitted by World
interface EntityLifecycleEvents {
  "entity_created": { entityId: GUID };
  "entity_will_destroy": { entityId: GUID };  // Before components removed
  "entity_destroyed": { entityId: GUID };     // After components removed
}
```

**Usage in game code:**

```typescript
// Render systems can listen for cleanup events
setup(world: World): void {
  world.onEvent("entity_destroyed", (event) => {
    this.clearVisuals(event.data.entityId);
  });
}
```

### Phase 3: Base Render System Class

**Location:** `engine/src/features/render-plugin/systems/base-render-system.ts`

Create abstract base class with built-in cleanup patterns:

```typescript
export abstract class BaseRenderSystem<TComponent, TVisual> {
  protected visuals: Map<GUID, TVisual> = new Map();
  private scene?: any; // THREE.Scene or other renderer
  
  constructor(scene?: any) {
    this.scene = scene;
  }
  
  setup(world: World): void {
    // Auto-register for cleanup events
    world.onEvent("entity_destroyed", (event) => {
      this.clearEntityVisuals(event.data.entityId);
    });
  }
  
  update(world: World, dt: number): void {
    const query = world.query(...this.getComponentTypes());
    const activeEntities = new Set(query.entities());
    
    // Render active entities
    for (const entity of activeEntities) {
      this.renderEntity(world, entity);
    }
    
    // Cleanup removed entities
    this.cleanupRemovedEntities(activeEntities);
  }
  
  protected renderEntity(world: World, entity: GUID): void {
    let visual = this.visuals.get(entity);
    
    if (!visual) {
      // Defensive check for stale visuals (entity ID recycling)
      this.removeStaleVisualsForEntity(entity);
      
      // Create new visual
      visual = this.createVisual(world, entity);
      this.visuals.set(entity, visual);
      this.addVisualToScene(visual);
    }
    
    // Update visual
    this.updateVisual(world, entity, visual);
  }
  
  private cleanupRemovedEntities(activeEntities: Set<GUID>): void {
    for (const [entityId, visual] of this.visuals.entries()) {
      if (!activeEntities.has(entityId)) {
        this.clearEntityVisuals(entityId);
      }
    }
  }
  
  protected clearEntityVisuals(entityId: GUID): void {
    const visual = this.visuals.get(entityId);
    if (visual) {
      this.removeVisualFromScene(visual);
      this.disposeVisual(visual);
      this.visuals.delete(entityId);
    }
  }
  
  // Abstract methods for subclasses to implement
  protected abstract getComponentTypes(): Function[];
  protected abstract createVisual(world: World, entity: GUID): TVisual;
  protected abstract updateVisual(world: World, entity: GUID, visual: TVisual): void;
  protected abstract addVisualToScene(visual: TVisual): void;
  protected abstract removeVisualFromScene(visual: TVisual): void;
  protected abstract disposeVisual(visual: TVisual): void;
  protected abstract removeStaleVisualsForEntity(entity: GUID): void;
}
```

**Game code example:**

```typescript
export class AsteroidRenderSystem extends BaseRenderSystem<AsteroidComponent, THREE.Line> {
  protected getComponentTypes() {
    return [AsteroidGeometry, Transform, AsteroidComponent];
  }
  
  protected createVisual(world: World, entity: GUID): THREE.Line {
    const geometry = world.get(entity, AsteroidGeometry);
    return this.createAsteroidMesh(geometry);
  }
  
  protected updateVisual(world: World, entity: GUID, visual: THREE.Line): void {
    const transform = world.get(entity, Transform);
    visual.position.set(...transform.position);
    visual.rotation.set(...transform.rotation);
  }
  
  // ... implement other abstract methods
}
```

### Phase 4: Entity Generation Numbers (Future)

**Location:** `engine/src/utils/entity-id.ts`

Replace string GUIDs with versioned entity IDs:

```typescript
export interface EntityId {
  readonly id: string;
  readonly generation: number;
}

export class EntityIdPool {
  private generations: Map<string, number> = new Map();
  
  create(): EntityId {
    const id = generateGuid();
    return { id, generation: 0 };
  }
  
  recycle(entityId: EntityId): void {
    this.pool.push(entityId.id);
    this.generations.set(entityId.id, entityId.generation + 1);
  }
  
  reuse(): EntityId {
    const id = this.pool.pop()!;
    const generation = this.generations.get(id) || 0;
    return { id, generation };
  }
}
```

**Benefits:**
- Can detect stale entity references
- Components can validate entity is still current
- Better debugging (can see when reference is outdated)

**Breaking Changes:** Significant - all `GUID` references need updating

## Implementation Priority

1. ✅ **Immediate (Game-level workaround):** Defensive rendering with stale visual checks
2. 🎯 **Phase 1 (Engine v2.0):** Two-phase entity destruction
3. 🎯 **Phase 2 (Engine v2.1):** Entity lifecycle events
4. 📅 **Phase 3 (Engine v3.0):** Base render system class
5. 📅 **Phase 4 (Engine v4.0):** Entity generation numbers

## Migration Strategy

### For Two-Phase Destruction (Phase 1)
- No game code changes required
- Update engine's `World.destroyEntity()` and `World.clearEvents()`
- Add unit tests for entity recycling behavior

### For Lifecycle Events (Phase 2)
- Optional adoption in game code
- Backwards compatible with existing code
- Update documentation and examples

### For Base Render System (Phase 3)
- Optional migration path
- Existing render systems continue to work
- Provide migration guide and examples

### For Generation Numbers (Phase 4)
- Major version bump (breaking change)
- Provide migration tooling
- Extensive testing and documentation

## Testing Requirements

```typescript
describe("Entity Lifecycle", () => {
  it("should not recycle entity IDs in same frame", () => {
    const entity = world.createEntity();
    world.destroyEntity(entity);
    
    const newEntity = world.createEntity();
    expect(newEntity).not.toBe(entity); // Should be different in same frame
    
    world.clearEvents(); // End of frame
    
    const nextEntity = world.createEntity();
    // Now recycling is allowed
  });
  
  it("should emit lifecycle events in correct order", () => {
    const events: string[] = [];
    world.onEvent("entity_will_destroy", () => events.push("will_destroy"));
    world.onEvent("entity_destroyed", () => events.push("destroyed"));
    
    const entity = world.createEntity();
    world.destroyEntity(entity);
    
    expect(events).toEqual(["will_destroy", "destroyed"]);
  });
});
```

## Documentation Updates Required

1. Entity lifecycle diagram showing destruction phases
2. Best practices guide for render system development
3. Migration guide for each phase
4. API reference updates
5. Example implementations

## Performance Considerations

- Two-phase destruction adds minimal overhead (Set operations)
- Lifecycle events are optional (no cost if not used)
- Base render system adds one virtual function call per entity
- Generation numbers add 4 bytes per entity reference

All performance impacts are negligible compared to rendering costs.
