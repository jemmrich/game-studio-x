# Entering Zone Effect

Feature Name: Entering Zone Effect
Filename: `2025-12-26-entering-zone-effect.md`
Date: December 26, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Implement a visual transition effect when players complete a wave and enter the next zone, featuring a warp drive effect with zooming particles and an "Entering Zone X" UI message.

### Goal / Expected Outcome:
When a wave completes, the player sees:
1. A temporary "Entering Zone X" text overlay (rendered by React)
2. Particle/point effects that zoom toward the camera in a warp-drive style
3. Smooth 3-second transition with no scene reload or gameplay interruption
4. Both effects triggered by a single `entering_zone` event from the wave manager

### Background / Context:
The wave manager already emits an `entering_zone` event when transitioning between waves. Previously, the plan was to swap scenes, but that introduces unnecessary complexity and state management issues. This design leverages the existing event system to create effects that run alongside active gameplay without interrupting the player's ship or game state.

## Feature Description

### Summary:
A lightweight, self-contained effect system that displays a brief visual sequence when advancing to a new wave. The effect consists of two independent components: an ECS system that renders particles and a React component that displays text, both synchronized via the `entering_zone` event.

### Key Requirements:
- Create `EnteringZoneEffectSystem` that spawns and animates point particles
- Particles accelerate toward camera (warp drive effect) over 3 seconds
- System self-destructs after animation completes
- React UI listens to `entering_zone` events and displays "Entering Zone X" message
- No gameplay interruption—ship remains controllable, asteroids remain on screen
- Event-driven architecture with no direct coupling between systems
- Configurable display duration and particle count
- Smooth camera interaction (particles don't interfere with player controls)

### Non-Goals:
- Pausing gameplay during zone entry (effect runs simultaneously with active wave)
- Modifying camera behavior (particles only, no camera zoom/pan)
- Changing wave initialization logic (handled by WaveTransitionSystem)
- Audio cues (can be added separately if desired)

## Design Decisions

### Event-Driven Over Scene-Based
Rather than transitioning to a separate scene (which would require preserving `WaveManager` state, managing cleanup, and adding complexity), we emit an event that multiple systems subscribe to. This keeps concerns separated and maintains the game loop continuity.

**Rationale**:
- Scene transitions create state management overhead
- The gameplay world and its entities should remain active during the effect
- Event-driven architecture is already established in the codebase (wave manager)
- Easier to test and reason about side effects

### Two Independent Listeners
The `entering_zone` event is consumed by:
1. **ECS System** (engine-side): Renders particles
2. **React Hook** (UI-side): Displays text

This separation allows each layer to manage its own concerns without coupling.

**Rationale**:
- Engine logic stays in ECS, UI logic stays in React
- Either system can be disabled/modified independently
- Cleaner separation of concerns
- Easier to test each component in isolation

### Self-Destructing System
The `EnteringZoneEffectSystem` creates and manages its own entities/particles, then destroys itself when complete. It doesn't need to be a permanently registered system.

**Rationale**:
- Minimal memory overhead—effect is ephemeral
- No state to clean up between waves
- System can emit a completion event if other systems need to react

### Particle-Based Warp Effect
Rather than complex shader effects or camera animations, we use a simple geometry-based approach:
- Spawn ~100 points randomly in the scene at various distances in the z axis
- Animate them toward the camera with accelerating velocity
- Fade into the effect and out of the effect once the duration is over
- Uses standard THREE.js Point material for performance, similar to the missile

**Rationale**:
- Simple to implement and debug
- Good visual feedback without being distracting
- Doesn't interfere with gameplay rendering
- Easy to tune particle count for performance

## Technical Specifications

### Events

#### entering_zone (existing, emitted by WaveTransitionSystem)
```typescript
{
  type: "entering_zone",
  zoneNumber: number,           // The zone number the player is entering (same as wave number)
  displayDuration: number,      // Milliseconds (default: 3000)
}
```

#### entering_zone_effect_complete (new)
Emitted by `EnteringZoneEffectSystem` when animation finishes.
```typescript
{
  type: "entering_zone_effect_complete",
  zoneNumber: number,
}
```

### System: EnteringZoneEffectSystem

#### Purpose
Listens for `entering_zone` events and spawns an animated particle effect.

#### Behavior
1. On `entering_zone` event:
   - Create a temporary entity with `EnteringZoneEffectComponent`
   - Store animation start time, duration, and zone number
   - Spawn particle geometry

2. Each frame during update:
   - Calculate animation progress (0 to 1)
   - Update particle positions: lerp from initial position toward camera
   - Update particle opacity: fade out as they approach
   - Detect animation completion

3. On animation complete:
   - Remove the effect entity
   - Emit `entering_zone_effect_complete` event
   - (Optional) Uninstall the system or keep it dormant

#### Configuration
```typescript
interface EnteringZoneEffectConfig {
  particleCount: number;        // Default: 200
  particleSize: number;         // Default: 0.5 (THREE.js size)
  animationDuration: number;    // Default: 3000 (ms)
  particleSpread: number;       // Default: 100 (world units)
  acceleration: number;         // Default: 2.0 (easing factor)
  fadeOutStart: number;         // Default: 0.7 (progress 0-1)
}
```

#### Component: EnteringZoneEffectComponent
```typescript
interface EnteringZoneEffectComponent {
  zoneNumber: number;
  startTime: number;
  duration: number;
  particlePositions: Float32Array;  // Initial positions
  particleGeometry: THREE.BufferGeometry;
  particleMesh: THREE.Points;
  particleSpread: number;
  acceleration: number;
  fadeOutStart: number;
}
```

### React Component/Hook

#### Purpose
Listen to `entering_zone` events via the engine's event system and display the zone message.

#### Implementation
```typescript
// Hook signature
function useEnteringZoneEffect() {
  const [showMessage, setShowMessage] = useState(false);
  const [zoneNumber, setZoneNumber] = useState<number | null>(null);

  useEffect(() => {
    const handleEnteringZone = (event: EnteringZoneEvent) => {
      setZoneNumber(event.zoneNumber);
      setShowMessage(true);

      // Auto-hide after duration
      const timeout = setTimeout(() => {
        setShowMessage(false);
      }, event.displayDuration);

      return () => clearTimeout(timeout);
    };

    // Subscribe to engine events
    const unsubscribe = window.gameEngine?.onEvent?.("entering_zone", handleEnteringZone);
    return () => unsubscribe?.();
  }, []);

  return { showMessage, zoneNumber };
}
```

#### UI Component
```typescript
export function EnteringZoneOverlay() {
  const { showMessage, zoneNumber } = useEnteringZoneEffect();

  if (!showMessage || zoneNumber === null) return null;

  return (
    <div className="entering-zone-overlay">
      <h2>ENTERING ZONE {zoneNumber}</h2>
    </div>
  );
}
```

#### CSS (example styling)
```css
.entering-zone-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: bold;
  color: #00ff00;
  text-shadow: 0 0 20px #00ff00;
  animation: fadeInOut 3s ease-in-out;
  z-index: 100;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}
```

### Engine Integration

#### Scene Manager Integration
The `EnteringZoneEffectSystem` needs access to:
- The THREE.js scene (to add particles as objects)
- The camera (to calculate direction vectors)
- The game world (for entity management)

This should be passed during system setup:

```typescript
const system = new EnteringZoneEffectSystem(world, threeScene, camera);
world.addSystem(system);
```

#### Event Flow
```
WaveTransitionSystem
  ↓
emits entering_zone event
  ↓
┌─────────────────────────────────────┐
│                                     │
v                                     v
EnteringZoneEffectSystem       React useEnteringZoneEffect()
(spawns particles)            (shows "Entering Zone X")
  ↓                                   ↓
animates over 3 seconds      displays for displayDuration
  ↓                                   ↓
emits entering_zone_complete  auto-fades out
(optional, for chaining)
```

## Development Phases & Checklist

### Phase 1 — Design & Prototyping
- [x] Finalize particle effect visuals (grid layout, spread, acceleration curve)
- [x] Confirm React event subscription mechanism with main.tsx setup

### Phase 2 — Core System Implementation
- [ ] Create `EnteringZoneEffectSystem` class
- [ ] Create `EnteringZoneEffectComponent` interface
- [ ] Implement particle spawning and initialization
- [ ] Implement animation loop with easing
- [ ] Implement self-destruction on completion

### Phase 3 — React Integration
- [ ] Create `useEnteringZoneEffect` hook
- [ ] Create `EnteringZoneOverlay` component
- [ ] Set up event bridge between engine and React (window.gameEngine reference)
- [ ] Add CSS animations and styling

### Phase 4 — Integration & Testing
- [ ] Hook up system to wave manager plugin
- [ ] Test event flow during wave transitions
- [ ] Verify no performance regression during effect
- [ ] Verify ship remains controllable during effect
- [ ] Verify UI and particles are in sync

### Phase 5 — Polish & Tuning
- [ ] Adjust particle count/spread for visual appeal
- [ ] Fine-tune animation easing curve
- [ ] Test on different screen sizes (UI scaling)
- [ ] Optional: Add config file for easy tweaking

## References

- [Wave Manager](./2025-12-23-wave-manager.md)
- [Wave Manager Phase 4 Testing](./2025-12-26-wave-manager-phase-4-testing.md)
- [Engine API - Systems](../../engine/docs/specs/ecs-systems.md)
- [Engine API - Events](../../engine/docs/specs/engine-api.md)

## Appendix: Particle Positioning Algorithm

### Initial Layout
Particles are distributed in a sphere/cube pattern around the player:

```typescript
const particles = [];
const spread = config.particleSpread;
const count = Math.cbrt(config.particleCount); // cube root for uniform distribution

for (let x = 0; x < count; x++) {
  for (let y = 0; y < count; y++) {
    for (let z = 0; z < count; z++) {
      const posX = (x / count - 0.5) * spread;
      const posY = (y / count - 0.5) * spread;
      const posZ = (z / count - 0.5) * spread - 50; // Start behind camera

      particles.push(new THREE.Vector3(posX, posY, posZ));
    }
  }
}
```

### Animation
Each frame, particles move toward camera with accelerating velocity:

```typescript
const progress = (currentTime - startTime) / duration; // 0 to 1
const easeProgress = Math.pow(progress, config.acceleration); // ease curve

// Toward camera (negative Z direction, assuming camera at origin)
const direction = new THREE.Vector3(0, 0, 1).normalize();
const velocity = easeProgress * maxVelocity;

newPosition = initialPosition.add(direction.multiplyScalar(velocity));

// Fade out
if (easeProgress > config.fadeOutStart) {
  opacity = 1 - ((easeProgress - fadeOutStart) / (1 - fadeOutStart));
}
```

## Questions & Decisions Log

**Q: Should the effect pause if the game is paused?**
A: Yes. Use the `isPaused` flag from the Time resource to skip updates during pause.

**Q: What if the player wants to skip the effect?**
A: No the user cannot skip the animation. 

**Q: Should particles collide with the player ship?**
A: No. Particles are purely visual and don't have collision geometry. They render above/around the ship.

**Q: Can we reuse this system for other zone transitions or effects?**
A: Yes. The system is generic and can be configured for different visual styles. The component and config are designed for reusability.
