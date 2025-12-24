# GSX Asteroids

The classic Asteroids game with a few additions.

## Game Features

### Asteroid Mechanics
- **Three Size Tiers**: Large (3), Medium (2), and Small (1) asteroids
- **Progressive Difficulty**: Larger asteroids spawn in smaller pieces when destroyed
  - Large → 2 Medium asteroids
  - Medium → 2 Small asteroids
  - Small → Destroyed (no spawn)
- **Toroidal Space**: Asteroids wrap around screen edges for continuous gameplay
- **Points System**: Earn points based on asteroid size destroyed
  - Large: 20 points
  - Medium: 50 points
  - Small: 100 points

### Player Ship
- **Rotation & Thrust**: Classic arcade movement
- **Shields**: Temporary invulnerability after spawning
- **Missiles**: Fire projectiles to destroy asteroids
- **Teleport**: Emergency escape (use sparingly - no invulnerability)

### Game Flow
- Initial wave: 5-7 large asteroids spawn at random positions (avoiding player)
- When all asteroids destroyed: Wave cleared, next wave spawns with more asteroids
- Lives system: Start with 3 lives, gain 1 extra at 10,000 points
- Game Over when lives reach 0

## Keyboard Controls

| Action | Keys |
|--------|------|
| Rotate Left | `←` / `A` |
| Rotate Right | `→` / `D` |
| Thrust / Move Forward | `↑` / `W` |
| Fire Missile | `Space` |
| Pause / Resume | `P` |
| Teleport / Reset Position | `Q` |

## Architecture

This game is built on the Game Studio X engine, utilizing:

- **ECS Architecture**: Components, Entities, Systems, and Resources
- **Plugins**: Modular feature system for extensibility
- **Transform Plugin**: Position, rotation, and scale management
- **Render Plugin**: Visual mesh rendering
- **Physics Plugin**: Collision detection and response

### Core Features

#### Asteroid Plugin (`src/game/features/asteroid-plugin/`)
Provides all asteroid-related functionality:
- Components: `AsteroidComponent`, `Velocity`, `AngularVelocity`
- Systems: Movement, collision, destruction, spawning, screen wrapping
- Factory: `spawnAsteroid()` function for creating asteroids
- Configuration: Size tiers, velocities, mesh geometry

#### Missile Plugin (`src/game/features/missile-plugin/`)
Handles projectile mechanics:
- Projectile spawning from ship position
- Velocity and lifetime management
- Collision detection with asteroids
- Automatic despawn on hit or timeout

#### Ship Plugin (`src/game/features/ship-plugin/`)
Manages player ship:
- Input handling for rotation and thrust
- Missile firing
- Collision detection with asteroids
- Teleport mechanism
- Shield (invulnerability) system

## Development

### Running Tests
Because we are using `@shared` and `@engine` we need to run vitest through node with its own vitest config. This is handled within the deno tasks. Available tasks can be seen below.

```bash
# Run all tests
deno task test

# Run tests in watch mode (auto-rerun on file changes)
deno task test:watch

# Run performance benchmarks
deno task test:performance
```

### Test Coverage

The asteroid system includes comprehensive tests:
- **Unit Tests**: Component behavior and utility functions
- **Integration Tests**: System interactions and collision handling
- **Performance Tests**: Stress testing with 50+ asteroids
- **Edge Cases**: Screen wrapping, rapid destruction, spawning

Run `deno task test:performance` to verify smooth gameplay with high asteroid counts.

### Documentation

Feature documentation is available in `docs/`:
- `2025-12-23-asteroid-component.md` - Asteroid system details, API, and usage examples
- `2025-12-23-missile-component.md` - Projectile system documentation
- `2025-12-23-player-ship.md` - Ship mechanics and controls
- `2025-12-23-wave-manager.md` - Level progression system
- `north-star.md` - High-level game vision and design principles

## Contributing

When adding new features:
1. Follow ECS composition patterns established in existing plugins
2. Add tests alongside implementation (aim for >80% coverage)
3. Document system behavior and component requirements
4. Update `docs/` directory with feature specifications
5. Ensure performance with stress tests before merging
