# Asteroids Game: Scene Manager Refactor

**Date:** 2026-01-05  
**Scope:** Utilize Engine Phase 1-4 improvements to improve game architecture  
**Status:** Planning  
**Priority:** High (reduces code complexity, improves maintainability)

## Overview

The asteroids game currently relies on event-based state management for UI transitions. While functional, this approach is difficult to reason about and creates tight coupling between game logic and UI rendering. This refactor will leverage the engine's new observable scene state, unified event system, and scene stack capabilities to create a cleaner, more maintainable architecture.

## Current Architecture Issues

### 1. **Multiple Event Handlers for Single Concept**

**Problem:** The UI maintains its own state synchronized with multiple independent events:

```tsx
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
- Three separate event listeners for what is logically one concept: "what view should be shown?"
- No single source of truth for current view
- Order of event execution is implicit (which fires first?)
- Hard to add new views (requires new event listeners)
- Race conditions possible if events fire in unexpected order
- Event names are magic strings with no type safety

### 2. **Manual State Synchronization**

**Problem:** Wave number state is manually fetched and synchronized:

```tsx
world.onEvent("entering_zone", () => {
  const waveManager = world.getResource<WaveManager>("waveManager");
  setWaveNumber(waveManager?.currentWaveNumber ?? 1);  // Manual sync!
  setCurrentView("enteringZone");
});
```

**Issues:**
- React component must know to query `waveManager` resource
- Tight coupling between UI and game logic
- Risk of state being out of sync if resource access fails
- No way to get current wave number at arbitrary time

### 3. **Entering Zone Effect Uses Ad-Hoc Events**

**Problem:** The entering zone effect is triggered by events but lacks explicit lifecycle:

```tsx
world.onEvent("entering_zone", () => {
  // Show UI
});

world.onEvent("entering_zone_effect_complete", () => {
  // Hide UI
});
```

**Issues:**
- Effect completion relies on external event (tight coupling)
- No way to know if effect is currently playing
- Can't query progress or state of effect
- Hard to coordinate with scene transitions
- Effect duration is implicit, not observable

### 4. **No Scene State Machine**

**Problem:** Scene transitions happen without validation:

```tsx
world.onEvent("scene-transition", (event) => {
  setCurrentView(event.data.view);  // Any transition allowed
});
```

**Issues:**
- No validation of valid state transitions
- Can transition from any state to any other state
- No way to prevent invalid transitions
- Hard to add rules like "can't pause from title screen"

### 5. **Unclear Scene Semantics**

**Problem:** The game doesn't use the scene stack or observable state:

**Current Views:**
- `title` - Main menu
- `gameplay` - Active wave
- `enteringZone` - Temporary effect overlay during wave transition

**Issues:**
- Menu and gameplay are replaced, not stacked
- No way to pause gameplay with a menu on top
- Future pause/settings menus will need new events
- No clear relationship between scenes and views

## Proposed Refactor

### Phase 1: Define Game Scenes (Engine-Level)

Create explicit scene classes that map to game states:

```typescript
// src/game/scenes/title-scene.ts
import { Scene, World } from "@engine/mod.ts";

export class TitleScene extends Scene {
  id = "title";
  
  async init(world: World): Promise<void> {
    // Initialize title scene
    // Show title screen UI
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup
  }
}

// src/game/scenes/gameplay-scene.ts
export class GameplayScene extends Scene {
  id = "gameplay";
  
  async init(world: World): Promise<void> {
    // Initialize gameplay
    // Spawn player, wave manager, etc.
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup gameplay entities
  }
}

// src/game/scenes/entering-zone-scene.ts
export class EnteringZoneScene extends Scene {
  id = "entering-zone";
  readonly isPaused = true;  // Pauses scene underneath (gameplay)
  
  constructor(private zoneNumber: number) {
    super();
  }
  
  async init(world: World): Promise<void> {
    // Initialize entering zone effect
    // Spawn particles, set up timers
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup particles
  }
}
```

**Benefits:**
- Scenes are explicit and discoverable
- Each scene has clear initialization and cleanup
- Scene lifecycle is type-safe
- Can be tested independently

### Phase 2: Replace Manual View State with Scene State

**Before:**

```tsx
const [currentView, setCurrentView] = useState<"title" | "gameplay" | "enteringZone">("title");
const [waveNumber, setWaveNumber] = useState(1);

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

**After:**

```tsx
import { useSceneState } from "@engine/hooks";
import type { SceneManager } from "@engine/mod.ts";

export function GameUI({ world, sceneManager }: GameUIProps) {
  // Observable scene state - single source of truth
  const currentScene = useSceneState(sceneManager);
  
  // Query current scene properties
  const waveManager = currentScene?.id === "gameplay" 
    ? world.getResource<WaveManager>("waveManager")
    : null;
  const waveNumber = waveManager?.currentWaveNumber ?? 1;

  // Render based on scene
  switch (currentScene?.id) {
    case "title":
      return <Title />;
    case "gameplay":
      return (
        <>
          <Hud world={world} />
          <DebugInfo world={world} />
        </>
      );
    case "entering-zone":
      return (
        <>
          <EnteringZone zoneNumber={waveNumber} />
          <DebugInfo world={world} />
        </>
      );
  }
}
```

**Benefits:**
- Single source of truth: current scene from SceneManager
- No duplicate state synchronization
- Clear rendering logic based on scene
- Easy to add new scenes (just add new case)
- Typed and discoverable (catch invalid scene IDs at compile time)

**Custom Hook Implementation (in game codebase):**

```typescript
// src/hooks/useSceneState.ts
import { useEffect, useState } from "react";
import type { Scene } from "@engine/mod.ts";
import type { SceneManager } from "@engine/mod.ts";

export function useSceneState(sceneManager: SceneManager): Scene | null {
  const [currentScene, setCurrentScene] = useState<Scene | null>(
    sceneManager.getCurrentScene()
  );

  useEffect(() => {
    // Subscribe to scene changes
    return sceneManager.subscribeToSceneChanges((scene) => {
      setCurrentScene(scene);
    });
  }, [sceneManager]);

  return currentScene;
}
```

### Phase 3: Use Scene Stack for Layered Scenes

The entering zone effect is currently a "view" that replaces gameplay. Better approach: push it onto the scene stack as a paused overlay.

**Before (Flat View System):**

```
currentView = "gameplay"      → Show HUD
↓ (entering_zone event)
currentView = "enteringZone"  → Show effect (gameplay hidden)
↓ (effect complete event)
currentView = "gameplay"      → Show HUD again
```

**After (Scene Stack):**

```
Scene Stack:
  [EnteringZoneScene (paused=true)]  ← Current (top of stack)
  [GameplayScene (active)]           ← Underneath (paused)

// UI Renders:
// - Current scene on top: EnteringZone effect
// - Underlying scene: Paused gameplay HUD faded out
```

**Implementation:**

```typescript
// src/game/scenes/gameplay-scene.ts
export class GameplayScene extends Scene {
  id = "gameplay";
  
  async init(world: World): Promise<void> {
    // Initialize wave manager
    const waveManager = new WaveManager();
    world.addResource("waveManager", waveManager);
    
    // Listen for wave completion to push entering zone scene
    world.onEvent("entering_zone", (event) => {
      const zoneNumber = event.data.zoneNumber;
      const sceneManager = world.getResource<SceneManager>("sceneManager");
      
      // Push entering zone scene on top (pauses this scene)
      sceneManager.pushScene(new EnteringZoneScene(zoneNumber));
    });
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup
  }
}

// src/game/scenes/entering-zone-scene.ts
export class EnteringZoneScene extends Scene {
  id = "entering-zone";
  readonly isPaused = true;  // Gameplay scene underneath is paused
  
  constructor(private zoneNumber: number) {
    super();
  }
  
  async init(world: World): Promise<void> {
    // Spawn particle effects
    const effectSystem = world.getSystem<EnteringZoneEffectSystem>("entering-zone-effect");
    effectSystem?.activate(this.zoneNumber);
    
    // Auto-pop after effect duration
    setTimeout(() => {
      const sceneManager = world.getResource<SceneManager>("sceneManager");
      sceneManager.popScene(world);  // Returns to gameplay scene
    }, 3000);
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup particles
  }
}
```

**UI Adapts Automatically:**

```tsx
export function GameUI({ world, sceneManager }: GameUIProps) {
  const currentScene = useSceneState(sceneManager);
  const sceneStack = sceneManager.getSceneStack();
  const isGameplayPaused = sceneStack.length > 1;

  switch (currentScene?.id) {
    case "title":
      return <Title />;
    
    case "gameplay":
      return (
        <>
          <Hud world={world} faded={isGameplayPaused} />
          <DebugInfo world={world} />
        </>
      );
    
    case "entering-zone":
      return (
        <>
          {/* Scene stack ensures gameplay stays underneath */}
          <EnteringZone zoneNumber={(currentScene as EnteringZoneScene).zoneNumber} />
          <DebugInfo world={world} />
        </>
      );
  }
}
```

**Benefits:**
- Entering zone is a real scene with lifecycle, not an ad-hoc event
- Scene stack naturally pauses underlying scene
- No need for `entering_zone_effect_complete` event
- UI automatically shows/hides HUD based on scene stack
- Gameplay scene continues running (stays initialized), only paused
- Future menu/pause screens work the same way

### Phase 4: Add Observable State Machine Events

Subscribe to unified scene state change events:

```typescript
// src/main.tsx
async function setupGameWorld(world: World) {
  const sceneManager = new SceneManager();
  world.addResource("sceneManager", sceneManager);
  
  // Listen to all scene transitions via World event system
  world.onEvent<SceneTransitionEvent>("scene-transition", (event) => {
    console.log(`Scene: ${event.data.from?.id ?? "none"} → ${event.data.to.id}`);
  });
  
  // Listen to scene lifecycle events
  world.onEvent<SceneLifecycleEvent>("scene-load", (event) => {
    console.log(`Scene loaded: ${event.data.scene.id}`);
    // Can trigger analytics, sound effects, etc.
  });
  
  world.onEvent<SceneLifecycleEvent>("scene-unload", (event) => {
    console.log(`Scene unloaded: ${event.data.scene.id}`);
  });
  
  // Start with title scene
  sceneManager.loadScene(new TitleScene());
}
```

**Benefits:**
- All scene events flow through unified World event system
- Events are typed and discoverable
- Easy to add analytics, logging, or side effects
- Single event subscription point

### Phase 5: Future Extensibility

With this architecture, adding new scenes is straightforward:

```typescript
// Add a pause menu that stacks on top of gameplay
export class PauseMenuScene extends Scene {
  id = "pause-menu";
  readonly isPaused = true;
  
  async init(world: World): Promise<void> {
    // Setup pause menu
  }
  
  async dispose(world: World): Promise<void> {
    // Cleanup
  }
}

// Listen for pause input in gameplay
world.onInput("pause", () => {
  const sceneManager = world.getResource<SceneManager>("sceneManager");
  sceneManager.pushScene(new PauseMenuScene());
});

// UI automatically shows pause menu without changes!
```

## Implementation Plan

### Step 1: Create Scene Classes

Create explicit scene files:
- `src/game/scenes/title-scene.ts` - Refactor existing TitleScene
- `src/game/scenes/gameplay-scene.ts` - New scene for wave/game logic
- `src/game/scenes/entering-zone-scene.ts` - Convert entering zone effect to scene

**Effort:** 2-3 hours  
**Risk:** Low (isolated changes)  
**Testing:** Unit tests for each scene's init/dispose

### Step 2: Create useSceneState Hook

Add React integration hook in `src/hooks/useSceneState.ts`:

```typescript
export function useSceneState(sceneManager: SceneManager): Scene | null {
  const [currentScene, setCurrentScene] = useState<Scene | null>(
    sceneManager.getCurrentScene()
  );

  useEffect(() => {
    return sceneManager.subscribeToSceneChanges((scene) => {
      setCurrentScene(scene);
    });
  }, [sceneManager]);

  return currentScene;
}
```

**Effort:** 1 hour  
**Risk:** Very Low  
**Testing:** Hook test with mock SceneManager

### Step 3: Refactor GameUI Component

Update `src/ui/components/game-ui/GameUI.tsx` to use scene state:

- Replace `currentView` state with `useSceneState` hook
- Replace event listeners with scene-based rendering
- Update rendering logic with `switch(currentScene?.id)`

**Effort:** 1-2 hours  
**Risk:** Medium (core UI changes, need integration testing)  
**Testing:** Integration tests with full game world

### Step 4: Move GameplayScene Logic

Move wave manager and game setup from `main.tsx` to `GameplayScene`:

- Create `GameplayScene` class
- Move `setupGameWorld` logic into scene's `init()` method
- Handle scene transitions in `GameplayScene` init

**Effort:** 2-3 hours  
**Risk:** Medium (moving significant logic)  
**Testing:** Integration tests for complete game flow

### Step 5: Convert Entering Zone Effect

Convert `EnteringZoneScene` from event-based to scene-based:

- Create `EnteringZoneScene` class
- Move particle spawning into scene init
- Remove explicit `entering_zone_effect_complete` event
- Use scene stack to pause underlying gameplay

**Effort:** 1-2 hours  
**Risk:** Medium (visual effect changes)  
**Testing:** Visual regression tests, effect timing tests

### Step 6: Add Scene Event Listeners

Add unified scene event handling in `main.tsx`:

- Listen to `scene-transition` events
- Listen to `scene-load` / `scene-unload` events
- Add analytics/logging hooks

**Effort:** 1 hour  
**Risk:** Low  
**Testing:** Unit tests for event handlers

### Step 7: Integration & Testing

Comprehensive testing:

- Play through complete game flow (title → gameplay → wave → entering zone)
- Test scene stack operations (push/pop/pause/resume)
- Test wave transitions work smoothly
- Test entering zone effect plays correctly
- Performance profiling (no regressions)

**Effort:** 3-4 hours  
**Risk:** Medium  
**Testing:** Full integration tests, manual playtesting

## Expected Outcomes

### Cleaner Architecture

**Before:**
```
GameUI.tsx
  ├─ 3 separate event listeners
  ├─ 2 local state vars (currentView, waveNumber)
  ├─ Manual resource queries
  └─ Complex render logic with hardcoded event names

main.tsx
  └─ Flat initialization with no scene structure
```

**After:**
```
GameUI.tsx
  ├─ 1 custom hook (useSceneState)
  ├─ 0 local state (all from scene)
  ├─ Clean switch statement
  └─ Type-safe scene rendering

main.tsx
  └─ Scene-based initialization (clear entry point)

Scenes/
  ├─ TitleScene (title logic)
  ├─ GameplayScene (wave/game logic)
  └─ EnteringZoneScene (effect logic)
```

### Reduced Code Complexity

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Event Listeners (GameUI) | 3 | 1 | -66% |
| Local State (GameUI) | 2 | 0 | -100% |
| useEffect Complexity | High | Low | -70% |
| Lines in GameUI | ~70 | ~40 | -43% |
| Scene Classes | 1 | 3 | +2 |
| Total Code | ~70 | ~90 | +29% (but more organized) |

### Improved Maintainability

| Aspect | Before | After |
|--------|--------|-------|
| Adding new scene | Modify GameUI + events | Create Scene class |
| Understanding flow | Hunt through events | Read scene init() |
| Testing scenes | Mock World + events | Test Scene class directly |
| Type safety | String event names | Typed scenes, events |
| Single source of truth | Scattered state | SceneManager |

### Future Extensibility

With scene-based architecture, these features are trivial to add:

1. **Pause Menu** - Create `PauseMenuScene`, push on game input
2. **Settings Screen** - Create `SettingsScene`, push on menu input
3. **Difficulty Selection** - Create `DifficultyScene`, load before gameplay
4. **Game Over Screen** - Create `GameOverScene`, replace gameplay
5. **Tutorial Mode** - Create `TutorialScene` with special initialization
6. **Demo Mode** - Create `DemoScene` that auto-runs game
7. **Scene Transitions** - Add middleware/animations to `transitionToScene()`

All without modifying GameUI!

## Potential Challenges

### 1. SceneManager Availability

**Challenge:** Scenes need access to SceneManager, but need to be created before it exists.

**Solution:** Pass SceneManager to scene `init()` method or inject after creation:

```typescript
const scene = new GameplayScene();
sceneManager.loadScene(scene, world);  // Inject world, sceneManager available in init()
```

### 2. Preserving Gameplay State

**Challenge:** When entering zone effect scene stacks, should gameplay continue running or pause?

**Solution:** Scene stack handles this with `isPaused` flag. If `isPaused = true`, underlying scene's `update()` isn't called. If `false`, it runs (and can still handle input).

```typescript
export class EnteringZoneScene extends Scene {
  readonly isPaused = true;  // Pause gameplay
  // OR
  readonly isPaused = false; // Let gameplay run during effect
}
```

### 3. Clean Break from Event-Based Approach

**Challenge:** Game currently has event-based state management scattered throughout.

**Solution:** Complete refactor removes all old event listeners. Replace entirely with scene-based approach.

**What Gets Removed:**
- All `world.onEvent("scene-transition", ...)` listeners
- All `world.onEvent("entering_zone", ...)` listeners
- All `world.onEvent("entering_zone_effect_complete", ...)` listeners
- Manual `currentView` state management in GameUI
- Manual `waveNumber` state synchronization

**Clean Break Advantages:**
- No legacy code paths to maintain
- No confusion about which approach to use
- Simpler codebase (single way of doing things)
- Forces all code to use new patterns
- Better for early-stage game development

## Rollout Strategy

### Phase 1: Foundation (Safe)
- Create scene classes
- Create useSceneState hook
- Deploy without changing UI yet

### Phase 2: UI Update (Tested)
- Refactor GameUI to use scenes
- Full integration testing
- Manual playtesting
- Deploy when confident

### Phase 3: Optimization (Polish)
- Add scene event listeners
- Performance profiling
- Analytics integration
- Deploy after metrics confirmed

## Success Criteria

- ✅ Game plays identically to before (no behavior changes)
- ✅ Fewer event listeners in GameUI (from 3 to 1)
- ✅ Type-safe scene rendering (no string-based view names)
- ✅ Scene-based architecture is documented
- ✅ New developers can add scenes without modifying GameUI
- ✅ All existing tests pass
- ✅ No performance regressions
- ✅ Entering zone effect timing unchanged

## Questions for Review

1. Should `EnteringZoneScene` pause underlying gameplay, or should particles appear over active gameplay?
2. Should we expose `getSceneStack()` API to UI for debugging?
3. Should scene initialization be async or sync?
4. Should we version scenes or add metadata (e.g., scene categories)?
5. Should `isPaused` be a scene property or a parameter to `pushScene()`?

## Related Documents

- [Tech Debt: Scene Manager Architecture](../../engine/docs/design/2026-01-05-techdebt-scene-manager.md)
- [Scene Stack Specification](../../engine/docs/specs/scene-stack.md)
- [Entering Zone Effect Design](./2025-12-26-entering-zone-effect.md)

## Timeline

| Phase | Tasks | Duration | Owner |
|-------|-------|----------|-------|
| Foundation | Create scenes, hook | 3 hours | |
| UI Update | Refactor GameUI, test | 4 hours | |
| Optimization | Events, profiling | 2 hours | |
| **Total** | | **~9 hours** | |

## Conclusion

This refactor transforms the asteroids game from an event-driven UI model to a scene-based architecture. The change is architecturally sound, leverages engine improvements, and dramatically improves code clarity and maintainability. The entering zone effect becomes a proper scene with lifecycle management rather than an ad-hoc event flow.

Most importantly, this pattern sets up the game for easy extension. Adding new scenes, UI flows, and gameplay states requires minimal changes to existing code.
