# Tech Debt: Scene Manager Architecture

**Date:** 2026-01-05  
**Severity:** High  
**Impact:** Engine core, UI coupling, game development friction

## Overview

The current SceneManager implementation has fundamental architectural issues that create friction in game development. The design relies on implicit event-based transitions and callback patterns that are difficult to test, debug, and extend. This tech debt primarily manifests in:

1. Unclear scene transition semantics
2. Loose coupling via events (creates messy UI code)
3. Lack of observable state for UI consumption
4. Missing event system (onSceneLoad, onSceneTransition, onSceneDispose)
5. Fragmented lifecycle management
6. Implicit state machine behavior

## Current Problems

### 1. Scene Transition Semantics Are Unclear

**Problem:** The SceneManager has `loadScene()` and `pushScene()` but the transition logic is split between the manager and an external `SceneLifecycleSystem`. The manager sets state flags (`Unloading`, `Loading`) but actual scene lifecycle method calls happen elsewhere.

**Issues:**
- Callers don't know when a scene is truly "loaded"
- No guarantee that callbacks are invoked in predictable order
- Pending scene state exists but semantics are unclear
- Hard to reason about what happens between `loadScene()` call and actual activation

**Example:** The game calls `loadScene(newScene)` but doesn't know:
- Will `init()` be called immediately or next frame?
- When will `onSceneLoad` callbacks fire?
- What's the difference between "loaded" and "active"?

### 2. Event-Based Communication Creates Messy UI Code

**Problem:** UI depends on event listeners to understand scene transitions, leading to imperative, hard-to-follow logic.

**Current Code:**
```typescript
useEffect(() => {
  world.onEvent("scene-transition", (event) => {
    setCurrentView(event.data.view);
  });
  
  world.onEvent("entering_zone", () => {
    const waveManager = world.getResource<WaveManager>("waveManager");
    setWaveNumber(waveManager?.currentWaveNumber ?? 1);
    setCurrentView("enteringZone");
  });
  
  world.onEvent("entering_zone_effect_complete", () => {
    setCurrentView("gameplay");
  });
}, [world]);
```

**Issues:**
- Multiple independent event listeners make code hard to follow
- No single source of truth for what view/scene is active
- Tightly couples UI to event naming convention
- Hard to test (requires mocking event system)
- Order of event execution is implicit
- Race conditions possible if events fire in unexpected order
- New UI views require new events—no scalability

### 3. No Observable Scene State

**Problem:** The UI cannot simply "watch" the current scene state. Instead, it must set up listeners and maintain local state in sync with the engine.

**Issues:**
- React components must maintain duplicate state (`currentView`)
- Synchronization bugs possible if component unmounts before cleanup
- No way to query "what scene are we in?" at any point
- Testing requires wrapping components in world/event mocks
- Increases cognitive load for game developers

### 4. Missing Event Lifecycle Hooks

**Problem:** The event system only has `onSceneLoad` and `onSceneUnload`. Missing events create information gaps.

**Missing Events:**
- `onSceneTransition` - When a scene transition is *requested* (distinguishes from actual load)
- `onSceneDispose` - Explicit disposal events (currently called "unload")
- `onSceneStart` vs `onSceneInit` - Distinguish one-time setup from per-load initialization
- `onScenePause` / `onSceneResume` - Stack-based pausing not observable
- `onSceneReset` - Reset events have no notification
- `onSceneError` - Error handling during transitions

**Impact:** Games must work around missing events with workarounds:
- Custom resource tracking
- Manual event emission in game code
- Tight coupling between scenes and systems

### 5. Fragmented Lifecycle Management

**Problem:** Scene lifecycle is split between SceneManager and SceneLifecycleSystem. State mutations happen in multiple places.

**Current Flow:**
1. Game calls `loadScene(scene)`
2. SceneManager sets state to `Loading` and stores `pendingScene`
3. SceneLifecycleSystem detects pending scene next frame
4. System calls scene lifecycle methods (`create`, `init`, etc.)
5. System notifies SceneManager of completion via `_setState()`, `_setCurrentScene()`, etc.

**Issues:**
- SceneManager has private setters (`_setState`, `_setCurrentScene`) that external code must call
- State is not atomic—multiple frames to transition states
- Hard to add new lifecycle stages without modifying multiple systems
- Testing requires both SceneManager and SceneLifecycleSystem
- No transactional semantics (can't roll back partial transitions)

### 6. No Explicit State Machine

**Problem:** The scene state machine is implicit in code logic. States like `Paused` exist but are never actually set.

**Current Issues:**
- `SceneState.Paused` is defined but never used
- `pushScene()` calls `pause()` but doesn't set state to `Paused`
- Resume doesn't verify state is `Paused`
- State transitions aren't validated (e.g., can't load while unloading)
- No way to visualize or debug state transitions
- UI can't observe intermediate states

### 7. Callback Pattern Doesn't Scale

**Problem:** Using callbacks for events is cumbersome and doesn't integrate with the World's event system. Currently SceneManager maintains its own callback lists separate from the World's event bus, creating two different event mechanisms.

**Current Pattern (Fragmented):**
```typescript
// Scene-specific callbacks on SceneManager
sceneManager.onSceneLoad((scene) => { /* ... */ });
sceneManager.onSceneUnload((scene) => { /* ... */ });

// Separate World events
world.onEvent("scene-transition", (event) => { /* ... */ });
```

**Issues:**
- Two different event mechanisms: SceneManager callbacks + World events
- No way to listen to all scene events uniformly
- Callbacks can't be unsubscribed easily (no unsubscribe function)
- No event payload standardization
- Hard to debug event order
- SceneManager couples scene lifecycle to callback management

**Proper Pattern:**
All scene events should emit through the World's event bus with typed payloads:

```typescript
// Define typed scene events
interface SceneTransitionEvent {
  from: Scene | null;
  to: Scene;
  timestamp: number;
}

interface SceneLifecycleEvent {
  scene: Scene;
  timestamp: number;
}

// SceneManager emits all events through World's event system
world.emit<SceneTransitionEvent>("scene-transition", {
  from: oldScene,
  to: newScene,
  timestamp: Date.now()
});

world.emit<SceneLifecycleEvent>("scene-load", {
  scene: newScene,
  timestamp: Date.now()
});

// Single, unified subscription pattern
const unsubscribe = world.onEvent<SceneTransitionEvent>("scene-transition", (event) => {
  console.log(`Transitioning from ${event.data.from?.id} to ${event.data.to.id}`);
});

// Easy cleanup
unsubscribe();
```

**Benefits:**
- Unified event system (all events flow through World)
- Events are typed and discoverable
- Consistent subscription pattern across codebase
- Returns unsubscribe functions (proper cleanup)
- Easier to test (mock World event system once, not two mechanisms)
- New scene events require no changes to event subscription—just emit them

### 8. Stack-Based Scenes Are Under-Documented

**Problem:** `pushScene()` and `popScene()` enable layered scenes (pause menu over gameplay) but lack clear semantics, documentation, and query APIs. Additionally, the scene stack should work with a state machine to validate allowed transitions, but this relationship isn't clearly documented.

**What Stack-Based Scenes Do:**
Stack-based scenes allow multiple scenes to exist simultaneously with one active (on top):
```
Pause Menu      ← Current/Active (top of stack)
Gameplay        ← Underneath (paused)
Main Menu       ← Underneath (paused)
```

The top of the stack is always what the player sees and what receives updates.

**Issues:**
- No clear documentation on when scenes resume (same frame? next frame?)
- What if you push/pop multiple times rapidly? Is state machine safe?
- No API to query the scene stack: `getStackDepth()`, `getSceneStack()`, etc.
- Pause/resume lifecycle isn't symmetric (push calls pause, pop calls resume, but where?)
- No connection between scene stack and a state machine for validation
- Hard to implement UI that shows "scene stack" or querying its state

**Best Pattern: Hybrid State Machine + Scene Stack**

Use a state machine to validate allowed transitions, while the scene stack enables layering:

```typescript
// Define valid game states
enum GameState {
  MainMenu = "main-menu",
  Loading = "loading",
  Gameplay = "gameplay",
  PausedMenu = "paused-menu",
  GameOver = "game-over",
}

// SceneManager uses state machine to validate transitions
class SceneManager {
  private state: GameState = GameState.MainMenu;
  private sceneStack: Scene[] = [];
  
  // State machine validates allowed transitions
  private canTransition(from: GameState, to: GameState): boolean {
    const allowedTransitions: Record<GameState, GameState[]> = {
      [GameState.MainMenu]: [GameState.Loading, GameState.GameOver],
      [GameState.Loading]: [GameState.Gameplay],
      [GameState.Gameplay]: [GameState.PausedMenu, GameState.GameOver],
      [GameState.PausedMenu]: [GameState.Gameplay, GameState.MainMenu],
      [GameState.GameOver]: [GameState.MainMenu],
    };
    
    return allowedTransitions[from]?.includes(to) ?? false;
  }
  
  transitionToState(newState: GameState, scene: Scene): void {
    // Validate transition
    if (!this.canTransition(this.state, newState)) {
      throw new Error(`Invalid transition: ${this.state} → ${newState}`);
    }
    
    this.state = newState;
    
    // Use scene stack for layering (pause menu on top)
    if (newState === GameState.PausedMenu) {
      this.pushScene(scene);
    } else {
      this.loadScene(scene);
    }
    
    // Emit state change event
    world.emit<StateChangeEvent>("game-state-changed", {
      from: this.previousState,
      to: newState,
      timestamp: Date.now()
    });
  }
  
  // Query APIs
  getCurrentState(): GameState {
    return this.state;
  }
  
  getStackDepth(): number {
    return this.sceneStack.length + (this.currentScene ? 1 : 0);
  }
  
  getSceneStack(): Scene[] {
    return [...this.sceneStack, this.currentScene].filter(Boolean);
  }
}
```

**UI Observes State:**
```typescript
function GameUI({ world }) {
  const [gameState, setGameState] = useState<GameState>(GameState.MainMenu);
  
  useEffect(() => {
    // Single, clear event listener
    const unsubscribe = world.onEvent<StateChangeEvent>("game-state-changed", (event) => {
      setGameState(event.data.to);
    });
    
    return unsubscribe;
  }, [world]);
  
  // Single source of truth for rendering
  switch (gameState) {
    case GameState.MainMenu:
      return <MainMenu />;
    case GameState.Gameplay:
      return <Hud />;
    case GameState.PausedMenu:
      return <PauseMenu />;
    case GameState.GameOver:
      return <GameOverScreen />;
  }
}
```

**Key Benefits:**
- State machine prevents invalid transitions (no runtime errors from bad state combinations)
- Top of scene stack = current state (always in sync)
- UI observes state, not scattered events (clean, testable)
- Query APIs available (can ask "how many scenes are paused?")
- Each scene can have its own internal state machine for gameplay-specific logic
- Clear documentation: "state X → state Y is valid/invalid"

### 9. Missing World Injection

**Problem:** Some lifecycle methods need the World but can't get it reliably.

**Current Code:**
```typescript
popScene(world?: any): void {
  // ...
  this.currentScene.dispose(world || (null as any));
  // ...
}
```

**Issues:**
- World injection is optional and optional parameters are filled with `null as any`
- Type-unsafe (should be required or injected automatically)
- SceneManager needs to know about World dependency
- Hard to make scenes work without explicit world passing

### 10. No Transition Semantics (Immediate vs Async)

**Problem:** Currently all transitions are "instant" (state set immediately, lifecycle next frame). No support for animated transitions, loading screens, etc.

**Issues:**
- No way to specify transition duration
- No way to add middleware (e.g., fade out before disposing)
- UI can't know if a transition is in progress
- No built-in support for transition animations

## Proposed Solutions

### Phase 1: Implement Event System for Scene Manager

Create a unified event system that integrates with World's event bus:

```typescript
interface SceneTransitionEvent {
  from: Scene | null;
  to: Scene;
  timestamp: number;
}

interface SceneLifecycleEvent {
  scene: Scene;
  timestamp: number;
}

// Events emitted by SceneManager:
// - "scene-transition-start" → SceneTransitionEvent
// - "scene-transition-complete" → SceneTransitionEvent
// - "scene-load" → SceneLifecycleEvent
// - "scene-unload" → SceneLifecycleEvent
// - "scene-pause" → SceneLifecycleEvent
// - "scene-resume" → SceneLifecycleEvent
// - "scene-dispose" → SceneLifecycleEvent
// - "scene-reset" → SceneLifecycleEvent
```

**Benefits:**
- Unified event system (integrates with World)
- Events are typed
- Consistent event emission patterns
- UI can listen to scene events same way as any other events
- Easier to test and debug

### Phase 2: Observable Scene State (State Machine)

Implement an explicit state machine with observable state:

```typescript
class SceneStateMachine {
  private state: SceneStateNode;
  private subscribers: Set<(state: SceneState) => void>;
  
  transitionTo(targetState: SceneState): void {
    // Validate transition
    // Emit events
    // Update subscribers
  }
  
  subscribe(callback: (state: SceneState) => void): () => void {
    // Return unsubscribe function
  }
}

// UI can now do:
const [sceneState, setSceneState] = useState<SceneState>("unloaded");

useEffect(() => {
  return sceneManager.subscribeToStateChanges((state) => {
    setSceneState(state);
  });
}, [sceneManager]);
```

**Benefits:**
- State is explicit and validated
- UI can observe state directly (no event coupling)
- State transitions are atomic
- Easy to debug (log all state changes)
- Synchronous and predictable

### Phase 3: Unify Lifecycle Management

Consolidate SceneManager and SceneLifecycleSystem logic:

- SceneManager orchestrates all transitions
- Single source of truth for state
- Explicit state transition rules
- World injection handled automatically

### Phase 4: Document and Test Scene Stack

Clarify semantics of scene stack (pausing, resuming, multiple pushes):

- Clear documentation of pause/resume behavior
- Comprehensive tests for stack operations
- API to query stack state
- Examples of menu-on-top-of-gameplay patterns

### Phase 5: Add Transition Options

Support more sophisticated transitions:

```typescript
interface TransitionOptions {
  duration?: number;
  easing?: (t: number) => number;
  middleware?: (from: Scene, to: Scene) => Promise<void>;
}

sceneManager.transitionToScene(newScene, {
  duration: 1000,
  easing: easeInOutQuad,
  middleware: async (from, to) => {
    // Fade out, wait, fade in, etc.
  }
});
```

## Related Tech Debt

- **Event System:** The broader event system needs improvements (see separate tech debt file)
- **Type Safety:** World injection pattern needs standardization across all lifecycle systems
- **Testing Utilities:** Need better testing helpers for scene transitions and state verification

## Acceptance Criteria

A successful refactor would allow:

1. ✅ UI to observe scene state with a simple hook/subscription
2. ✅ All scene lifecycle events emitted through World's event bus
3. ✅ State machine validated and explicit (no invalid transitions)
4. ✅ Scene transitions to be tested without mocking event system
5. ✅ Scene stack operations to be well-documented and tested
6. ✅ New game developers to understand scene transitions in 10 minutes
7. ✅ No regression in existing game functionality

## Effort Estimate

- **Phase 1 (Event System):** 2-3 days
- **Phase 2 (Observable State):** 2-3 days
- **Phase 3 (Unify Lifecycle):** 3-4 days
- **Phase 4 (Document & Test Stack):** 1-2 days
- **Phase 5 (Transition Options):** 2-3 days
- **Integration & Testing:** 2-3 days

**Total:** 12-18 days for complete refactor

## Implementation Priority

1. **Start with:** Event system (Phase 1) + Observable state (Phase 2)
   - These address the most pressing pain points (UI coupling)
   - Can be done incrementally without breaking existing code
   - Provides immediate value to game developers

2. **Follow with:** Unify lifecycle management (Phase 3)
   - Requires buy-in from Phase 1 & 2
   - Largest refactor

3. **Polish with:** Stack documentation (Phase 4) + Transition options (Phase 5)
   - Nice-to-have features
   - Can be added after core improvements

## Next Steps

1. Create an issue tracker item for each phase
2. Review with team for agreement on approach
3. Prototype Phase 1 (event system) with a spike
4. Implement phases in order with backward compatibility
