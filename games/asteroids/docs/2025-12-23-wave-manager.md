# Wave Manager

Feature Name: Wave Manager
Filename: `2025-12-23-wave-manager.md`
Date: December 23, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Implement a wave management system that tracks active asteroids and aliens during gameplay, determines when a wave is complete, and triggers transitions to the next wave.

### Goal / Expected Outcome:
The game accurately detects when all destructible entities (asteroids and aliens) have been eliminated, emits a wave completion event, and prepares for the next wave with increased difficulty.

### Background / Context:
Asteroids are spawned at wave start and destroyed by player missiles. Aliens spawn at intervals throughout a wave and can be destroyed or despawn if they leave the arena. The wave manager must handle dynamic entity counts since alien count can fluctuate.

## Feature Description

### Summary:
A centralized system that tracks the count of active asteroids and aliens, detects when a wave is complete (no asteroids AND no active aliens), and manages wave state transitions. The wave manager emits events to trigger scene transitions and difficulty scaling.

### Key Requirements:
- Track count of active asteroids in the current wave
- Track count of active aliens in the current wave
- Detect when no asteroids remain (interim state)
- Detect when no asteroids AND no aliens remain (wave complete)
- Emit "wave_complete" event to trigger next wave initialization
- Store current wave number and difficulty multiplier
- Calculate and track wave difficulty based on wave number
- Handle dynamic entity counts as aliens spawn/despawn at intervals
- Persist wave state across scene transitions if needed

### Non-Goals:
- Asteroid or alien spawning logic (handled by spawn systems)
- Difficulty parameter adjustment (managed by wave manager, applied by spawn systems)
- Score calculation or UI updates (handled by separate systems)

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed
- [x] Dependencies identified (entity lifecycle monitoring, event system)
- **Status**: ✅ COMPLETE — See [Phase 1 Discovery Document](./2025-12-25-wave-manager-phase-1-discovery.md)

### Phase 2 — Design
- [x] Resource data structures defined
- [x] System behavior documented
- [x] Event schema finalized
- [x] Integration points with spawn systems identified
- **Status**: ✅ COMPLETE — See [Phase 2 Design Document](./2025-12-25-wave-manager-phase-2-design.md)

### Phase 3 — Implementation
- [x] WaveManager resource created
- [x] WaveTrackingSystem created to monitor entity counts
- [x] Wave completion detection implemented
- [x] Wave transition system created
- [x] Difficulty scaling parameters defined
- [x] Configuration file for difficulty management created
- [x] AlienComponent created for entity filtering
- [x] Comprehensive unit tests written
- **Status**: ✅ COMPLETE

### Phase 4 — Integration & Testing
- [ ] Unit tests for wave state tracking
- [ ] Integration tests with spawn systems
- [ ] Manual testing of wave transitions

### Phase 5 — Polish & Iteration
- [ ] Wave transition effects (Entering Zone X message)
- [ ] Difficulty tuning based on feedback
- [ ] Documentation completed

## Technical Specifications

### Resources

#### WaveManager
```typescript
interface WaveManager {
  currentWaveNumber: number;        // Wave number (starts at 1)
  asteroidCount: number;            // Active asteroids remaining
  alienCount: number;               // Active aliens remaining
  waveStartTime: number;            // Timestamp when wave began
  isWaveComplete: boolean;          // True when asteroids = 0 AND aliens = 0
  asteroidsDestroyedThisWave: number; // Tracking for scoring
  aliensDestroyedThisWave: number;   // Tracking for scoring
}
```

### Systems

#### WaveTrackingSystem
Monitors entity counts and detects wave completion:
- Query all AsteroidComponent entities and update asteroidCount each frame
- Query all AlienComponent entities and update alienCount each frame
- When asteroidCount reaches 0: Log interim state (all asteroids destroyed)
- When both asteroidCount = 0 AND alienCount = 0: Set isWaveComplete = true
- Only when wave is complete: Emit "wave_complete" event with current wave metadata
- Track destroyed entity counts for scoring integration

#### WaveTransitionSystem
Handles progression to the next wave:
- Listen for "wave_complete" event from WaveTrackingSystem
- Increment currentWaveNumber
- Calculate difficulty multiplier: `1.0 + (waveNumber - 1) * 0.15`
- Store difficulty multiplier as wave state
- Make useDifficultyMultiplier configurable via `@shared/config.ts` file so we can have normal mode vs difficulty mode
- Emit "wave_transition" event with new wave number and difficulty
- Scene manager transitions to "entering_zone" effect before spawning next wave

### Events

#### wave_complete
Emitted when a wave is completed (no asteroids and no aliens remain).
```typescript
{
  type: "wave_complete",
  waveNumber: number,
  asteroidsDestroyed: number,
  aliensDestroyed: number,
  waveStartTime: number,
  waveDuration: number,
}
```

#### wave_transition
Emitted when transitioning to the next wave.
```typescript
{
  type: "wave_transition",
  fromWave: number,
  toWave: number,
  difficultyMultiplier: number,
}
```

#### asteroid_destroyed
External event emitted by collision system when asteroid is destroyed (wave manager listens).
```typescript
{
  type: "asteroid_destroyed",
  asteroidSize: 1 | 2 | 3,
  position: [x, y, z],
}
```

#### alien_destroyed
External event emitted by collision system when alien is destroyed (wave manager listens).
```typescript
{
  type: "alien_destroyed",
  alienType: string,
  position: [x, y, z],
}
```

## Design Decisions

### Query-Based Counting
The wave manager uses ECS queries to count active entities rather than manual increment/decrement on spawn/destroy. This is more robust and self-healing if entities are destroyed outside normal collision pathways.

### Two-Stage Wave Completion
Detecting "no asteroids" separately from "no asteroids AND no aliens" allows for potential interim messaging (e.g., "Asteroids destroyed! Clearing remaining enemies...") without complicating the wave logic.

### Difficulty Multiplier Calculation
A linear 15% difficulty increase per wave provides predictable scaling. Spawn systems apply this multiplier to asteroid and alien spawn counts. Alternative: exponential scaling if waves become too easy at higher numbers.

### Event-Driven Progression
Wave transition triggers via event rather than direct scene manipulation, allowing multiple systems to react (UI updates, audio, particle effects) without coupling to wave manager.

### Persistent Wave State
WaveManager is a resource, not a component, so it persists across scene reloads and provides a single source of truth for wave state. Useful for pause/resume and potential save states.

### Alien Spawn Behavior
Alien spawn rate is static and does not scale with wave difficulty. Only one alien can be active at a time—a new alien spawns only after the previous one is destroyed or despawns. This keeps alien pressure consistent while asteroid difficulty scales with wave number.

## References

- [Player Ship](./2025-12-23-player-ship.md)
- [Asteroid Object](./2025-12-23-asteroid-component.md)
- [Alien Component](./2025-12-23-alien-component.md) (to be created)
- [North Star](./north-star.md)
- [Engine API](../../engine/docs/specs/engine-api.md)
