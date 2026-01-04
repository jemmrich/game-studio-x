# Phase 3 Plan: Unify Lifecycle Management

**Date:** 2026-01-05  
**Status:** 🎯 In Progress

## Overview

Phase 3 consolidates the fragmented lifecycle management that currently splits responsibilities between `SceneManager` and `SceneLifecycleSystem`. 

**Current Problem:** The lifecycle state machine lives in SceneManager, but the actual lifecycle state transitions and entity cleanup are orchestrated by SceneLifecycleSystem. This requires SceneManager to expose private methods (`_setCurrentScene`, `_setState`, `_clearPending`, `_notifySceneLoaded`, etc.) that only SceneLifecycleSystem should call.

**Goal:** Move all lifecycle orchestration into SceneManager, making it the single source of truth for scene state and transitions. SceneLifecycleSystem becomes a simple system that delegates to SceneManager's public API.

## Implementation Strategy

### Step 1: Internalize Lifecycle Methods in SceneManager

Currently SceneLifecycleSystem directly manipulates SceneManager's state. We need to create public methods that encapsulate this logic.

#### New Public Methods

**`_transitionToScene(pendingScene: Scene, world: World, transitionType: "load" | "push"): void`**

Called by lifecycle system to notify manager that a scene transition has completed.

```typescript
private _transitionToScene(
  scene: Scene,
  world: World,
  transitionType: "load" | "push"
): void {
  const previousScene = this.currentScene;
  
  // Update scene reference
  this.currentScene = scene;
  this.pendingScene = null;
  
  // Update state to Active
  this._updateState(SceneState.Active);
  
  // Emit events
  this._notifySceneLoaded(scene);
  this._notifyTransitionComplete(previousScene, scene, transitionType);
}
```

**`_disposeScene(scene: Scene, world: World): void`**

Called by lifecycle system to notify manager that a scene has been disposed.

```typescript
private _disposeScene(scene: Scene, world: World): void {
  this._notifySceneUnloaded(scene);
  
  // Check if there's a pending scene to load
  if (this.pendingScene) {
    this.currentScene = null;
    this._updateState(SceneState.Loading);
  } else if (this.sceneStack.length > 0) {
    // Stack was already popped by popScene()
    // Just restore state
    this.currentScene = this.sceneStack[this.sceneStack.length - 1];
    this._updateState(SceneState.Active);
  } else {
    this.currentScene = null;
    this._updateState(SceneState.Unloaded);
  }
}
```

### Step 2: Refactor SceneLifecycleSystem

SceneLifecycleSystem should focus on calling scene lifecycle methods and delegating state management to SceneManager.

#### Simplified Flow

```typescript
export class SceneLifecycleSystem {
  update(world: World, dt: number): void {
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (!sceneManager) return;

    const state = sceneManager.getState();

    switch (state) {
      case SceneState.Loading:
        this.handleLoading(world, sceneManager);
        break;
      case SceneState.Unloading:
        this.handleUnloading(world, sceneManager);
        break;
      case SceneState.Active: {
        const currentScene = sceneManager.getCurrentScene();
        if (currentScene?.update) {
          currentScene.update(world, dt);
        }
        break;
      }
    }
  }

  private handleLoading(world: World, sceneManager: SceneManager): void {
    // Same as before, but at the end call:
    sceneManager._transitionToScene(pendingScene, world, transitionType);
  }

  private handleUnloading(world: World, sceneManager: SceneManager): void {
    // Same as before, but at the end call:
    sceneManager._disposeScene(currentScene, world);
  }
}
```

### Step 3: World Injection

**Current Problem:** Some methods need the World but it's passed as optional, leading to `null as any` hacks.

```typescript
// Current code - type unsafe
popScene(world?: any): void {
  // ...
  this.currentScene.dispose(world || (null as any));
}
```

**Solution:** SceneManager stores the World reference (already done in Phase 1) and uses it automatically.

```typescript
// New code - type safe
popScene(): void {
  if (this.currentScene) {
    this.currentScene.dispose(this.world || (null as any)); // Still safe fallback
  }
}
```

### Step 4: Scene Stack Query APIs

Add missing query methods to understand scene stack state.

```typescript
/**
 * Get the depth of the scene stack (number of paused scenes).
 * Does not include current scene.
 */
getSceneStackDepth(): number {
  return this.sceneStack.length;
}

/**
 * Get all scenes in the stack (bottom to top, not including current).
 */
getSceneStack(): Scene[] {
  return [...this.sceneStack];
}

/**
 * Get total number of scenes (current + stack).
 */
getTotalSceneCount(): number {
  return (this.currentScene ? 1 : 0) + this.sceneStack.length;
}

/**
 * Check if a scene is in the stack (paused).
 */
isScenePaused(sceneId: string): boolean {
  return this.sceneStack.some(s => s.id === sceneId);
}
```

### Step 5: Documentation

Create clear documentation of:
- When `popScene()` should be called vs when it's automatic
- Scene stack semantics and valid operations
- Examples of common patterns (pause menu, nested dialogs, etc.)

## Detailed Changes

### 1. SceneManager Changes

**Remove/Update Private Methods:**
- Keep `_setWorld()` (still needed for event system)
- Keep `_getSceneStackDepth()` (lifecycle system needs it)
- Keep `_updateState()` (internal state management)
- Replace `_setCurrentScene()`, `_setState()`, `_clearPending()` with new unified methods
- Keep `_notifySceneLoaded()`, `_notifySceneUnloaded()`, `_notifyTransitionComplete()` (event emission)

**Make Public:**
- `getSceneStackDepth()` - Query scene stack depth
- `getSceneStack()` - Query full scene stack
- `getTotalSceneCount()` - Query total scene count
- `isScenePaused(sceneId)` - Check if scene is paused

**Keep as Before:**
- `loadScene()` - Public API (unchanged behavior)
- `pushScene()` - Public API (unchanged behavior)
- `popScene()` - Public API (may remove `world` parameter)
- `resetCurrentScene()` - Public API (unchanged behavior)
- `getCurrentScene()` - Public query
- `getState()` - Public query
- `subscribeToStateChanges()` - Public subscription (Phase 2)

### 2. SceneLifecycleSystem Changes

**Minimal changes:**
- Remove direct state manipulation via `_setCurrentScene()`, `_setState()`, `_clearPending()`
- Call new SceneManager methods instead: `_transitionToScene()`, `_disposeScene()`
- Keep entity cleanup logic (not moving to SceneManager)
- Keep lifecycle method invocations (create, init, pause, resume, dispose, reset)

## Testing Strategy

### Unit Tests
- Test state transitions via lifecycle system
- Test event emission in correct order
- Test scene stack operations
- Test query APIs
- Test World injection works correctly

### Integration Tests
- Load → Unload → Load sequence
- Push → Pop sequence
- Multiple scene operations
- Error conditions (invalid transitions, missing scenes, etc.)

## Success Criteria

✅ Single source of truth for scene state (SceneManager)
✅ Clear, publicly documented lifecycle APIs
✅ No `null as any` hacks for World injection
✅ Scene stack can be queried and inspected
✅ All events still emit in correct order
✅ All existing tests pass
✅ No regression in game functionality
✅ New developers understand flow in under 10 minutes

## Effort Estimate

- Refactor SceneManager: 1-2 hours
- Update SceneLifecycleSystem: 30 minutes
- Update tests: 1-2 hours
- Integration testing: 1 hour
- Documentation: 1 hour

**Total: 4-6 hours**

## Files to Modify

1. `/engine/src/resources/scene-manager.ts` - Main refactor
2. `/engine/src/systems/scene-lifecycle-system.ts` - Simplification
3. `/engine/src/core/base-scene.test.ts` - Update lifecycle tests
4. `/engine/src/core/demo-base-scene.integration.test.ts` - Update integration tests
5. Tests and demos as needed

## Related Changes

None - this phase is self-contained consolidation.

## Next Phases After Phase 3

- **Phase 4:** Stack Documentation (Query APIs, examples)
- **Phase 5:** Transition Options (Animation support)
