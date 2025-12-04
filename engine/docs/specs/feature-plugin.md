# Plugins
In an Entity–Component–System (ECS) framework, a plugin is a modular bundle of systems, components, and resources that can be added to extend or configure the ECS’s behavior.

A plugin is a packaged set of ECS functionality that can be plugged into the world to add features or modify how the ECS runs.

If a plugin is useful across many games, it is promoted to sit inside the engine.

## Core Plugins
- transform
- renderable-mesh
- camera

## Other Plugins
- rapier-physics
- ui-integration
- tweakpane-debug
- scene-manager
- asset-manager
- particle-system

## Game Plugins (game-specific)
- enemy-ai
- quest-system
- inventory
- etc.

These would be placed inside your game folder, not the engine.