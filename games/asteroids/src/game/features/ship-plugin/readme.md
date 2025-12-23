# Ship Plugin

## Purpose
The Ship Plugin encapsulates all functionality for the player-controlled ship in the Asteroids game, including movement, input handling, rendering, and collision response.

## Components

- **ShipComponent** - Core ship state (lives, acceleration, velocity limits, rotation, thrust, invincibility, boundingBoxEnabled)
- **Velocity** - Linear momentum for entities
- **BoundingBox** - Axis-aligned bounding box for collision detection and debug visualization
- **ShipGeometry** - Stores 2D point data for Three.js rendering as line strips

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

- **ShipRenderSystem** - Three.js-based rendering
  - Renders ship geometry as line strips
  - Renders bounding box for debug visualization when `boundingBoxEnabled` is true

## Installation

```typescript
import { installShipPlugin, spawnPlayerShip, ShipRenderSystem } from "./features/ship-plugin/mod.ts";
import * as THREE from "three";

// In your scene init:
const shipPluginContext = installShipPlugin(world);

// Spawn the player ship:
const shipId = spawnPlayerShip(world);
shipPluginContext.setShipEntityId(shipId);

// Set up Three.js rendering (done separately from the core plugin):
const threeJsScene = new THREE.Scene();
const ShipRenderSystem = new ShipRenderSystem(threeJsScene);
world.addSystem(ShipRenderSystem);
```

## Configuration

The plugin uses hardcoded defaults that can be customized by modifying component constructors:

```typescript
const ship = new ShipComponent({
  lives: 3, // lives
  acceleration: 80, // acceleration
  maxVelocity: 120, // maxVelocity
  rotationSpeed: 4.71,  // rotationSpeed (radians/sec)
  boundingBoxEnabled: true // boundingBoxEnabled
});
```

## Usage Example

```typescript
import * as THREE from "three";
import { installShipPlugin, spawnPlayerShip, ShipRenderSystem } from "./features/ship-plugin/mod.ts";

const world = new World();
installTransformPlugin(world);
installRenderPlugin(world);

// Install the ship plugin
const shipContext = installShipPlugin(world);

// Spawn the ship and connect the plugin
const shipId = spawnPlayerShip(world);
shipContext.setShipEntityId(shipId);

// Set up Three.js rendering system
const threeJsScene = new THREE.Scene();
const ShipRenderSystem = new ShipRenderSystem(threeJsScene);
world.addSystem(ShipRenderSystem);

// Run the game loop
world.updateSystems(deltaTime);
```

## Dependencies

- **@engine/core** - World, GUID
- **@engine/features/transform-plugin** - Transform component
- **three** - Three.js library for rendering
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
- Collision detection is not yet fully implemented (CollisionHandlingSystem listens for events)
- Missile spawning system is separate from ship plugin and must be installed independently
- Screen wrapping bounds aregated behind the `boundingBoxEnabled` property on ShipComponent
- Bounding box rendering is debug-only and should be gated behind a debug flag
- Three.js rendering must be set up separately in your scene (not included in installShipPlugin)

## Future Improvements

- [ ] Implement actual collision detection against asteroids
- [ ] Add particle effects for thrust and collisions
- [ ] Implement missile entity and rendering
- [ ] Add sound effects for thrust and shooting
- [ ] Add ship damage/destruction animation
- [ ] Support configurable difficulty levels via plugin config
- [ ] Add invincibility frame visual feedback
