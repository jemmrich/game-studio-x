# Asteroid Plugin

## Purpose
The Asteroid Plugin encapsulates all functionality for destructible asteroid entities in the Asteroids game, including spawning, movement, collision detection, and destruction with cascading smaller asteroids.

## Components

- **AsteroidComponent** - Core asteroid state (sizeTier, rotationSpeed, boundingSphereEnabled)
- **Velocity** - Linear momentum for entities
- **AngularVelocity** - Rotational velocity around axes
- **AsteroidGeometry** - Stores 3D mesh data for Three.js rendering

## Systems

- **AsteroidMovementSystem** - Physics simulation
  - Applies velocity to asteroid position each frame
  - Applies angular velocity to asteroid rotation
  - Updates Transform based on velocity and rotation

- **AsteroidCollisionSystem** - Collision detection
  - Detects collisions between projectiles and asteroids
  - Uses sphere-based collision detection
  - Marks asteroids for destruction on hit

- **AsteroidDestructionSystem** - Destruction and spawning
  - Processes marked-for-destruction asteroids
  - Size 3 asteroids spawn 2 Size 2 asteroids
  - Size 2 asteroids spawn 2 Size 1 asteroids
  - Size 1 asteroids despawn without spawning
  - Awards points based on asteroid size

- **AsteroidSpawningSystem** - Wave management
  - Spawns initial asteroids at level start
  - Respawns asteroids when wave is cleared
  - Respects safe zones around player
  - Spreads spawns over multiple frames

- **AsteroidScreenWrapSystem** - Toroidal space
  - Wraps asteroids around screen edges
  - Waits for complete off-screen before wrapping
  - Prevents jitter at screen boundaries

- **AsteroidRenderSystem** - Three.js-based rendering
  - Renders asteroid geometry as meshes
  - Renders bounding sphere for debug visualization when `boundingSphereEnabled` is true

## Installation

```typescript
import { installAsteroidPlugin, spawnAsteroid } from "./features/asteroid-plugin/mod.ts";

// In your scene init:
const asteroidPluginContext = installAsteroidPlugin(world);

// Spawn an asteroid:
const asteroidId = spawnAsteroid(world, [100, 200, 0], 3); // Position and size tier
```

## Configuration

The plugin uses configuration defined in `config/asteroid-size-config.ts`:

```typescript
const ASTEROID_SIZE_CONFIG = {
  3: { // Large
    meshScale: 1.0,
    worldScale: 25,
    velocityRange: { min: 20, max: 30 }
  },
  2: { // Medium
    meshScale: 0.66,
    worldScale: 25,
    velocityRange: { min: 25, max: 35 }
  },
  1: { // Small
    meshScale: 0.33,
    worldScale: 25,
    velocityRange: { min: 30, max: 40 }
  }
};
```

## Usage Example

```typescript
import * as THREE from "three";
import { installAsteroidPlugin, spawnAsteroid, AsteroidRenderSystem } from "./features/asteroid-plugin/mod.ts";

const world = new World();
installTransformPlugin(world);
installRenderPlugin(world);

// Install the asteroid plugin
const asteroidContext = installAsteroidPlugin(world);

// Spawn initial wave of asteroids
for (let i = 0; i < 7; i++) {
  const x = Math.random() * screenWidth;
  const y = Math.random() * screenHeight;
  
  // Avoid spawning near player
  if (Math.abs(x - screenWidth/2) < 100 && Math.abs(y - screenHeight/2) < 100) {
    i--;
    continue;
  }
  
  spawnAsteroid(world, [x, y, 0], 3); // Size 3 = Large
}

// Set up Three.js rendering system
const threeJsScene = new THREE.Scene();
const asteroidRenderSystem = new AsteroidRenderSystem(threeJsScene);
world.addSystem(asteroidRenderSystem);

// Run the game loop
world.updateSystems(deltaTime);
```

## Dependencies

- **@engine/core** - World, GUID
- **@engine/features/transform-plugin** - Transform component
- **@engine/features/render-plugin** - BasicMaterial, Visible components
- **three** - Three.js library for rendering
- **@engine/components** - Name component

## Events Emitted

- `asteroid_destroyed` - When an asteroid is destroyed by collision
  - Data: `{ asteroidId, sizeTier, position, points }`
- `asteroid_spawned` - When new asteroids spawn from destruction
  - Data: `{ spawnedIds, sizeTier, parentPosition }`

## Events Consumed

- `missile_collision` - Listened to by AsteroidCollisionSystem
  - Data: `{ projectileId, asteroidId, position }`

## Size Tiers

| Tier | Name   | Velocity | Breaks Into | Points |
|------|--------|----------|-------------|--------|
| 3    | Large  | 20-30 u/s| Medium (2)  | 20     |
| 2    | Medium | 25-35 u/s| Small (1)   | 50     |
| 1    | Small  | 30-40 u/s| Despawns    | 100    |

## Known Limitations

- Collision detection uses sphere-based approximation; may not be pixel-perfect
- Bounding sphere rendering is debug-only and should be gated behind a debug flag
- Three.js rendering must be set up separately in your scene (not included in installAsteroidPlugin)
- Screen wrapping only occurs when asteroid is completely off-screen
- No procedural mesh generation; uses predefined geometries per size tier

## Performance Characteristics

- Optimized for 50+ simultaneous asteroids
- Uses spatial partitioning for collision detection
- Bounding sphere checks before precise collision tests
- Frame-time impact negligible at normal asteroid counts

## Future Improvements

- [ ] Implement procedural mesh generation for variety
- [ ] Add asteroid-to-asteroid collision response
- [ ] Add fracture particle effects on destruction
- [ ] Implement more sophisticated spatial partitioning
- [ ] Add configurable difficulty scaling
- [ ] Support custom asteroid behaviors via components
- [ ] Add asteroid damage states before destruction