# Scene Manager System

Feature Name: Scene Manager & Scene Lifecycle
Filename: `2025-12-06-scene-manager.md`
Date: 2025-12-06
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Enable developers to organize game content into discrete, self-contained scenes that can be easily created, loaded, unloaded, reset, and transitioned between. Scenes encapsulate gameplay states (main menu, gameplay levels, pause screens, etc.) while maintaining strict ECS architecture principles.

Goal / Expected Outcome:
- Developers can define multiple scenes per game (menus, levels, demos)
- Scenes can be loaded, reset, and disposed without engine restart
- Smooth transitions between scenes with cleanup guarantees
- Minimal boilerplate for scene creation, especially for engine demo scenes
- Scene state is managed as a core engine resource, not scattered across game code
- Clear separation between production game scenes and engine demonstration scenes

### Background / Context:
Currently, the engine initializes entities and systems directly in the game's main entry point. As games grow, they need multiple distinct states (levels, menus, cutscenes) that require different entity configurations and potentially different system sets. A scene manager provides this organizational layer while respecting ECS principles: scenes are not objects with methods, but rather **descriptors of what entities/components/systems should exist** in a given game state.

## Feature Description

### Summary:
This feature introduces a **Scene Manager** as a core engine component that manages scene lifecycle through:
- **Scene Interface** - A contract that scenes implement to describe their initialization, cleanup, and reset logic
- **SceneManager Resource** - Global state tracking the current scene, transitions, and scene stack
- **Scene Lifecycle Systems** - Systems that process scene transitions, initialization, and cleanup
- **Base Scene Classes** - Optional convenience classes for production and demo scenes

The design follows ECS principles: scenes describe *what* entities and systems to create, the SceneManager resource holds *state*, and systems contain the *logic* for transitions.

### Key Requirements:

#### Core Scene Manager
- Implement as a **core engine component** (not a plugin) since it directly orchestrates World entity/system lifecycle
- Scene manager maintains a stack/queue of scenes to support transitions and scene hierarchies
- Support scene preloading for seamless transitions
- Guarantee cleanup: all entities created by a scene are destroyed when the scene unloads
- Track scene state: `unloaded`, `loading`, `active`, `paused`, `unloading`

#### Scene Lifecycle
- **create()** - Initial setup, called once when scene is first instantiated
- **init()** - Called when scene becomes active, spawns entities and registers scene-specific systems
- **update(world, dt)** (optional) - Called every frame while scene is active, for per-frame scene logic (animations, input, etc.)
- **reset()** - Clears all scene entities and re-runs init() without full unload/reload cycle
- **dispose()** - Final cleanup when scene is permanently removed, releases resources

#### Scene Types & Hierarchy
- **BaseScene** - Foundation for production game scenes with common functionality (UI overlays, pause handling, etc.)
- **DemoBaseScene** - Lightweight base for engine demonstration scenes (extends BaseScene)
  - Minimal boilerplate setup
  - Standardized UI/controls (reset button, FPS counter, back to menu)
  - Focus on showcasing a single engine feature
  - Easy scene reset for debugging and iteration
- **Scene Interface** - Core contract that both base classes implement

#### Scene Transitions
- Scene loading is instant (no built-in transition effects)
- Games implement transitions at the game level using custom overlay scenes or animation systems
- SceneManager triggers unload/load; game controls the visual presentation

#### Developer Experience
- Simple API: `sceneManager.loadScene(new MyScene())`
- Easy scene creation: extend BaseScene or DemoBaseScene and implement required methods
- Automatic entity cleanup: entities tagged with scene ID are auto-removed
- Scene context preserved: scenes can return to previous state after pause/resume

#### Extensibility
- Scenes can define custom properties without refactoring core manager
- Support for scene parameters/configuration (e.g., level number, difficulty)
- Hook system for game-wide scene events (onSceneLoad, onSceneUnload)

### Non-Goals:
- **Scene transitions/effects (v1)** - Scene loading is instant. Games implement visual transitions (fades, wipes, loading screens) at the game level using overlay scenes or animation systems. This keeps the engine minimal and allows each game to define transitions that fit its aesthetic. Rationale: (1) Transitions are too opinionated for an early engine, (2) ECS games typically don't bake transitions into core, (3) Scope creep—transitions can range from simple fades to complex loading indicators, (4) Game-level implementation is cleaner and more flexible.
- **Async scene loading** - Scenes load synchronously in v1. Games can wrap scene loading in async tasks if needed.
- **Loading progress indicators** - Game-level concern, not engine responsibility
- Scene serialization/deserialization (save/load) - separate feature
- Visual scene editor or authoring tools
- Scene streaming or level-of-detail management
- Multi-scene rendering (simultaneous active scenes) - future enhancement
- Network-synchronized scene state

## Technical Design

### Core Architecture

#### Scene Interface
The fundamental contract all scenes implement:

```typescript
// engine/src/core/scene.ts
export interface Scene {
  /** Unique scene identifier */
  readonly id: string;
  
  /** Called once when scene is created */
  create(): void;
  
  /** Called when scene becomes active, spawn entities here */
  init(world: World): void;
  
  /** Called when scene is deactivated */
  pause(world: World): void;
  
  /** Called when scene is reactivated after pause */
  resume(world: World): void;
  
  /** Reset scene to initial state without full reload */
  reset(world: World): void;
  
  /** Called every frame while scene is active (optional) */
  update?(world: World, dt: number): void;
  
  /** Called when scene is being removed, cleanup resources */
  dispose(world: World): void;
}

export enum SceneState {
  Unloaded = 'unloaded',
  Loading = 'loading',
  Active = 'active',
  Paused = 'paused',
  Unloading = 'unloading',
}
```

#### SceneManager Resource
Global state for scene management:

```typescript
// engine/src/resources/scene-manager.ts
export class SceneManager {
  /** Currently active scene */
  private currentScene: Scene | null = null;
  
  /** Current scene state */
  private state: SceneState = SceneState.Unloaded;
  
  /** Scene stack for hierarchical scenes (e.g., pause menu over gameplay) */
  private sceneStack: Scene[] = [];
  
  /** Scene load hooks */
  private onSceneLoadCallbacks: ((scene: Scene) => void)[] = [];
  private onSceneUnloadCallbacks: ((scene: Scene) => void)[] = [];
  
  /** Load a new scene, replacing current scene (instant) */
  loadScene(scene: Scene): void;
  
  /** Push a scene onto the stack (pauses current scene, instant) */
  pushScene(scene: Scene): void;
  
  /** Pop current scene and resume previous (instant) */
  popScene(): void;
  
  /** Reset current scene to initial state */
  resetCurrentScene(): void;
  
  /** Get current scene */
  getCurrentScene(): Scene | null;
  
  /** Get current scene state */
  getState(): SceneState;
  
  /** Register scene lifecycle hooks */
  onSceneLoad(callback: (scene: Scene) => void): void;
  onSceneUnload(callback: (scene: Scene) => void): void;
}
```

#### Scene Lifecycle System
Processes scene transitions and state changes:

```typescript
// engine/src/systems/scene-lifecycle-system.ts
export class SceneLifecycleSystem {
  update(world: World, dt: number): void {
    const sceneManager = world.getResource<SceneManager>("sceneManager");
    if (!sceneManager) return;

    const state = sceneManager.getState();

    // Process scene state machine
    switch (state) {
      case SceneState.Loading: {
        this.handleLoading(world, sceneManager);
        break;
      }
      case SceneState.Unloading: {
        this.handleUnloading(world, sceneManager);
        break;
      }
      case SceneState.Active: {
        // Call update on the active scene
        const currentScene = sceneManager.getCurrentScene();
        if (currentScene?.update) {
          currentScene.update(world, dt);
        }
        break;
      }
      case SceneState.Paused: {
        // Scene is paused, don't call update
        break;
      }
      case SceneState.Unloaded: {
        // No scene active
        break;
      }
    }
  }

  private handleLoading(world: World, sceneManager: SceneManager): void {
    // Initialize scene and set to Active
  }

  private handleUnloading(world: World, sceneManager: SceneManager): void {
    // Clean up all scene entities
    // Call scene.dispose()
    // Load next scene if queued
  }
}
```

#### Generic Tag Component
General-purpose component for grouping and identifying entities. Used by scenes to track ownership, but also useful for many other scenarios (enemy waves, UI groups, audio channels, etc.):

```typescript
// engine/src/components/tag.ts
export class Tag {
  /** Identifier string for this tag */
  value: string;
  
  constructor(value: string) {
    this.value = value;
  }
}

// When scene creates entities
const entity = world.createEntity();
entity.addComponent(new Tag(this.id));  // Tag with scene ID
entity.addComponent(new Transform());
// ... other components
```

#### Demo UI Components
Components used by DemoBaseScene for standardized UI:

```typescript
// engine/src/components/demo-ui-text.ts
export interface DemoUITextConfig {
  /** Screen position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Optional title/heading */
  title?: string;
  
  /** Array of text lines to display */
  lines: string[];
  
  /** Font size in pixels */
  fontSize?: number;
  
  /** Background color (CSS color string) */
  backgroundColor?: string;
  
  /** Padding inside the box in pixels */
  padding?: number;
  
  /** Margin from screen edge X (left/right) */
  marginX?: number;
  
  /** Margin from screen edge Y (top/bottom) */
  marginY?: number;
}

export class DemoUIText {
  config: DemoUITextConfig;
  
  constructor(config: DemoUITextConfig) {
    this.config = {
      fontSize: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      marginX: 16,
      marginY: 16,
      ...config
    };
  }
}
```

#### BaseScene Implementation
Convenience base class for production game scenes:

```typescript
// engine/src/core/base-scene.ts
export abstract class BaseScene implements Scene {
  readonly id: string;
  
  constructor(id: string) {
    this.id = id;
  }
  
  create(): void {
    // Optional override
  }
  
  abstract init(world: World): void;
  
  pause(world: World): void {
    // Default pause behavior - can be overridden
  }
  
  resume(world: World): void {
    // Default resume behavior - can be overridden
  }
  
  update(world: World, dt: number): void {
    // Optional override for per-frame scene logic
  }
  
  reset(world: World): void {
    // Default: cleanup and re-init
    this.cleanup(world);
    this.init(world);
  }
  
  dispose(world: World): void {
    this.cleanup(world);
  }
  
  /** Helper to remove all entities owned by this scene */
  protected cleanup(world: World): void {
    const entities = world.query({ 
      all: [Tag] 
    });
    
    for (const entity of entities) {
      const tag = entity.getComponent(Tag);
      if (tag.value === this.id) {
        world.removeEntity(entity);
      }
    }
  }
  
  /** Helper to create scene-owned entity */
  protected createEntity(world: World): Entity {
    const entity = world.createEntity();
    entity.addComponent(new Tag(this.id));
    return entity;
  }
}
```

#### DemoBaseScene Class
Specialized base for engine demonstration scenes:

```typescript
// engine/src/core/demo-base-scene.ts
export abstract class DemoBaseScene extends BaseScene {
  private uiEntityIds: string[] = [];
  
  /**
   * Description shown in bottom-left corner
   * Override in subclass to customize
   */
  protected demoDescription: string = 'This is a demo of engine capabilities.';
  
  /**
   * Interaction instructions shown in top-left corner
   * Default shows common camera controls
   * Override to customize
   */
  protected demoInstructions: string[] = [
    'R - Reload Scene',
    'WASD - Move',
    'Click + Drag - Orbit Camera',
    'Middle Click - Pan Camera'
  ];
  
  constructor(id: string) {
    super(id);
  }
  
  init(world: World): void {
    // Add standard demo UI
    this.initDemoUI(world);
    
    // Call subclass implementation
    this.initDemo(world);
  }
  
  /** Override this instead of init() */
  abstract initDemo(world: World): void;
  
  private initDemoUI(world: World): void {
    // Create standard UI elements for all demos
    
    // Top-left: Interaction Instructions
    const instructionsUI = this.createEntity(world);
    instructionsUI.addComponent(new DemoUIText({
      position: 'top-left',
      title: 'Controls',
      lines: this.demoInstructions,
      fontSize: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      marginX: 16,
      marginY: 16
    }));
    this.uiEntityIds.push(instructionsUI.id);
    
    // Bottom-left: Demo Description
    const descriptionUI = this.createEntity(world);
    descriptionUI.addComponent(new DemoUIText({
      position: 'bottom-left',
      lines: [this.demoDescription],
      fontSize: 11,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      marginX: 16,
      marginY: 16
    }));
    this.uiEntityIds.push(descriptionUI.id);
    
    // Top-right: FPS counter (optional, managed by engine)
    // Reset button managed by global input system
  }
  
  reset(world: World): void {
    // Remove all scene entities except UI
    const entities = world.query({ all: [Tag] });
    for (const entity of entities) {
      const tag = entity.getComponent(Tag);
      if (tag.value === this.id && 
          !this.uiEntityIds.includes(entity.id)) {
        world.removeEntity(entity);
      }
    }
    
    // Re-initialize demo content
    this.initDemo(world);
  }
}
```

### File Structure

```
engine/src/
  core/
    scene.ts                    # Scene interface, SceneState enum
    base-scene.ts              # BaseScene class
    demo-base-scene.ts         # DemoBaseScene class
    world.ts                   # Enhanced with scene support
  
  components/
    tag.ts                     # Generic tagging component
  
  resources/
    scene-manager.ts           # SceneManager resource
  
  systems/
    scene-lifecycle-system.ts  # Scene transition & lifecycle logic
    scene-cleanup-system.ts    # Entity cleanup when scenes unload
```

### Usage Examples

#### Production Game Scene

```typescript
// games/dungeon/src/game/scenes/gameplay-scene.ts
import { BaseScene, World } from '@game-studio-x/engine';
import { Player } from '../features/player/components/player.ts';

export class GameplayScene extends BaseScene {
  private levelNumber: number;
  
  constructor(levelNumber: number) {
    super(`gameplay-${levelNumber}`);
    this.levelNumber = levelNumber;
  }
  
  init(world: World): void {
    // Spawn player
    const player = this.createEntity(world);
    player.addComponent(new Transform());
    player.addComponent(new Player());
    
    // Load level data
    this.loadLevel(world, this.levelNumber);
    
    // Register gameplay systems
    // Systems are automatically cleaned up when scene unloads
  }
  
  private loadLevel(world: World, level: number): void {
    // Spawn enemies, items, terrain based on level
  }
}

// games/dungeon/src/game/scenes/main-menu-scene.ts
export class MainMenuScene extends BaseScene {
  constructor() {
    super('main-menu');
  }
  
  init(world: World): void {
    // Create menu UI entities
    const playButton = this.createEntity(world);
    // ... setup button that loads GameplayScene
  }
}
```

#### Engine Demo Scene

```typescript
// engine/src/demos/shapes-demo-scene.ts
import { DemoBaseScene, World } from '../core/mod.ts';

export class ShapesDemoScene extends DemoBaseScene {
  constructor() {
    super('shapes-demo');
    
    // Customize UI for this demo
    this.demoDescription = 'Demonstrates basic 3D shape rendering with materials. Rotate to see different angles.';
    this.demoInstructions = [
      'R - Reload Scene',
      'WASD - Move Camera',
      'Click + Drag - Orbit',
      'Middle Click - Pan',
      'Scroll - Zoom'
    ];
  }
  
  // Only need to implement this - UI boilerplate is automatic
  initDemo(world: World): void {
    // Spawn a box
    const box = this.createEntity(world);
    box.addComponent(new Transform());
    box.addComponent(new BoxGeometry(2, 2, 2));
    box.addComponent(new Material({ color: 0xff0000 }));
    
    // Spawn a sphere
    const sphere = this.createEntity(world);
    sphere.addComponent(new Transform(vec3(3, 0, 0)));
    sphere.addComponent(new SphereGeometry(1));
    sphere.addComponent(new Material({ color: 0x00ff00 }));
    
    // That's it! Instructions, description, reset button, FPS counter, etc. are automatic
  }
}
```

#### Scene Transitions in Game

```typescript
// games/dungeon/src/main.tsx
import { World, SceneManager } from '@game-studio-x/engine';

// Setup
const world = new World();
const sceneManager = new SceneManager();
world.addResource(sceneManager);

// Register lifecycle system
world.registerSystem(new SceneLifecycleSystem());

// Load initial scene
sceneManager.loadScene(new MainMenuScene());

// Later, transition to gameplay (instant load)
sceneManager.loadScene(new GameplayScene(1));

// If game needs visual transition, wrap it:
const transitionScene = new FadeTransitionScene(
  new GameplayScene(1),
  500 // duration ms
);
sceneManager.loadScene(transitionScene);

// Pause menu (overlay scene)
sceneManager.pushScene(new PauseMenuScene());

// Resume from pause
sceneManager.popScene();

// Reset current scene (for debugging/retry)
sceneManager.resetCurrentScene();
```

### Integration with Existing Systems

#### World Enhancements
The World class needs minor additions to support scene management:

```typescript
// engine/src/core/world.ts
export class World {
  // Existing methods...
  
  /** Remove entity and all its components */
  removeEntity(entity: Entity): void {
    // Existing implementation
  }
  
  /** Remove all entities matching a predicate */
  removeEntitiesWhere(predicate: (entity: Entity) => boolean): void {
    const entities = this.getAllEntities();
    for (const entity of entities) {
      if (predicate(entity)) {
        this.removeEntity(entity);
      }
    }
  }
}
```

#### System Scoping (Optional Enhancement)
Allow systems to be scene-specific:

```typescript
export interface SystemOptions {
  /** If set, system only runs when this scene is active */
  sceneId?: string;
}

export class World {
  registerSystem(system: System, options?: SystemOptions): void {
    // Store scene association
    // Skip system execution if scene is not active
  }
}
```

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed (via user discussion)
- [x] Technical feasibility reviewed
- [x] Dependencies identified (core World integration)
- [x] Review with existing ECS architecture
- [x] Confirm approach with demo scene workflow

### Phase 2 — Design
- [x] Scene interface defined
- [x] SceneManager resource API designed
- [x] BaseScene and DemoBaseScene hierarchy planned
- [x] Decided to exclude scene transitions from v1 scope
- [x] Naming conventions approved (Scene vs SceneManager vs SceneState)
- [x] Architecture reviewed with team
- [x] Integration points with World confirmed

### Phase 3 — Implementation
- [ ] Scene interface implemented
- [ ] Tag component created (if not already exists in components)
- [ ] SceneManager resource implemented
- [ ] SceneLifecycleSystem implemented
- [ ] BaseScene class implemented
- [ ] DemoBaseScene class implemented
- [ ] World integration (removeEntity, queries)
- [ ] Edge cases handled (rapid scene switching, disposal during load)
- [ ] Performance considerations (entity cleanup optimization)

### Phase 4 — Testing
- [ ] Unit tests for SceneManager state transitions
- [ ] Unit tests for BaseScene lifecycle methods
- [ ] Unit tests for entity cleanup
- [ ] Integration test: scene transitions
- [ ] Integration test: scene stack (push/pop)
- [ ] Integration test: scene reset preserves UI
- [ ] Demo scene: shapes demo with reset
- [ ] Demo scene: second demo to test transitions
- [ ] Profiling: scene cleanup performance with 1000+ entities

### Phase 5 — Documentation & Release
- [ ] User-facing documentation (how to create scenes)
- [ ] Update engine README with scene manager overview
- [ ] API documentation for Scene interface
- [ ] Migration guide (how to convert existing games to use scenes)
- [ ] Release notes
- [ ] Demo examples (minimum 2 demo scenes)
- [ ] Tutorial: creating a production game scene
- [ ] Tutorial: creating an engine demo scene

## Risks & Concerns

### Technical Risks
1. **Entity Cleanup Performance** - Iterating all entities to find scene-owned ones could be slow
   - *Mitigation*: Maintain a map of sceneId → entity IDs in SceneManager for O(1) lookup
   
2. **System Registration/Unregistration** - Systems might need scene-specific logic
   - *Mitigation*: Start without system scoping, add if needed in v2
   
3. **Scene Data Persistence** - Scenes may need to preserve state (e.g., level progress)
   - *Mitigation*: Out of scope for v1, scenes are stateless by default

### Design Risks
1. **BaseScene vs DemoBaseScene Divergence** - The two might drift apart functionally
   - *Mitigation*: Both implement Scene interface, DemoBaseScene extends BaseScene for shared behavior
   
2. **Over-abstraction** - Scene interface might become too generic
   - *Mitigation*: Start minimal, add methods only when 2+ scenes need them
   
3. **Plugin Boundary Violation** - Scene manager is "core" but might need plugin-specific logic
   - *Mitigation*: Use hook/callback system so plugins can react to scene events

### Developer Experience Risks
1. **Boilerplate Overhead** - Creating scenes might feel verbose
   - *Mitigation*: DemoBaseScene minimizes boilerplate, provide scene templates
   
2. **Debugging Difficulty** - Hard to know which scene owns which entity
   - *Mitigation*: Add dev tools to inspect scene entity ownership in Tweakpane

### Mitigation Strategies
- Start with minimal implementation (Scene interface + SceneManager resource only)
- Build one production scene and one demo scene to validate API
- Iterate on BaseScene/DemoScene based on real usage patterns
- Add performance optimizations only after profiling real scenes
- Keep state machine simple: focus on load/unload first, add pause/resume later

## Open Questions
1. Should scenes be able to preload assets asynchronously?
   - **Decision needed**: Add async init() or keep synchronous for v1?
   
2. Should scene transitions block input?
   - **Recommendation**: Yes, disable input during transitions
   
3. How should scenes interact with the main game loop?
   - **Recommendation**: Scene systems run as part of World.update(), no special handling
   
4. Should we support simultaneous active scenes (e.g., split-screen)?
   - **Decision**: No for v1, single active scene only

## Success Criteria
- Developer can create a new scene in < 10 lines of code
- Scene reset works instantly (< 16ms for typical scene with 100 entities)
- Demo scenes have zero boilerplate for UI (reset, FPS, etc.)
- Scene transitions are smooth (no frame drops during entity cleanup)
- No memory leaks after loading/unloading 10+ scenes in succession
- API feels natural and consistent with existing ECS patterns

## Future Enhancements (Post-v1)
- Scene serialization for save/load
- Async scene loading with progress indicators
- Scene preloading/caching
- Multi-scene rendering (split-screen, picture-in-picture)
- Visual scene editor integration
- Scene templates/prefabs
- Scene-specific system registration
- Scene parameters/configuration system
- Hot-reloading of scenes during development
