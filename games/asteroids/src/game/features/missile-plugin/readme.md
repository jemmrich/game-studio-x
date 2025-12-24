# Missile Plugin

A reusable missile/projectile plugin for the Game Studio X engine.

## Overview

The Missile Plugin provides a lightweight, decoupled system for spawning and managing projectiles in games. Missiles are completely independent of their spawn source and can be created by any entity (player ship, alien ships, etc.).

## Features

- **Automatic Lifetime Management**: Missiles are destroyed after a configurable lifetime
- **Spawn Limiting**: Maximum missiles per spawner (default: 10) to prevent spam and manage performance
- **Screen Wrapping**: Missiles wrap at screen edges for toroidal space
- **Collision-Ready**: Base system for implementing collision damage
- **Decoupled Projectiles**: No owner tracking needed—fire and forget

## Components

### MissileComponent

Data component for individual missiles:

```typescript
class MissileComponent {
  lifetime: number;      // Time in seconds before auto-destroy
  speed: number;         // Velocity magnitude (units/second)
  spawnerId: EntityId;   // Entity that spawned this missile
}
```

## Resources

### MissileManager

World resource that tracks active missiles per spawner:

```typescript
class MissileManager {
  activeMissiles: Map<EntityId, EntityId[]>;
  
  canSpawnMissile(spawnerId: EntityId, maxMissiles?: number): boolean;
  getMissileCount(spawnerId: EntityId): number;
  addMissile(spawnerId: EntityId, missileId: EntityId): void;
  removeMissile(spawnerId: EntityId, missileId: EntityId): void;
}
```

## Systems

### MissileLifetimeSystem

Manages missile lifetime and automatic cleanup:

- Decrements lifetime each frame
- Removes missiles when lifetime reaches 0
- Updates MissileManager on removal
- Can emit events for destruction effects

### MissileCollisionSystem

Base collision system (designed for extension):

- Provides collision hooks for game-specific implementations
- Manages missile removal after collision
- Cleans up orphaned missiles if spawner is destroyed

**Note**: Game-specific implementations should extend this system to define damage behaviors.

## Utilities

### spawnMissile()

Utility function for spawning missiles with limit checking:

```typescript
function spawnMissile(
  world: World,
  position: [number, number, number],
  direction: [number, number, number],
  spawnerId: EntityId,
  speed?: number,              // default: 100
  lifetime?: number,           // default: 3.0
  maxMissiles?: number         // default: 10
): EntityId | null
```

Returns the missile's entity ID, or `null` if the spawn limit is reached.

## Installation

```typescript
import { installMissilePlugin } from "./features/missile-plugin/mod.ts";

const world = new World();
installTransformPlugin(world);
installRenderPlugin(world, { canvas: ... });
installMissilePlugin(world);
```

## Example Usage

```typescript
import { spawnMissile } from "./features/missile-plugin/utils/spawn-missile.ts";

// Spawn a missile from the player ship
const missileId = spawnMissile(
  world,
  [0, 0, 0],           // position
  [1, 0, 0],           // direction (should be normalized)
  playerId,            // who spawned it
  100,                 // speed units/second
  3.0,                 // lifetime in seconds
  10                   // max missiles
);

if (missileId === null) {
  console.log("Missile limit reached for player");
}
```

## Dependencies

- **Transform Plugin**: Provides Transform component for positioning
- **Render Plugin**: Provides Mesh and Collider components for rendering and collision detection

## Design Decisions

### Decoupled Missiles

Missiles store only the spawner ID, not a direct reference. This keeps missiles simple and allows spawn sources to be destroyed without cascading issues.

### Spawn Limiting

Per-spawner missile limits prevent excessive projectile spam and manage performance. Limits are checked gracefully—over-limit spawn attempts return `null` without error.

### Lifetime-Based Cleanup

Instead of manual cleanup, missiles are automatically destroyed after a configurable lifetime. This prevents memory leaks and manages projectile persistence.

### Extensible Collision System

The base `MissileCollisionSystem` is designed to be extended by game-specific implementations that define damage interactions and scoring.

## Future Enhancements

- Missile trails and particle effects
- Missile events for sound and visual effects
- Homing missile support
- Area-of-effect damage
- Missile armor/durability
