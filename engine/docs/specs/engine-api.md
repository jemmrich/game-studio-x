# Engine API

The game engine needs to be easy to import into games without directly exposing internals which could be refactored or removed. This document outlines how this will work.

### Monorepo Folder Structure (Basic)

```
/engine
    docs/
    src/
        mod.ts
    deno.json
/games
    /game1
        src/
        deno.json
    /game2
        src/
        deno.json
```

## Deno Imports
We use namespaced imports

`deno.json`
```json
{
  "imports": {
    "@engine": "../../engine/src/mod.ts"
  }
}
```

## Vite Config
TBD

### Advantages:
- No copying engine files
- Each project can evolve independently, yet share code
- Engine stays isolated in its own folder and commit history, even in the same repo
- You can split the engine into its own repo later without losing commits

### Disadvantages:
- None significant. This is how most engines are built during early development.

### This is exactly how:
- Godot organizes modules
- Bevy organizes crates
- Vite, Deno, Turborepo, and pnpm monorepos work

## Use mod.ts (just an example)

### The Engine Entrypoint
```typescript
// engine/src/mod.ts

export { World } from "./core/world.ts";
export { Entity } from "./core/entity.ts";

export * as Components from "./components/mod.ts";
export * as Systems from "./systems/mod.ts";

export { Scene } from "./scene/scene.ts";
export { SceneManager } from "./scene/scene-manager.ts";

// Physics entrypoints
export { PhysicsSystem } from "./physics/physics-system.ts";

// Debug tools
export { DebugPanel } from "./debug/debug-panel.ts";
```

### Components Have Their Own
```typescript
// engine/src/core/components/mod.ts
export { Transform } from "./transform.ts";
export { RigidBody } from "./rigid-body.ts";
export { Camera } from "./camera.ts";
```

```typescript
// engine/src/core/systems/mod.ts
export { TransformSystem } from "./transform-system.ts";
export { PhysicsSystem } from "./physics-system.ts";
export { RenderSystem } from "./render-system.ts";
```



## How Games Import

```typescript
import { World, Components, Systems } from "@engine";
```

## What This Gives Us
1. Engine internals evolve endlessly
You can reorganize folders today and rewrite physics tomorrow.

2. Games never break as long as mod.ts stays consistent
You can add new features without exposing internals.

3. AI coding becomes safe
AI only sees the public API — much lower risk of crossing boundaries.

4. Game code and examples help AI understand correct usage patterns
Because everything imports from one clear endpoint.

5. Your monorepo stays clean and scalable
You avoid the pain of submodules, subtree splits, version pinning, or branch drift.