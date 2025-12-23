# Ship Plugin

## Purpose
The Ship Plugin encapsulates all functionality for the player-controlled ship in the Asteroids game, including movement, input handling, rendering, and collision response.

## Components

- **ShipComponent** - Core ship state (lives, acceleration, velocity limits, rotation, thrust, invincibility)
- **Velocity** - Linear momentum for entities
- **BoundingBox** - Axis-aligned bounding box for collision detection and debug visualization
- **ShipGeometry** - Stores 2D point data for rendering ship as line strips

## Systems

- **PlayerInputSystem** - Captures keyboard input and updates ship state
  - Arrow keys/WASD for rotation and thrust
  - Spacebar for firing missiles
  - Q key for teleporting to random position

- **ShipMovementSystem** - Physics simulation
  - Velocity-based movement with acceleration
  - Max velocity clamping
  - Screen wrapping (toroidal space)

- **ShipThrustVisualSystem** - Visual feedback
  - Switches ship geometry between normal and engine-on states

- **MissileSpawningSystem** - Projectile management
  - Listens for missile spawn requests from input system
  - Enforces max missiles per ship limit (10)

- **CollisionHandlingSystem** - Damage and respawn
  - Handles ship-asteroid collisions
  - Manages lives and respawning
  - Emits game over event when lives are depleted

- **ShipRenderSystem** - WebGL rendering
  - Renders ship geometry as line strips
  - Renders bounding box for debug visualization

## Installation

```typescript
import { installShipPlugin, spawnPlayerShip } from "./features/ship-plugin/mod.ts";

// In your scene init:
const shipPluginContext = installShipPlugin(world);

// After spawning the ship:
const shipId = spawnPlayerShip(world);
shipPluginContext.setShipEntityId(shipId);
```

## Configuration

The plugin uses hardcoded defaults that can be customized by modifying component constructors:

```typescript
const ship = new ShipComponent(
  3,      // lives
  80,     // acceleration
  120,    // maxVelocity
  4.71    // rotationSpeed (radians/sec)
);
```

## Usage Example

```typescript
const world = new World();
installTransformPlugin(world);
installRenderPlugin(world);

// Install the ship plugin
const shipContext = installShipPlugin(world);

// Spawn the ship and connect the plugin
const shipId = spawnPlayerShip(world);
shipContext.setShipEntityId(shipId);

// Run the game loop
world.updateSystems(deltaTime);
```

## Dependencies

- **@engine/core** - World, GUID
- **@engine/features/transform-plugin** - Transform component
- **@engine/features/render-plugin** - BasicMaterial, Visible components and rendering context
- **@engine/components** - Name component

## Events Emitted

- `missile_spawn_requested` - When player presses spacebar
  - Data: `{ position, direction, shipEntityId }`
- `missile_spawned` - When missile is actually created by MissileSpawningSystem
  - Data: `{ position, direction, shipEntityId, spawnedAt }`
- `ship_respawned` - When ship respawns after collision
  - Data: `{ lives, position }`
- `game_over` - When ship is destroyed (no lives remaining)
  - Data: `{ reason, finalLives }`

## Events Consumed

- `ship_asteroid_collision` - Handled by CollisionHandlingSystem
- `missile_spawn_requested` - Consumed by MissileSpawningSystem

## Known Limitations

- Ship rendering uses simple line strips; no filled shapes or sprites
- Collision detection is not yet implemented (CollisionHandlingSystem listens for events)
- Missile spawning emits events but doesn't create visible missiles
- Screen wrapping bounds are calculated from camera FOV at init time
- Bounding box rendering is debug-only and should be gated behind a debug flag

## Future Improvements

- [ ] Implement actual collision detection against asteroids
- [ ] Add particle effects for thrust and collisions
- [ ] Implement missile entity and rendering
- [ ] Add sound effects for thrust and shooting
- [ ] Add ship damage/destruction animation
- [ ] Support configurable difficulty levels via plugin config
- [ ] Add invincibility frame visual feedback
