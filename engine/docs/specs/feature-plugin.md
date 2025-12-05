# Feature Plugins

## Overview
In an Entity–Component–System (ECS) framework, a **plugin** is a modular bundle of systems, components, and resources that can be added to extend or configure the ECS's behavior. A plugin is a packaged set of ECS functionality that can be plugged into the world to add features or modify how the ECS runs.

Plugins are the primary mechanism for extending the engine without modifying core code, enabling scalability and maintainability as the codebase grows.

## Plugin Philosophy

### Single Responsibility
Each plugin should have one clear purpose. A physics plugin handles physics, a rendering plugin handles rendering, etc. Avoid creating monolithic plugins that do too many things.

### Encapsulation
Plugins should encapsulate their implementation details. Games should interact with plugins through well-defined interfaces, not internal implementation.

### Composability
Plugins should work together without tight coupling. A physics plugin shouldn't directly depend on a rendering plugin, though they may share common components like `Transform`.

### Promotion Path
If a plugin is useful across many games, it should be promoted to sit inside the engine. Game-specific plugins remain in the game folder.

---

## Plugin Structure

### Anatomy of a Plugin
A well-structured plugin contains:

```typescript
// engine/src/features/physics-plugin/mod.ts

import type { World } from "../../core/world.ts";

// 1. Components specific to this feature
export class RigidBody {
  mass: number = 1.0;
  velocity = { x: 0, y: 0, z: 0 };
  isKinematic: boolean = false;
}

export class Collider {
  shape: "box" | "sphere" | "capsule" = "box";
  size = { x: 1, y: 1, z: 1 };
  isTrigger: boolean = false;
}

// 2. Resources for global state
export class PhysicsWorld {
  gravity = { x: 0, y: -9.81, z: 0 };
  substeps: number = 1;
  // ... internal physics world state
}

// 3. Systems that process the components
export class PhysicsSystem {
  update(world: World, dt: number) {
    const physicsWorld = world.getResource<PhysicsWorld>("PhysicsWorld");
    
    // Query entities with physics components
    const entities = world.query(RigidBody, Collider).get();
    
    // Process physics simulation
    for (const entity of entities) {
      const rb = world.get(entity, RigidBody);
      const collider = world.get(entity, Collider);
      // ... physics logic
    }
  }
}

// 4. Plugin installer function
export function installPhysicsPlugin(world: World) {
  // Register resources
  world.addResource("PhysicsWorld", new PhysicsWorld());
  
  // Register systems
  world.addSystem(new PhysicsSystem());
  
  // Optional: Create default entities
  // Optional: Register event handlers
  // Optional: Initialize third-party libraries
}

// 5. Optional: Configuration object
export interface PhysicsPluginConfig {
  gravity?: { x: number; y: number; z: number };
  substeps?: number;
  enableDebugDraw?: boolean;
}

export function installPhysicsPluginWithConfig(
  world: World, 
  config?: PhysicsPluginConfig
) {
  const physicsWorld = new PhysicsWorld();
  
  if (config?.gravity) {
    physicsWorld.gravity = config.gravity;
  }
  if (config?.substeps) {
    physicsWorld.substeps = config.substeps;
  }
  
  world.addResource("PhysicsWorld", physicsWorld);
  world.addSystem(new PhysicsSystem());
}
```

### Minimal Plugin Example

```typescript
// engine/src/features/time-plugin/mod.ts

export class TimeResource {
  elapsed: number = 0;
  frameCount: number = 0;
}

export class TimeSystem {
  update(world: World, dt: number) {
    const time = world.getResource<TimeResource>("Time");
    time.elapsed += dt;
    time.frameCount++;
  }
}

export function installTimePlugin(world: World) {
  world.addResource("Time", new TimeResource());
  world.addSystem(new TimeSystem());
}
```

---

## Plugin Categories

### Core Plugins
Fundamental features that nearly every game needs. Located in `engine/src/features/`.

**Examples:**
- `transform-plugin` - Position, rotation, scale, hierarchy
- `camera-plugin` - Camera entities and projection
- `time-plugin` - Frame timing and elapsed time
- `input-plugin` - Keyboard, mouse, gamepad input

### Engine Plugins
Reusable features useful across multiple games. Located in `engine/src/features/`.

**Examples:**
- `physics-plugin` - Physics simulation (Rapier integration)
- `renderer-plugin` - 3D/2D rendering (Three.js/Babylon.js integration)
- `audio-plugin` - Sound playback and spatial audio
- `asset-plugin` - Asset loading and management
- `scene-plugin` - Scene loading and transitions
- `particle-plugin` - Particle system
- `animation-plugin` - Skeletal and sprite animation
- `ui-plugin` - UI integration (React/Solid.js bridge)
- `networking-plugin` - Multiplayer networking
- `debug-plugin` - Debug visualization and tooling

### Game Plugins
Game-specific features. Located in `games/<game-name>/src/features/`.

**Examples:**
- `combat-plugin` - Combat system logic
- `quest-plugin` - Quest tracking and objectives
- `inventory-plugin` - Inventory management
- `dialogue-plugin` - Dialogue trees
- `ai-plugin` - Enemy AI behaviors
- `save-plugin` - Save/load game state

---

## Plugin Best Practices

### 1. Namespacing Components and Resources
Avoid naming conflicts by using descriptive, unique names:

```typescript
// ❌ Bad - generic names
export class Body { }
export class Mesh { }

// ✅ Good - clear, specific names
export class RigidBody { }
export class RenderableMesh { }
```

### 2. Resource Naming Conventions
Use consistent, descriptive resource names:

```typescript
// Resource names should match the class name for clarity
world.addResource("PhysicsWorld", new PhysicsWorld());
world.addResource("InputState", new InputState());
world.addResource("AssetRegistry", new AssetRegistry());
```

### 3. System Ordering and Dependencies
Systems run in the order they're registered. Document dependencies:

```typescript
export function installGamePlugins(world: World) {
  // Order matters! Input must run before player controller
  installInputPlugin(world);        // 1. Collect input
  installPlayerControllerPlugin(world); // 2. Process input
  installPhysicsPlugin(world);      // 3. Simulate physics
  installAnimationPlugin(world);    // 4. Update animations
  installRendererPlugin(world);     // 5. Render frame
}
```

### 4. Plugin Configuration
Support configuration for flexibility:

```typescript
export interface RendererPluginConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  shadowsEnabled?: boolean;
  rendererType?: "webgl" | "webgpu";
}

export function installRendererPlugin(
  world: World,
  config: RendererPluginConfig = {}
) {
  const renderer = new RendererResource(config);
  world.addResource("Renderer", renderer);
  world.addSystem(new RenderSystem());
}
```

### 5. Cleanup and Disposal
Provide cleanup methods for plugins that manage external resources:

```typescript
export class RendererResource {
  private renderer: THREE.WebGLRenderer;
  
  constructor(config: RendererPluginConfig) {
    this.renderer = new THREE.WebGLRenderer(config);
  }
  
  dispose() {
    this.renderer.dispose();
    // Clean up textures, geometries, etc.
  }
}

// Usage in game shutdown:
world.getResource<RendererResource>("Renderer").dispose();
```

### 6. Event System Integration
Plugins should support event-driven communication:

```typescript
export class CollisionEvent {
  entityA: GUID;
  entityB: GUID;
  contactPoint: { x: number; y: number; z: number };
}

export class PhysicsSystem {
  update(world: World, dt: number) {
    // Detect collisions...
    
    // Emit events for other systems to react to
    const events = world.getResource<EventQueue>("Events");
    events.emit(new CollisionEvent({ entityA, entityB, contactPoint }));
  }
}
```

### 7. Query Optimization
Cache queries when possible to avoid repeated lookups:

```typescript
export class PhysicsSystem {
  private rigidBodyQuery?: Query;
  
  update(world: World, dt: number) {
    // Initialize query once, reuse every frame
    if (!this.rigidBodyQuery) {
      this.rigidBodyQuery = world.query(RigidBody, Transform);
    }
    
    const entities = this.rigidBodyQuery.get();
    // ... process entities
  }
}
```

### 8. Type Safety
Export types for components and resources:

```typescript
// Export everything needed by games
export type { PhysicsPluginConfig };
export { RigidBody, Collider, PhysicsWorld };
export { PhysicsSystem };
export { installPhysicsPlugin, installPhysicsPluginWithConfig };
```

---

## Plugin Lifecycle

### Installation
Plugins are installed during world initialization:

```typescript
// games/dungeon/src/game/main.ts
import { World } from "@engine";
import { installPhysicsPlugin } from "@engine/features/physics-plugin";
import { installRendererPlugin } from "@engine/features/renderer-plugin";
import { installCombatPlugin } from "./features/combat-plugin/mod.ts";

const world = new World();

// Install core plugins
installTimePlugin(world);
installInputPlugin(world);
installTransformPlugin(world);

// Install engine plugins
installPhysicsPlugin(world);
installRendererPlugin(world);

// Install game plugins
installCombatPlugin(world);
```

### Update Loop
Systems within plugins execute during `world.updateSystems()`:

```typescript
function gameLoop(timestamp: number) {
  const dt = calculateDeltaTime(timestamp);
  
  world.updateSystems(dt); // All plugin systems run here
  
  requestAnimationFrame(gameLoop);
}
```

### Shutdown
Clean up resources when the game ends:

```typescript
function shutdownGame() {
  // Dispose resources that need cleanup
  world.getResource<RendererResource>("Renderer").dispose();
  world.getResource<PhysicsWorld>("PhysicsWorld").dispose();
  world.getResource<AudioEngine>("AudioEngine").dispose();
}
```

---

## Testing Plugins

### Unit Testing Components
```typescript
// engine/src/features/physics-plugin/rigid-body.test.ts
import { describe, it, expect } from "vitest";
import { RigidBody } from "./mod.ts";

describe("RigidBody", () => {
  it("should have default values", () => {
    const rb = new RigidBody();
    expect(rb.mass).toBe(1.0);
    expect(rb.isKinematic).toBe(false);
  });
});
```

### Integration Testing Systems
```typescript
// engine/src/features/physics-plugin/physics-system.test.ts
import { describe, it, expect } from "vitest";
import { World } from "../../core/world.ts";
import { installPhysicsPlugin, RigidBody } from "./mod.ts";

describe("PhysicsSystem", () => {
  it("should apply gravity", () => {
    const world = new World();
    installPhysicsPlugin(world);
    
    const entity = world.createEntity();
    world.add(entity, new RigidBody());
    
    world.updateSystems(1.0); // Simulate 1 second
    
    const rb = world.get(entity, RigidBody);
    expect(rb.velocity.y).toBe(-9.81);
  });
});
```

---

## Plugin Documentation Template

Every plugin should include a README:

```markdown
# [Plugin Name]

## Purpose
Brief description of what this plugin does.

## Components
- `ComponentName` - Description

## Resources
- `ResourceName` - Description

## Systems
- `SystemName` - Description and execution order requirements

## Installation

\`\`\`typescript
import { installMyPlugin } from "@engine/features/my-plugin";

installMyPlugin(world);
\`\`\`

## Configuration

\`\`\`typescript
installMyPlugin(world, {
  option1: value1,
  option2: value2
});
\`\`\`

## Usage Example

\`\`\`typescript
const entity = world.createEntity();
world.add(entity, new MyComponent());
\`\`\`

## Dependencies
- List of required plugins
- List of optional plugins

## Known Issues
- Any current limitations

## Future Improvements
- Planned enhancements
```

---

## Scaling Considerations

### 1. Modular File Structure
As plugins grow, split them into focused files:

```
features/
  physics-plugin/
    mod.ts              # Public API exports
    components/
      rigid-body.ts
      collider.ts
      joint.ts
    systems/
      physics-system.ts
      collision-system.ts
    resources/
      physics-world.ts
    utils/
      shape-builder.ts
    tests/
      physics-system.test.ts
    README.md
```

### 2. Version Compatibility
**Note**: This section describes future best practices for version compatibility. In the current early stages of the engine, version checks are not required and should not be implemented yet to avoid maintenance burden. Revisit this when the engine reaches beta or stable releases.

For now, include a simple version constant for tracking:

```typescript
export const PHYSICS_PLUGIN_VERSION = "0.1.0-alpha";

export function installPhysicsPlugin(world: World) {
  // TODO: Enable version check when engine matures
  // const engineVersion = world.getEngineVersion();
  // if (!isCompatible(engineVersion, ">=2.0.0")) {
  //   throw new Error("PhysicsPlugin requires engine v2.0.0+");
  // }
  
  // ... install
}
```

Add a basic engine version constant to the core (e.g., in `engine/src/mod.ts`):

```typescript
export const ENGINE_VERSION = "0.1.0-alpha"; // Update manually as needed
```

### 3. Lazy Loading
For large plugins, consider lazy initialization:

```typescript
export class AssetPlugin {
  private initialized = false;
  
  async initialize(world: World) {
    if (this.initialized) return;
    
    // Load heavy dependencies only when needed
    const { AssetLoader } = await import("./heavy-dependency.ts");
    // ...
    this.initialized = true;
  }
}
```

### 4. Plugin Dependencies
Document and enforce plugin dependencies:

```typescript
export function installRendererPlugin(world: World) {
  // Verify required plugins are installed
  if (!world.getResource("Transform")) {
    throw new Error("RendererPlugin requires TransformPlugin to be installed first");
  }
  
  // ... install
}
```

### 5. Performance Monitoring
Add instrumentation for profiling:

```typescript
export class PhysicsSystem {
  update(world: World, dt: number) {
    const startTime = performance.now();
    
    // ... physics logic
    
    const endTime = performance.now();
    const metrics = world.getResource<PerformanceMetrics>("Metrics");
    metrics.recordSystemTime("PhysicsSystem", endTime - startTime);
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Direct Plugin-to-Plugin Coupling
```typescript
// Bad: PhysicsSystem directly accessing RendererSystem
export class PhysicsSystem {
  update(world: World, dt: number) {
    const renderer = world.getResource<RendererSystem>("Renderer");
    renderer.drawDebugLine(...); // Tight coupling!
  }
}
```

### ✅ Use Events or Shared Components
```typescript
// Good: Emit debug draw requests via events
export class PhysicsSystem {
  update(world: World, dt: number) {
    const debugDraw = world.getResource<DebugDrawQueue>("DebugDraw");
    debugDraw.addLine(start, end, color);
  }
}
```

### ❌ Modifying Core World API
```typescript
// Bad: Extending World class in a plugin
declare module "../../core/world.ts" {
  interface World {
    doPhysicsThing(): void; // Don't pollute core API
  }
}
```

### ✅ Use Resources for Plugin-Specific APIs
```typescript
// Good: Plugin-specific functionality in resources
export class PhysicsAPI {
  rayCast(origin: Vector3, direction: Vector3): RayCastResult {
    // ...
  }
}

world.addResource("PhysicsAPI", new PhysicsAPI());
```

---

## Engine Export Pattern

Plugins should be exported through the main engine module:

```typescript
// engine/src/mod.ts

// Core
export { World } from "./core/world.ts";
export { Query } from "./core/query.ts";

// Components
export * from "./components/mod.ts";

// Systems
export * from "./systems/mod.ts";

// Resources
export * from "./resources/mod.ts";

// Feature Plugins
export * as PhysicsPlugin from "./features/physics-plugin/mod.ts";
export * as RendererPlugin from "./features/renderer-plugin/mod.ts";
export * as InputPlugin from "./features/input-plugin/mod.ts";
// ... etc
```

Usage in games:

```typescript
import { World, PhysicsPlugin, RendererPlugin } from "@engine";

const world = new World();
PhysicsPlugin.install(world);
RendererPlugin.install(world, { antialias: true });
```

---

## Checklist for Creating a New Plugin

- [ ] Create plugin folder in appropriate location (`engine/src/features/` or `games/<name>/src/features/`)
- [ ] Define components with clear, namespaced names
- [ ] Define resources for global state
- [ ] Implement systems with clear update logic
- [ ] Create installer function(s) with optional configuration
- [ ] Export public API through `mod.ts`
- [ ] Write unit tests for components
- [ ] Write integration tests for systems
- [ ] Document plugin in README.md
- [ ] Add usage example in documentation
- [ ] Add plugin to engine/src/mod.ts exports (if engine plugin)
- [ ] Test plugin in isolation
- [ ] Test plugin with other plugins for conflicts
- [ ] Add performance benchmarks (if applicable)
- [ ] Consider cleanup/disposal needs
