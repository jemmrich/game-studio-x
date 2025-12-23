# Player Ship

Feature Name: Player Ship
Filename: `2025-12-23-player-ship.md`
Date: December 23, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Implement the player-controlled ship as an ECS entity that serves as the primary interactive element for Asteroids gameplay.

### Goal / Expected Outcome:
Players can rotate, accelerate, decelerate, and fire projectiles. The ship wraps at screen edges and can be destroyed by asteroid collisions.

### Background / Context:
The engine provides Transform, Mesh, and Collider components via plugins. The player ship composes these with Velocity, AngularVelocity, and ShipComponent for a complete entity.

## Feature Description

### Summary:
The player ship is a controllable entity that responds to input for rotation and thrust. Compose Transform, Velocity, ShipComponent, and Collider to build a complete ship that can navigate, accelerate, and interact with the game world.

### Key Requirements:
- Player controls ship rotation via left/right input
- Player controls acceleration via up input
- Ship maintains momentum and drifts naturally
- Maximum velocity cap to prevent runaway speed
- Ship wraps at screen edges (toroidal space)
- Trigger missile spawning from ship center when space bar pressed
- Ship takes damage/destruction on asteroid collision
- Visual representation as a triangle pointing in direction of travel
- When lives are exhausted, emit game over event to transition to game over scene

### Non-Goals:
- Shield mechanics
- Multi-stage damage system
- Ship customization
- Advanced particle effects

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed
- [x] Dependencies identified (Transform, Render, Collision systems, Input system)

### Phase 2 — Design
- [x] Component data structures defined
- [x] System behavior documented
- [x] Control scheme finalized
- [x] Architecture reviewed with team

### Phase 3 — Implementation
- [x] ShipComponent created
- [x] Player input system created
- [x] Ship movement and rotation system implemented
- [x] Screen wrapping logic implemented
- [x] Missile spawning trigger implemented
- [x] Collision handling for ship destruction
- [x] Game over event emission when lives reach 0

### Phase 4 — Integration & Testing
- [ ] Unit tests for component logic
- [ ] Integration tests with other systems
- [ ] Manual testing of controls
- [ ] Performance benchmarking

### Phase 5 — Polish & Iteration
- [ ] Visual refinement
- [ ] Control tuning based on feedback
- [ ] Documentation completed

## Technical Specifications

### Dependencies
The player ship feature depends on the following engine systems and components:

1. **Transform Plugin** (`installTransformPlugin`)
   - Provides `Transform` component for position, rotation, and scale
   - Lightweight component-only plugin, no systems required
   - Location: `engine/src/features/transform-plugin`

2. **Render Plugin** 
   - Provides `BoxGeometry`, `Material`, `BasicMaterial`, and `Visible` components for mesh rendering
   - Includes render systems: `MeshRenderSystem`, `CameraUpdateSystem`, `GeometryBufferSystem`
   - Location: `engine/src/features/render-plugin`

3. **Input System**
   - `DemoInputSystem` available in engine as reference implementation
   - Provides keyboard event listeners (`keydown`, `keyup`)
   - Will be extended or custom-built for player ship controls (rotation, thrust, firing)
   - Location: `engine/src/systems/demo-input-system.ts`

4. **Collision System** (TO BE BUILT)
   - Will provide `Collider` component and collision detection
   - Needed for ship-asteroid collision handling
   - Planned for future development phase

### Components

#### ShipComponent
```typescript
interface ShipComponent {
  lives: number;            // Number of remaining lives (starts at 3)
  acceleration: number;     // Thrust magnitude
  maxVelocity: number;      // Speed cap
  angularVelocity: number;  // Rotation speed
  rotationDirection: 0 | 1 | -1;  // -1 = left, 0 = none, 1 = right
  isThrusting: boolean;     // Currently accelerating
  isInvincible: boolean;    // Immune to collisions after respawn
}
```

### Systems

#### PlayerInputSystem
Captures keyboard input and updates ship rotation/thrust state, and triggers missile spawning:
- W/Up Arrow: Set isThrusting = true, clear invincibility
- A/Left Arrow: Set rotationDirection = -1, clear invincibility
- D/Right Arrow: Set rotationDirection = 1, clear invincibility
- Space: Emit "missile_spawn_requested" event with ship position and direction, clear invincibility

#### ShipMovementSystem
Applies physics to ship motion:
- Update velocity based on current thrust and rotation
- Clamp velocity to maxVelocity
- Update transform position
- Apply screen wrapping

#### MissileSpawningSystem
Listens for missile spawn requests and creates missiles (see [Missile](./2025-12-23-missile-component.md) design doc):
- Detect "missile_spawn_requested" event from PlayerInputSystem
- Extract ship position, direction, and ship entity ID from event
- Call `spawnMissile(world, position, direction, spawnerId)` helper function
- Handle spawn failure (returns null) if player has reached 10-missile limit
- Missile lifetime and speed use static defaults defined in missile module

#### CollisionHandlingSystem
Handles ship collisions with asteroids:
- Detect ship-asteroid collision via collider intersection
- Decrement ship lives by 1
- If lives > 0: Respawn ship at center with isInvincible = true
- If lives = 0: Emit "game_over" event and destroy ship entity

## Design Decisions

### Momentum-Based Movement
Rather than instant response, momentum is retained to create floaty, arcade-style gameplay that's more enjoyable and requires skill.

### Screen Wrapping
Toroidal space (wrap around edges) keeps the action contained and maintains the classic Asteroids feel.

### Input Buffering
Consider buffering inputs to prevent frame-rate dependent input handling.

### Post-Respawn Invincibility
Player is invincible immediately after respawning and remains invincible until the first keyboard input is detected. This gives the player a moment to regain bearings without immediate threat, but starts the invincibility timer as soon as they begin playing.

## References

- [Missile](./2025-12-23-missile-component.md)
- [Asteroid Object](./2025-12-23-asteroid-component.md)
- [Engine API](../../engine/docs/specs/engine-api.md)
