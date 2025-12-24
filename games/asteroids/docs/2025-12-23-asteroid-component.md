# Asteroid Component

Feature Name: Asteroid Component
Filename: `2025-12-23-asteroid-component.md`
Date: December 23, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Implement asteroids as destructible ECS entities that form the core gameplay loop for the Asteroids game.

### Goal / Expected Outcome:
Asteroids spawn, move, rotate, and break into smaller pieces when hit by projectiles. Players gain points by destroying them.

### Background / Context:
The engine provides Transform, Mesh, and Collider components via plugins. Asteroids compose these with Velocity, AngularVelocity, and AsteroidComponent for a complete entity.

## Feature Description

### Summary:
Asteroids are destructible entities that rotate, move through space, and break into smaller pieces when hit. Compose Transform, Velocity, and AsteroidComponent to build a complete asteroid.

### Key Requirements:
- Asteroids spawn at random positions
- Rotate continuously at varying speeds
- When destroyed, spawn two smaller asteroids (size 3 → 2×2, size 2 → 2×1)
- Size 1 asteroids despawn when destroyed
- Wrap at screen edges (toroidal space)
- Three size tiers with distinct velocities

### Non-Goals:
- Procedural mesh generation
- Asteroid-to-asteroid collisions
- Complex fracture physics

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed
- [x] Dependencies identified (Transform, Render, Collision systems)

### Phase 2 — Design
- [x] Component data structures defined
- [x] System behavior documented
- [x] Spawning strategy defined
- [x] Architecture reviewed with team

### Phase 3 — Implementation
- [x] Create AsteroidComponent
- [x] Implement AsteroidMovementSystem
- [x] Implement AsteroidCollisionSystem
- [x] Implement AsteroidDestructionSystem
- [x] Create spawner factory

### Phase 4 — Testing
- [x] Unit tests for components
- [x] Integration tests for movement and collision
- [x] Screen wrap edge cases
- [x] Performance tests (50+ asteroids)

### Phase 5 — Documentation & Release
- [x] Component API documentation
- [x] System behavior documentation
- [x] Usage examples
- [x] Update game README

## Technical Details

### Components

```typescript
// Asteroid-specific data
type AsteroidComponent = {
  sizeTier: 1 | 2 | 3,  // Large=3, Medium=2, Small=1
  rotationSpeed: number
}

// Movement (shared with other entities)
type Velocity = { x: number, y: number, z: number }
type AngularVelocity = { x: number, y: number, z: number }

// From engine plugins
// - Transform (position, rotation, scale)
// - Mesh (visual representation)
// - Collider (collision boundaries)
```

### Systems

- **AsteroidMovementSystem**: Apply velocity and rotation
- **AsteroidCollisionSystem**: Handle projectile hits, destroy asteroid and spawn 2 smaller ones (or despawn if size 1)
- **ScreenWrapSystem** (or similar): Wrap asteroids at screen edges

### Size Tiers

| Tier | Name   | Velocity | Breaks Into |
|------|--------|----------|-------------|
| 3    | Large  | 2-3 u/s  | Medium      |
| 2    | Medium | 3-4 u/s  | Small       |
| 1    | Small  | 4-5 u/s  | Despawns    |

### Spawning

```typescript
// Factory function
function createAsteroid(
  world: World,
  position: { x: number, y: number },
  sizeTier: 1 | 2 | 3
): Entity {
  const velocity = getVelocityForSize(sizeTier);
  const mesh = getMeshForSize(sizeTier);
  
  return world.spawn([
    { kind: 'Transform', position, rotation: Math.random() * Math.PI * 2, scale: 1 },
    { kind: 'Velocity', ...velocity },
    { kind: 'AngularVelocity', x: 0, y: 0, z: Math.random() * 2 - 1 },
    { kind: 'AsteroidComponent', sizeTier, rotationSpeed: 1 },
    { kind: 'Mesh', mesh },
    { kind: 'Collider', type: 'sphere', radius: getSizeRadius(sizeTier) }
  ]);
}

// On collision with projectile:
// - Size 3 asteroid: destroy entity, spawn 2 size 2 asteroids nearby
// - Size 2 asteroid: destroy entity, spawn 2 size 1 asteroids nearby
// - Size 1 asteroid: destroy entity, no spawn

// Initial spawn: 5-7 large asteroids at level start
// Safe zones: Don't spawn within distance X of player
```

## Risks & Concerns

- **Performance**: Profile with 50+ asteroids to ensure smooth frame rate
- **Collision accuracy**: Ensure collision detection is precise with moving objects

Mitigation:
- Use bounding sphere checks before precise collision tests
- Implement spatial partitioning if performance degrades
- Screen wrap waits for asteroid to be completely off-screen before appearing on opposite side (simplifies edge cases)

---

## Component API Documentation

### AsteroidComponent

```typescript
interface AsteroidComponentOptions {
  sizeTier?: AsteroidSizeTier;      // 1 | 2 | 3 (default: 3)
  rotationSpeed?: number;            // Default: 1
  boundingSphereEnabled?: boolean;   // Default: false
}

class AsteroidComponent {
  sizeTier: AsteroidSizeTier;
  rotationSpeed: number;
  boundingSphereEnabled: boolean;
  
  constructor(options?: AsteroidComponentOptions);
  
  /**
   * Get velocity range for asteroid size tier
   * Tier 3 (Large):  20-30 u/s
   * Tier 2 (Medium): 25-35 u/s
   * Tier 1 (Small):  30-40 u/s
   */
  static getVelocityRange(sizeTier: AsteroidSizeTier): { min: number; max: number };
}
```

### Velocity Component

Shared component representing linear velocity in 3D space:

```typescript
interface Velocity {
  x: number;  // Velocity in X axis (pixels/frame)
  y: number;  // Velocity in Y axis (pixels/frame)
  z: number;  // Velocity in Z axis (typically 0 for asteroids)
}
```

### AngularVelocity Component

Represents rotational velocity around axes:

```typescript
interface AngularVelocity {
  x: number;  // Rotation around X axis (typically 0)
  y: number;  // Rotation around Y axis (typically 0)
  z: number;  // Rotation around Z axis (typically -1 to 1)
}
```

---

## System Behavior Documentation

### AsteroidMovementSystem

**Purpose**: Apply velocity and angular velocity to asteroids each frame.

**Behavior**:
- Reads Velocity and AngularVelocity components
- Updates Transform position based on velocity
- Updates Transform rotation based on angular velocity
- Executes once per frame

**Components Required**: Transform, Velocity, AngularVelocity, AsteroidComponent

### AsteroidCollisionSystem

**Purpose**: Handle collision detection between projectiles and asteroids.

**Behavior**:
- Detects collisions between missiles and asteroids using sphere-based collision
- Marks hit asteroids for destruction
- Records collision data for point scoring
- Does not immediately destroy asteroids (handled by AsteroidDestructionSystem)

**Components Required**: Transform, Collider, AsteroidComponent (asteroids); Projectile component (missiles)

### AsteroidDestructionSystem

**Purpose**: Process asteroid destruction and spawn smaller asteroids.

**Behavior**:
- Processes marked-for-destruction asteroids
- Size 3 → spawns 2 Size 2 asteroids
- Size 2 → spawns 2 Size 1 asteroids
- Size 1 → despawns (no spawn)
- Removes destroyed asteroid from world
- Awards points based on asteroid size

**Spawn Offsets**: New asteroids spawn in a circle around the destroyed asteroid's position, evenly spaced.

**Execution Order**: Must run after AsteroidCollisionSystem (receives collision data)

### AsteroidSpawningSystem

**Purpose**: Initial wave spawning and level management.

**Behavior**:
- Spawns initial asteroids at level start
- Respawns asteroids when wave is cleared
- Respects safe zones around player
- Spreads spawns over multiple frames to avoid stutter

**Initial Configuration**: 5-7 large asteroids (size 3) at random positions (avoiding safe zone)

### AsteroidScreenWrapSystem

**Purpose**: Wrap asteroids around screen edges in toroidal space.

**Behavior**:
- Monitors asteroid position against screen bounds
- Wraps X and Y coordinates when off-screen
- Waits for asteroid to be completely off-screen before wrapping (prevents jitter)
- Z position not affected

---

## Usage Examples

### Spawning a Single Asteroid

```typescript
import { spawnAsteroid } from "./features/asteroid-plugin/factories/spawn-asteroid.ts";

// Spawn a large asteroid at position (100, 200)
const asteroidId = spawnAsteroid(
  world,
  [100, 200, 0],
  3  // Size tier: 1 (small), 2 (medium), or 3 (large)
);
```

### Spawning Multiple Asteroids

```typescript
import { spawnAsteroid } from "./features/asteroid-plugin/factories/spawn-asteroid.ts";

// Spawn initial wave of asteroids
for (let i = 0; i < 7; i++) {
  const x = Math.random() * screenWidth;
  const y = Math.random() * screenHeight;
  
  // Avoid spawning near player (e.g., center of screen)
  if (Math.abs(x - screenWidth/2) < 100 && Math.abs(y - screenHeight/2) < 100) {
    i--;  // Try again
    continue;
  }
  
  spawnAsteroid(world, [x, y, 0], 3);
}
```

### Installing the Plugin

```typescript
import { installAsteroidPlugin } from "./features/asteroid-plugin/mod.ts";

// In your game scene setup:
const { destructionSystem, spawningSystem } = installAsteroidPlugin(world);

// Add destruction system after collision detection
world.addSystem(destructionSystem);

// Add spawning system at appropriate time in execution order
world.addSystem(spawningSystem);
```

### Querying for All Asteroids

```typescript
import { AsteroidComponent } from "./features/asteroid-plugin/mod.ts";

// Get count of all asteroids
const asteroidQuery = world.query(AsteroidComponent);
const asteroidCount = asteroidQuery.entities.length;

// Get only large asteroids
const largeAsteroids = asteroidQuery.entities
  .map(id => world.get(id, AsteroidComponent))
  .filter(comp => comp.sizeTier === 3);
```

### Destroying an Asteroid Manually

```typescript
import { AsteroidComponent } from "./features/asteroid-plugin/mod.ts";

// Mark asteroid for destruction by removing it
world.removeEntity(asteroidId);

// This triggers the destruction system to spawn smaller asteroids
```
