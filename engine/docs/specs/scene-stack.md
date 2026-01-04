# Scene Stack Documentation

**Status:** Phase 4 (Completed)  
**Date:** 2026-01-05  
**Part of:** [Tech Debt: Scene Manager Architecture](../design/2026-01-05-techdebt-scene-manager.md)

## Overview

The scene stack is a feature of the `SceneManager` that allows multiple scenes to exist simultaneously with layered presentation. This is essential for UI patterns like pause menus overlaying gameplay, settings dialogs, etc.

**Key Concept:** The scene stack enables a **first-in-last-out (LIFO) ordering** where only the top scene is active and receives updates, while scenes below are paused.

```
Stack State (Top to Bottom):
┌─────────────┐
│  Active     │ ← Current scene (receives updates)
│ PauseMenu   │
├─────────────┤
│  Paused     │ ← Paused scenes (don't receive updates)
│ Gameplay    │
├─────────────┤
│  Paused     │
│ MainMenu    │
└─────────────┘
```

## Stack Operations

### pushScene()

**Purpose:** Add a new scene to the stack **without replacing** the current scene. The current scene is paused.

**When to use:**
- Opening a pause menu over gameplay
- Opening a dialog or settings panel
- Layering UI on top of existing scenes

**Behavior:**
1. Current scene receives `pause()` call
2. Current scene is pushed onto the stack
3. New scene becomes pending and transitions to Active
4. Events emitted: `scene-transition-start`, `scene-pause`, `scene-transition-complete`

**Example:**
```typescript
// Gameplay scene is active
sceneManager.loadScene(gameplayScene);

// Player presses Escape
sceneManager.pushScene(pauseMenuScene);  // pauseMenuScene is now active
                                         // gameplayScene is paused

// Scene stack is now: [gameplayScene (paused), pauseMenuScene (active)]
```

### popScene()

**Purpose:** Remove the top scene from the stack and resume the previous scene.

**When to use:**
- Closing a pause menu (returning to gameplay)
- Closing a dialog (returning to what was underneath)
- Unwinding the scene stack

**Behavior:**
1. Current scene receives `dispose()` call
2. Previous scene is popped from the stack and becomes current
3. Previous scene receives `resume()` call
4. State transitions to Active
5. Events emitted: `scene-dispose`, `scene-resume`

**Example:**
```typescript
// pauseMenuScene is active, gameplayScene is paused
sceneManager.popScene();  // pauseMenuScene is disposed
                          // gameplayScene is resumed and becomes active

// Scene stack is now: [gameplayScene (active)]
```

### Pause/Resume Lifecycle

The pause and resume lifecycle methods are called automatically when pushing/popping scenes.

**Phase of Execution:**

```
pushScene(newScene):
  1. Current scene.pause() called immediately ← Scene receives pause event
  2. Current scene pushed onto stack
  3. New scene transitions to Active (eventually)
  4. scene-pause event emitted

popScene():
  1. Current scene.dispose() called immediately
  2. Previous scene popped from stack
  3. Previous scene.resume() called immediately ← Scene receives resume event
  4. State transitions to Active
  5. scene-resume event emitted
```

**Important:** `pause()` and `resume()` are called **synchronously** when you call `pushScene()` and `popScene()`, not in the next frame like `init()` and `dispose()`.

## Query APIs

The SceneManager provides several APIs to inspect the scene stack at any time.

### getSceneStackDepth()

Returns the number of **paused scenes** in the stack (does NOT include the current scene).

```typescript
// No scenes loaded
sceneManager.getSceneStackDepth();  // 0

// Only gameplay loaded
sceneManager.loadScene(gameplayScene);
sceneManager.getSceneStackDepth();  // 0 (no paused scenes)

// Pause menu pushed on top
sceneManager.pushScene(pauseMenuScene);
sceneManager.getSceneStackDepth();  // 1 (gameplay is paused)

// Settings dialog pushed on pause menu
sceneManager.pushScene(settingsScene);
sceneManager.getSceneStackDepth();  // 2 (gameplay + pause menu paused)
```

### getTotalSceneCount()

Returns the **total number of scenes** (current + paused in stack).

```typescript
sceneManager.getTotalSceneCount();  // 0 (no scenes)

sceneManager.loadScene(gameplayScene);
sceneManager.getTotalSceneCount();  // 1 (just gameplay)

sceneManager.pushScene(pauseMenuScene);
sceneManager.getTotalSceneCount();  // 2 (gameplay + pause menu)

sceneManager.pushScene(settingsScene);
sceneManager.getTotalSceneCount();  // 3 (all three scenes)
```

### getSceneStack()

Returns an **array of all paused scenes** (bottom to top, NOT including current scene).

**Returns:** Array ordered from bottom of stack to top.

```typescript
// Assume: mainMenu (paused) ← gameplayScene (paused) ← pauseMenuScene (current)
const stack = sceneManager.getSceneStack();

// stack = [mainMenu, gameplayScene]
// (pauseMenuScene is not in the stack, it's current)

stack[0]  // mainMenu (bottom)
stack[1]  // gameplayScene (top of stack, but not current)
```

**Use Case:** Rendering a visual representation of the scene stack, debugging, or querying scene hierarchy.

### isScenePaused(sceneId)

Check if a **specific scene is paused** in the stack.

```typescript
sceneManager.isScenePaused(gameplayScene.id);     // true if paused
sceneManager.isScenePaused(pauseMenuScene.id);    // false (it's current)
sceneManager.isScenePaused(unknownScene.id);      // false (not in stack)
```

**Use Case:** Conditional logic based on whether a scene is paused or active.

## Common Patterns

### Pattern 1: Pause Menu

The classic pause menu pattern: freeze gameplay, show menu on top.

```typescript
class PauseMenuScene implements Scene {
  readonly id = "pause-menu";

  init(world: World): void {
    // Create UI entities for pause menu
    world.spawn()
      .add(new Transform())
      .add(new UIPanel({ title: "Paused" }));
  }

  resume(world: World): void {
    // Clean up on dismiss
  }

  dispose(world: World): void {
    // Cleanup when closing
  }

  // ... other methods
}

// In gameplay:
const pauseMenuScene = new PauseMenuScene();
sceneManager.pushScene(pauseMenuScene);  // Pause the game
```

### Pattern 2: Dialog on Dialog

Stack multiple dialogs on top of each other.

```typescript
// Assume gameplayScene is active
sceneManager.pushScene(pauseMenuScene);      // Active
                                             // [gameplayScene paused]

sceneManager.pushScene(confirmDialogScene);  // Active
                                             // [gameplayScene paused, pauseMenuScene paused]

// Close confirm dialog
sceneManager.popScene();  // pauseMenuScene is active again
                          // [gameplayScene paused]

// Close pause menu
sceneManager.popScene();  // gameplayScene is active again
```

### Pattern 3: Modal Scene Stack

Replace the current scene but keep a base scene (like main menu) in the background.

```typescript
// Start with main menu
sceneManager.loadScene(mainMenuScene);  // Active

// Load gameplay (replaces main menu)
sceneManager.loadScene(gameplayScene);  // Active
                                        // (mainMenuScene is disposed)

// Push pause menu
sceneManager.pushScene(pauseMenuScene); // Active
                                        // [gameplayScene paused]

// Return to main menu (replaces gameplay)
sceneManager.loadScene(mainMenuScene);  // Active
                                        // (gameplayScene and pauseMenuScene disposed)
```

**Note:** `loadScene()` replaces the current scene and clears the stack. Use it when you want to completely change contexts (e.g., returning to main menu).

### Pattern 4: React Component Observing Stack

Render UI based on scene stack state.

```typescript
function GameUI({ sceneManager }: { sceneManager: SceneManager }) {
  const [sceneStack, setSceneStack] = useState<Scene[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Update when state changes
    const unsubscribe = sceneManager.subscribeToStateChanges(() => {
      setSceneStack(sceneManager.getSceneStack());
      setTotalCount(sceneManager.getTotalSceneCount());
    });

    return unsubscribe;
  }, [sceneManager]);

  return (
    <div>
      <h3>Scene Stack ({totalCount} total)</h3>
      <ul>
        {sceneStack.map((scene, idx) => (
          <li key={scene.id}>
            {idx === sceneStack.length - 1 ? "⬆ TOP (paused)" : "↓ "} {scene.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## State Machine & Scene Stack

The scene stack works together with the state machine. The current state is always **derived from the scene stack**:

```typescript
// No scenes
getState() === SceneState.Unloaded
getTotalSceneCount() === 0

// Scenes exist
getState() === SceneState.Active
getTotalSceneCount() >= 1

// Valid state transitions
// Active → Unloading (when disposing) → Unloaded (when none left)
// Active → Loading (when loading new scene)
// Loading → Active (when load completes)
```

The state machine prevents invalid transitions like:
- ❌ Loading → Paused (must be Active first)
- ❌ Unloaded → Paused (must load a scene first)

## Testing the Scene Stack

See [scene-manager.test.ts](../../src/resources/scene-manager.test.ts) for comprehensive test examples. Key test suites:

- **stack queries** - Testing `getSceneStackDepth()`, `getTotalSceneCount()`, `getSceneStack()`
- **isScenePaused query** - Testing pause status checks
- **multiple rapid pushes** - Testing resilience to rapid stack operations
- **multiple rapid pops** - Testing unwinding the stack correctly
- **stack with load operations** - Testing `loadScene()` behavior with stacks
- **pause/resume lifecycle** - Testing that `pause()` and `resume()` are called correctly

## Edge Cases & Gotchas

### Gotcha 1: Pop with Empty Stack

Calling `popScene()` when there's no stack is safe but sets state to Unloaded:

```typescript
// Only current scene, no stack
sceneManager.loadScene(scene1);
sceneManager.popScene();  // ✓ Safe, disposes scene1, state→Unloaded
```

### Gotcha 2: LoadScene vs PushScene

These are fundamentally different:

```typescript
// loadScene() replaces current and clears stack
sceneManager.loadScene(scene1);
sceneManager.pushScene(scene2);   // stack: [scene1 paused]
sceneManager.loadScene(scene3);   // ❌ Disposes scene1 and scene2!
                                   // Only scene3 remains

// pushScene() adds to stack
sceneManager.loadScene(scene1);
sceneManager.pushScene(scene2);   // stack: [scene1 paused]
sceneManager.pushScene(scene3);   // stack: [scene1 paused, scene2 paused]
                                   // (all three still exist)
```

### Gotcha 3: Pause/Resume are Synchronous

Unlike `init()` and `dispose()` which are called in the next frame by the lifecycle system, `pause()` and `resume()` are called **immediately**:

```typescript
sceneManager.pushScene(newScene);
// ← pauseCalled = true IMMEDIATELY on current scene
// (init() won't be called until next frame by lifecycle system)

sceneManager.popScene();
// ← disposeCalled = true IMMEDIATELY on current scene
// ← resumeCalled = true IMMEDIATELY on resumed scene
```

### Gotcha 4: Scene Stack is LIFO (Last-In-First-Out)

The stack is ordered from **oldest to newest**:

```typescript
sceneManager.loadScene(scene1);   // [scene1 current]
sceneManager.pushScene(scene2);   // [scene1 paused, scene2 current]
sceneManager.pushScene(scene3);   // [scene1 paused, scene2 paused, scene3 current]

const stack = sceneManager.getSceneStack();
// stack[0] === scene1  (first pushed, still at bottom)
// stack[1] === scene2  (second pushed)
// (scene3 is current, not in stack array)

sceneManager.popScene();  // scene3 disposed, scene2 becomes current
sceneManager.popScene();  // scene2 disposed, scene1 becomes current
```

## Performance Considerations

- **getSceneStack()** - Returns a copy of the stack array (O(n) where n = stack depth)
- **isScenePaused()** - Searches for scene ID in stack (O(n) where n = stack depth)
- **Stack depth** - Typically small (1-3 scenes), rarely deeper than 5

For typical game UIs:
- Main Menu → Gameplay: depth 0
- Gameplay + Pause Menu: depth 1
- Pause Menu + Settings Dialog: depth 2

No performance concerns for reasonable stack depths.

## Related Documentation

- [Scene Manager Architecture (Tech Debt)](../design/2026-01-05-techdebt-scene-manager.md)
- [Phase 1: Event System](../design/2026-01-05-techdebt-scene-manager-phase1-complete.md)
- [Phase 2: Observable State](../design/2026-01-05-techdebt-scene-manager-phase2-complete.md)
- [Phase 3: Unified Lifecycle](../design/2026-01-05-techdebt-scene-manager-phase3-complete.md)
- [Scene Manager API](engine-api.md) - SceneManager reference
- [Testing Scenes](testing.md) - How to test scenes

## Summary

The scene stack provides a clean way to layer scenes:

| Operation | Behavior | Use Case |
|-----------|----------|----------|
| `loadScene()` | Replace current, clear stack | Main navigation (menu → game) |
| `pushScene()` | Pause current, add to stack | Overlays (pause menu, dialogs) |
| `popScene()` | Dispose current, resume previous | Close overlay, return to previous |
| `getSceneStackDepth()` | Count of paused scenes | UI showing depth |
| `getTotalSceneCount()` | All scenes (current + paused) | Scene hierarchy info |
| `getSceneStack()` | Array of paused scenes | Debugging, custom logic |
| `isScenePaused()` | Check if scene is paused | Conditional logic |

**Key Takeaway:** The stack is simple, powerful, and works seamlessly with the state machine to provide reliable, testable scene layering.
