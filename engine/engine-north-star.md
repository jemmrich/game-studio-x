# Our North Star - The Game Studio X Engine

## Purpose
Define the guiding principles, constraints, and boundaries for the engine to ensure alignment, clarity, and focus throughout development. This document helps prevent scope creep, maintain architectural integrity, and keep the engine tightly scoped to the needs of the current game.


## Most Important Principles
### Adhere Strictly to ECS Core Principles

1. The engine must follow Entity–Component–System architecture without compromise.
2. Entities are identifiers only, components are pure data, and systems contain all logic.
3. Data-oriented thinking takes priority over object-oriented patterns.

### Build Only What the Game Needs—Nothing More

1. The engine exists to power the current game in development.
2. New features must be justified by real game requirements, not hypothetical future use.

### Plugins Over Core Whenever Possible

1. Anything not essential to the core ECS engine belongs in a game-level feature plugin.
2. If a plugin proves reusable across multiple projects, it may be promoted to a core engine plugin.
3. Keep the core minimal, focused, and stable.

## Technical Constraints (Non-Negotiable)

### Runtime & Language
- JavaScript Runtime: Deno
- Language: TypeScript

### Tooling
- Build Tool: Vite
- Unit Testing: Vitest
- Debugging Layer: Tweakpane (for lightweight runtime tweaking)

### UI & Rendering
- UI Framework: React
- Rendering Engine: Three.js

### Physics
- Physics Engine: Rapier
- No additional physics backends allowed.

### Target Platform
- Browser-based only
- No native builds or alternative runtimes (e.g., Node, mobile, desktop) unless explicitly added to the North Star later.


## Explicitly Not Building
The following are intentionally out of scope. If a feature falls into these categories, it should not be added to the engine.

### Avoid Rebuilding Existing Functionality
- Do not duplicate functionality already provided by:
	- Three.js
	- Rapier
	- React
	- Deno APIs
- Wrap and integrate, don’t rewrite.

### No Multiple Backends
- Only one physics engine (Rapier).
- Only one renderer (Three.js).
- No abstraction over multiple backends.

### No Heavy Editor or Tooling
- No advanced in-engine editor.
- No scene graph GUI, animation editors, material editors, etc.
- Keep the debug UI minimal—Tweakpane only for essential runtime values.

### No Full Commercial Engine Ambition
- No attempt at matching Unity, Unreal, Godot, or others in:
	- Tools
	- Workflow
	- Feature breadth

### No Excessive Documentation Requirements
- Documentation should be:
	- Short
	- Practical
	- Example-driven
- No requirement for exhaustive API docs unless needed.


## What Success Looks Like

### The engine should:
- Feel lightweight, composable, and easy to reason about.
- Enable rapid iteration for the current game.
- Be stable and predictable due to strict ECS and clear constraints.
- Grow organically through real usage, not speculation.
- Stay small—small enough to understand in a single sitting.

### The team should:
- Be able to build new game features by composing ECS systems rather than modifying engine internals.
- Rarely need to touch core engine code except for foundational improvements.
- Spend most of the time building game content—not engine infrastructure.

### Summary Statement (North Star)
Build a minimal, principled ECS engine in TypeScript that powers the current browser-based game, using Deno, Three.js, Rapier, and React—no more, no less. Everything non-core is a plugin. Everything added must serve the game. Simplicity wins.
