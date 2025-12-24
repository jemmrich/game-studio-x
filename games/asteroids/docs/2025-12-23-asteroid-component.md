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
- [ ] Unit tests for components
- [ ] Integration tests for movement and collision
- [ ] Screen wrap edge cases
- [ ] Performance tests (50+ asteroids)

### Phase 5 — Documentation & Release
- [ ] Component API documentation
- [ ] System behavior documentation
- [ ] Usage examples
- [ ] Update game README

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
