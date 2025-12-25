# Entity Lifecycle Best Practices

## The Problem
When entity IDs are recycled immediately in the same frame, render systems may not have cleaned up old visuals before new entities with the same ID are created. This causes visual artifacts where multiple objects appear stacked on top of each other.

## Root Cause
1. Entity destroyed in frame N
2. Render system's `clearEntityVisuals()` is called
3. Entity ID is immediately recycled and new entity created
4. Render system's `update()` runs and creates new mesh
5. Old mesh may still exist in scene if cleanup wasn't thorough

## Solutions

### 1. Defensive Rendering (✅ Implemented)
Always check for stale visuals when creating new meshes:

```typescript
// In render system's renderAsteroid()
if (!mesh) {
  // Search scene for any stale objects with this entity ID
  const staleObjects: THREE.Object3D[] = [];
  this.scene.traverse((obj) => {
    if (obj.userData && obj.userData.entityId === entity) {
      staleObjects.push(obj);
    }
  });
  
  // Clean up stale objects before creating new mesh
  staleObjects.forEach(obj => this.scene.remove(obj));
}
```

**Pro:** Catches recycling issues automatically  
**Con:** Adds traversal overhead

### 2. Two-Phase Entity Destruction (Recommended)
Delay entity ID recycling until next frame:

```typescript
// In World class
private entitiesToDestroy: Set<GUID> = new Set();

destroyEntity(entityId: GUID): void {
  // Mark for destruction but don't recycle ID yet
  this.entitiesToDestroy.add(entityId);
  this.removeAllComponents(entityId);
}

// At end of frame (after all systems run)
private recycleDestroyedEntities(): void {
  for (const entityId of this.entitiesToDestroy) {
    this.entityPool.recycle(entityId);
  }
  this.entitiesToDestroy.clear();
}
```

**Pro:** Ensures all systems have processed destruction before ID reuse  
**Con:** Requires engine modification

### 3. Entity Generation Numbers
Add a generation/version number to entity IDs:

```typescript
interface EntityId {
  id: string;
  generation: number;
}

// When recycling:
recycleEntity(id: string): EntityId {
  return {
    id: id,
    generation: this.generations.get(id) + 1
  };
}
```

**Pro:** Can detect stale references  
**Con:** Requires significant refactoring

### 4. Centralized Cleanup System (Recommended)
Create a dedicated cleanup system that runs last:

```typescript
export class VisualCleanupSystem {
  private destroyedEntities: Set<GUID> = new Set();
  
  setup(world: World): void {
    world.onEvent("entity_will_destroy", (event) => {
      this.destroyedEntities.add(event.data.entityId);
    });
  }
  
  update(world: World): void {
    // This system runs AFTER all render systems
    for (const entityId of this.destroyedEntities) {
      this.cleanupAllVisuals(entityId);
    }
    this.destroyedEntities.clear();
  }
}
```

**Pro:** Single source of truth for cleanup  
**Con:** Requires coordination between systems

### 5. Tag Visual Objects with Entity Metadata (✅ Implemented)
Always tag THREE.js objects with entity information:

```typescript
mesh.userData.entityId = entity;
mesh.userData.createdAt = performance.now();
```

This enables:
- Finding stale objects during scene traversal
- Debugging visual issues
- Automatic cleanup verification

## Recommendations

### Immediate Actions
1. ✅ **Tag all visual objects** with entity IDs in userData
2. ✅ **Defensive rendering** - Check for stale objects before creating new ones
3. Add **system execution order documentation** in comments

### Medium-term Improvements
1. Implement **two-phase entity destruction** in the engine
2. Add **entity lifecycle events** (`entity_will_destroy`, `entity_destroyed`)
3. Create a **VisualCleanupSystem** that runs after all render systems

### Long-term Architecture
1. Consider **entity generation numbers** to detect stale references
2. Add **automated tests** for entity recycling scenarios
3. Implement **visual leak detection** in dev mode (count scene objects)

## Testing Entity Recycling

Create tests that rapidly destroy and create entities:

```typescript
test("rapid entity destruction and creation", () => {
  for (let i = 0; i < 100; i++) {
    const entity = spawnAsteroid(world, [0, 0, 0], 3);
    world.updateSystems(0.016); // One frame
    world.destroyEntity(entity);
    world.updateSystems(0.016); // One frame
  }
  
  // Verify no visual leaks
  const sceneObjectCount = countSceneObjects(threeScene);
  expect(sceneObjectCount).toBe(0);
});
```

## System Execution Order Best Practices

Document the required system order in code:

```typescript
// main.tsx
// ═══════════════════════════════════════════════════════════════════
// SYSTEM EXECUTION ORDER (CRITICAL - DO NOT REORDER)
// ═══════════════════════════════════════════════════════════════════
// 1. Input/Control systems
// 2. Physics/Movement systems
// 3. Collision DETECTION systems (emit events)
// 4. Collision HANDLING systems (process events, emit destruction)
// 5. Destruction systems (process destruction, emit spawn events)
// 6. Spawning systems (process spawn events, create entities)
// 7. Render systems (create/update/cleanup visuals)
// ═══════════════════════════════════════════════════════════════════
```

## Debugging Tips

1. **Add verbose logging** during development (can be removed later)
2. **Count scene objects** periodically to detect leaks
3. **Visualize entity lifecycle** with console.group()
4. **Add assertions** in render systems to verify cleanup

```typescript
// Development mode check
if (import.meta.env.DEV) {
  const existingMesh = this.asteroidMeshes.get(entity);
  if (existingMesh) {
    console.error(`Entity ${entity} already has a mesh! Possible recycling issue.`);
  }
}
```
