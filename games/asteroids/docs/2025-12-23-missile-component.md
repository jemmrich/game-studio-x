# Missile Component

Feature Name: Missile Component
Filename: `2025-12-23-missile-component.md`
Date: December 23, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Implement a reusable missile/projectile component that can be spawned by any entity (player ship, aliens, etc.) for combat interactions.

### Goal / Expected Outcome:
Missiles travel in a direction with velocity, have a lifetime, and can collide with asteroids and other entities. They are completely decoupled from their spawn source.

### Background / Context:
The engine provides Transform, Mesh, and Collider components via plugins. Missiles compose these with Velocity and MissileComponent to form a complete projectile entity.

## Feature Description

### Summary:
A missile is a lightweight projectile entity that travels in a direction and can be spawned by any actor in the game world. It has a limited lifetime and is automatically destroyed when that lifetime expires or on collision.

### Key Requirements:
- Spawn at any position with initial velocity
- Travel in a straight line with constant velocity
- Auto-destroy after defined lifetime
- Player missiles destroy asteroids and aliens on collision
- Alien missiles destroy asteroids and the player on collision
- Player missiles cannot damage the player
- Can be spawned by player ship and alien ships
- Maximum 10 missiles per spawner (player ship or alien ship) at any given time
- Wrap at screen edges (toroidal space)
- Visual representation as a single point rendered with BufferGeometry
- No owner tracking needed (fires and forgets)

### Non-Goals:
- Homing missiles
- Missile trails or particles
- Missile armor or durability
- Area-of-effect damage

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed
- [x] Dependencies identified (Transform, Velocity, Lifetime, Collision)

### Phase 2 — Design
- [x] Component data structures defined
- [x] System behavior documented
- [x] Spawn interface defined
- [x] Architecture reviewed with team

### Phase 3 — Implementation
- [x] MissileComponent created
- [x] Missile lifetime system implemented
- [x] Missile collision handling implemented
- [x] Missile spawning utility created

### Phase 4 — Integration & Testing
- [ ] Unit tests for component logic
- [ ] Integration tests with collision system
- [ ] Tests for lifetime expiration
- [ ] Performance testing with many missiles

### Phase 5 — Polish & Iteration
- [ ] Tuning of speed and lifetime values
- [ ] Visual refinement
- [ ] Documentation completed

## Technical Specifications

### Components

#### MissileComponent
```typescript
interface MissileComponent {
  lifetime: number;      // Time in seconds before auto-destroy
  speed: number;         // Missile velocity magnitude
  spawnerId: EntityId;   // Reference to the entity that spawned this missile
}
```

The missile uses the standard `Velocity` component from the Transform plugin to manage its movement direction.

#### MissileManager (Resource)
```typescript
interface MissileManager {
  activeMissiles: Map<EntityId, EntityId[]>;  // spawnerId → [missileEntityIds]
}
```

A world resource that tracks active missiles per spawner. Used to enforce the 10-missile-per-spawner limit and clean up missile references when they are destroyed.

### Systems

#### MissileLifetimeSystem
Manages missile lifetime and cleanup:
- Decrement lifetime on each frame
- Remove entity when lifetime <= 0
- Update MissileTracker to remove missile from its spawner's list
- Emit event on missile destruction (for future effects/sounds)

#### MissileCollisionSystem
Handles missile interactions with other objects based on spawner type:

**Player-Spawned Missiles:**
- Collide with asteroids and trigger destruction
- Collide with alien ships and trigger destruction
- Do not collide with the player ship
- Destroy missile and target on impact
- Award points for destroyed asteroids and aliens

**Alien-Spawned Missiles:**
- Collide with asteroids and trigger destruction
- Collide with the player ship and trigger damage/destruction
- Do not collide with other alien ships
- Destroy missile and target on impact

## Design Decisions

### Point Rendering with BufferGeometry
Missiles are rendered as a single point using BufferGeometry for simplicity and performance. This avoids overhead of complex mesh geometry and is sufficient for small projectile visibility.

### Screen Wrapping
Missiles wrap at screen edges to maintain consistency with the ship and asteroids, creating a toroidal play space. This prevents missiles from disappearing off-screen and allows players to use screen edges strategically.

### Missile Count Limiting
Each spawner (player ship or alien ship) is limited to 10 active missiles at a time. This prevents excessive missile spam, manages performance, and creates strategic gameplay decisions about when to fire. Once the limit is reached, new fire commands are ignored until older missiles are destroyed.

### MissileManager Resource
A centralized resource maintains a mapping of spawner ID → active missile list. This allows the system to efficiently check missile counts before spawning and clean up references when missiles expire. The spawnerId field in MissileComponent links missiles back to their origin.

### Reusable Missiles
Missiles don't track damage ownership or relationships—they simply deal damage to asteroids on collision regardless of source. This keeps them simple and reusable for any entity type.

### Lifetime-Based Destruction
Missiles are automatically cleaned up after a set time, preventing projectile spam and managing memory.

### Velocity Component Reuse
Rather than create a custom movement system, missiles use the existing Velocity component from the engine for consistency.

## Spawn Interface

### Spawning a Missile
```typescript
// Helper function to spawn a missile with limit checking
function spawnMissile(
  world: World,
  position: Vec3,
  direction: Vec3,
  spawnerId: EntityId,
  speed: number = 100,
  lifetime: number = 3.0,
  maxMissiles: number = 10
): EntityId | null {
  // Check missile limit
  const tracker = world.getResource(MissileManager);
  const spawnerMissiles = tracker.activeMissiles.get(spawnerId) || [];
  
  if (spawnerMissiles.length >= maxMissiles) {
    return null;  // Limit reached, cannot spawn
  }
  
  const entity = world.createEntity();
  
  // Add standard components
  entity.addComponent(Transform, { position, rotation: directionToRotation(direction) });
  entity.addComponent(Mesh, { geometry: createPointGeometry(), material: 'white' });
  entity.addComponent(Collider, { shape: 'circle', radius: 2 });
  
  // Add velocity
  entity.addComponent(Velocity, { 
    linearVelocity: vec3.scale(direction, speed) 
  });
  
  // Add missile component with spawner tracking
  entity.addComponent(MissileComponent, { lifetime, speed, spawnerId });
  
  // Register missile in tracker
  if (!tracker.activeMissiles.has(spawnerId)) {
    tracker.activeMissiles.set(spawnerId, []);
  }
  tracker.activeMissiles.get(spawnerId)!.push(entity.id);
  
  return entity.id;
}
```

## Rendering Implementation

### Point Geometry Creation
```typescript
// Create a single-point BufferGeometry for the missile
function createPointGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions = new Float32Array([0, 0, 0]); // Single point at origin
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}
```

### Material
Missiles use a simple PointsMaterial with a small size to be visible but not distracting.

## Missile Speed

Missiles travel at a static speed regardless of spawner type (player or alien). This provides consistent, predictable missile behavior and simplifies gameplay tuning.

## References

- [Player Ship](./2025-12-23-player-ship.md)
- [Asteroid Object](./2025-12-23-asteroid-component.md)
- [Engine API](../../engine/docs/specs/engine-api.md)
