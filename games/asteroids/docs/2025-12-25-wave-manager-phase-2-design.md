# Wave Manager — Phase 2: Design

Feature: Wave Manager
Document: `2025-12-25-wave-manager-phase-2-design.md`
Date: December 25, 2025
Status: ✅ COMPLETE

## Overview

Phase 2 defines the detailed design of the Wave Manager system, including resource structures, system behavior, event schemas, and integration patterns. This document serves as the blueprint for Phase 3 implementation.

---

## Resource Design

### WaveManager Resource

**Purpose**: Centralized resource that tracks wave state and game progression.

**Location**: `games/asteroids/src/resources/wave-manager.ts`

```typescript
/**
 * WaveManager resource tracks wave state, entity counts, and difficulty progression.
 * Persists across scene transitions and serves as single source of truth for wave data.
 */
interface WaveManager {
  // Wave Progression
  currentWaveNumber: number;        // Wave counter (starts at 1)
  totalWavesCompleted: number;      // Historical count of completed waves
  
  // Entity Tracking
  asteroidCount: number;            // Current active asteroids (query-derived)
  alienCount: number;               // Current active aliens (query-derived)
  asteroidsDestroyedThisWave: number;   // For scoring integration
  aliensDestroyedThisWave: number;      // For scoring integration
  
  // Timing
  waveStartTime: number;            // System time (milliseconds) when wave started
  previousWaveDuration?: number;    // Duration of completed wave (for analytics)
  
  // State
  isWaveComplete: boolean;          // True when asteroids = 0 AND aliens = 0
  isAsteroidsCleared: boolean;      // True when asteroids = 0 (interim state)
  difficultyMultiplier: number;     // Current wave difficulty (1.0 + (n-1) * 0.15)
  
  // Metadata
  lastEventEmitted: string;         // Track last event for debugging
}
```

**Creation Pattern**:
```typescript
// Initialize WaveManager in game setup
const waveManager: WaveManager = {
  currentWaveNumber: 1,
  totalWavesCompleted: 0,
  asteroidCount: 0,
  alienCount: 0,
  asteroidsDestroyedThisWave: 0,
  aliensDestroyedThisWave: 0,
  waveStartTime: currentTime,
  isWaveComplete: false,
  isAsteroidsCleared: false,
  difficultyMultiplier: 1.0,
  lastEventEmitted: "game_start",
};

world.addResource(waveManager);
```

**Access Pattern**:
```typescript
// In systems, access the resource
const waveManager = world.getResource(WaveManager);
waveManager.currentWaveNumber // => 1
waveManager.difficultyMultiplier // => 1.0 for wave 1
```

---

## System Design

### WaveTrackingSystem

**Purpose**: Monitor active entity counts and detect wave completion states.

**Location**: `games/asteroids/src/systems/wave-tracking-system.ts`

**Behavior**:

1. **Every Frame**: Update entity counts via queries
   ```
   Query all entities with AsteroidComponent
   Update WaveManager.asteroidCount = query result count
   
   Query all entities with AlienComponent
   Update WaveManager.alienCount = query result count
   ```

2. **Detect Asteroids Cleared**:
   ```
   IF (asteroidCount === 0 AND isAsteroidsCleared === false):
     Set isAsteroidsCleared = true
     Log "All asteroids destroyed, awaiting alien completion"
   ```

3. **Detect Wave Completion**:
   ```
   IF (asteroidCount === 0 AND alienCount === 0 AND isWaveComplete === false):
     Set isWaveComplete = true
     Calculate wave duration = currentTime - waveStartTime
     Store previousWaveDuration
     Emit "wave_complete" event
   ```

4. **Reset on Wave Transition**:
   ```
   Listen for "wave_transition" event
   Reset: asteroidCount, alienCount, asteroidsDestroyedThisWave, aliensDestroyedThisWave
   Reset: isWaveComplete, isAsteroidsCleared
   Set: waveStartTime = currentTime
   ```

**System Order**: Runs AFTER collision system (so destroyed entities are removed from queries).

**Pseudo-code**:
```typescript
class WaveTrackingSystem extends System {
  execute(world: World, time: Time) {
    const waveManager = world.getResource(WaveManager);
    
    // Update counts
    const asteroids = world.query([AsteroidComponent]);
    const aliens = world.query([AlienComponent]);
    waveManager.asteroidCount = asteroids.length;
    waveManager.alienCount = aliens.length;
    
    // Detect states
    if (waveManager.asteroidCount === 0 && !waveManager.isAsteroidsCleared) {
      waveManager.isAsteroidsCleared = true;
      // Potential for interim message: "Asteroids Destroyed!"
    }
    
    if (waveManager.asteroidCount === 0 && 
        waveManager.alienCount === 0 && 
        !waveManager.isWaveComplete) {
      waveManager.isWaveComplete = true;
      const duration = time.elapsed - waveManager.waveStartTime;
      
      world.emitEvent({
        type: "wave_complete",
        waveNumber: waveManager.currentWaveNumber,
        asteroidsDestroyed: waveManager.asteroidsDestroyedThisWave,
        aliensDestroyed: waveManager.aliensDestroyedThisWave,
        waveDuration: duration,
      });
      
      waveManager.lastEventEmitted = "wave_complete";
    }
  }
}

// Listen for wave transition to reset counts
world.onEvent("wave_transition", (event) => {
  const waveManager = world.getResource(WaveManager);
  waveManager.asteroidCount = 0;
  waveManager.alienCount = 0;
  waveManager.asteroidsDestroyedThisWave = 0;
  waveManager.aliensDestroyedThisWave = 0;
  waveManager.isWaveComplete = false;
  waveManager.isAsteroidsCleared = false;
  waveManager.waveStartTime = time.elapsed;
});
```

---

### WaveTransitionSystem

**Purpose**: Handle wave progression, difficulty calculation, and next wave initialization.

**Location**: `games/asteroids/src/systems/wave-transition-system.ts`

**Behavior**:

1. **Listen for wave_complete Event**:
   ```
   When "wave_complete" event is received:
   - Increment currentWaveNumber
   - Increment totalWavesCompleted
   - Calculate new difficulty multiplier
   - Emit "wave_transition" event
   ```

2. **Difficulty Calculation**:
   ```
   difficultyMultiplier = 1.0 + (currentWaveNumber - 1) * 0.15
   
   Examples:
   - Wave 1: 1.0 + (1-1) * 0.15 = 1.00 (baseline)
   - Wave 2: 1.0 + (2-1) * 0.15 = 1.15 (15% harder)
   - Wave 3: 1.0 + (3-1) * 0.15 = 1.30 (30% harder)
   - Wave 5: 1.0 + (5-1) * 0.15 = 1.60 (60% harder)
   ```

3. **Trigger Scene Transition Effect** (Optional):
   ```
   Emit "entering_zone" or similar event to trigger visual/audio effect
   Scene shows: "Zone 2" or "Wave 2: Difficulty 1.15x"
   Duration: 2-3 seconds before spawn system begins spawning
   ```

**System Order**: Runs on event, not every frame. Triggered by wave_complete event.

**Pseudo-code**:
```typescript
class WaveTransitionSystem extends System {
  constructor() {
    super();
    // Listen for wave completion
    world.onEvent("wave_complete", (event) => this.onWaveComplete(world, event));
  }
  
  onWaveComplete(world: World, event: WaveCompleteEvent) {
    const waveManager = world.getResource(WaveManager);
    
    // Increment wave
    waveManager.currentWaveNumber++;
    waveManager.totalWavesCompleted++;
    
    // Calculate difficulty
    waveManager.difficultyMultiplier = 
      1.0 + (waveManager.currentWaveNumber - 1) * 0.15;
    
    // Emit transition event
    world.emitEvent({
      type: "wave_transition",
      fromWave: event.waveNumber,
      toWave: waveManager.currentWaveNumber,
      difficultyMultiplier: waveManager.difficultyMultiplier,
    });
    
    // Optional: Scene transition effect
    world.emitEvent({
      type: "entering_zone",
      zoneNumber: waveManager.currentWaveNumber,
    });
    
    waveManager.lastEventEmitted = "wave_transition";
  }
}
```

---

## Event Schema Design

### Event: wave_complete

**Purpose**: Signals that a wave has been completed (all asteroids and aliens destroyed).

**Emitter**: WaveTrackingSystem

**Consumers**: WaveTransitionSystem, Scene Manager, UI System, Audio System

**Schema**:
```typescript
interface WaveCompleteEvent {
  type: "wave_complete";
  waveNumber: number;               // Completed wave number
  asteroidsDestroyed: number;       // Count of asteroids destroyed this wave
  aliensDestroyed: number;          // Count of aliens destroyed this wave
  waveDuration: number;             // Duration in milliseconds
}

// Example
{
  type: "wave_complete",
  waveNumber: 1,
  asteroidsDestroyed: 5,
  aliensDestroyed: 2,
  waveDuration: 45000,  // 45 seconds
}
```

### Event: wave_transition

**Purpose**: Signals progression to the next wave with difficulty scaling.

**Emitter**: WaveTransitionSystem

**Consumers**: Spawn System, Scene Manager, UI System

**Schema**:
```typescript
interface WaveTransitionEvent {
  type: "wave_transition";
  fromWave: number;                 // Previous wave number
  toWave: number;                   // New wave number
  difficultyMultiplier: number;     // Difficulty scale (1.0 = baseline)
}

// Example
{
  type: "wave_transition",
  fromWave: 1,
  toWave: 2,
  difficultyMultiplier: 1.15,
}
```

### Event: entering_zone (Optional)

**Purpose**: Signals visual/audio effect for wave transition (zone entry screen).

**Emitter**: WaveTransitionSystem

**Consumers**: Scene Manager, UI System

**Schema**:
```typescript
interface EnteringZoneEvent {
  type: "entering_zone";
  zoneNumber: number;               // Wave/zone number
  displayDuration?: number;         // How long to show the message (ms)
}

// Example
{
  type: "entering_zone",
  zoneNumber: 2,
  displayDuration: 3000,
}
```

### External Events (Received by Wave Manager)

#### Event: asteroid_destroyed

**Purpose**: Emitted by collision system when an asteroid is destroyed.

**Emitter**: Collision System

**Consumer**: WaveTrackingSystem (for counting)

**Schema**:
```typescript
interface AsteroidDestroyedEvent {
  type: "asteroid_destroyed";
  asteroidSize: 1 | 2 | 3;          // Asteroid size category
  position: [x: number, y: number, z?: number];
}
```

#### Event: alien_destroyed

**Purpose**: Emitted by collision system when an alien is destroyed.

**Emitter**: Collision System

**Consumer**: WaveTrackingSystem (for counting)

**Schema**:
```typescript
interface AlienDestroyedEvent {
  type: "alien_destroyed";
  alienType: string;                // Alien variant name
  position: [x: number, y: number, z?: number];
}
```

---

## Integration Points

### Integration 1: Spawn System (Downstream Consumer)

**How It Works**:
1. Spawn system listens for `wave_transition` event
2. Extracts `difficultyMultiplier` from event
3. Calculates spawn counts: `baseCount * difficultyMultiplier`
4. Begins spawning asteroids and aliens with scaled counts

**Implementation**:
```typescript
world.onEvent("wave_transition", (event) => {
  const spawnConfig = calculateSpawnCounts(baseConfig, event.difficultyMultiplier);
  // Apply scaled config for next wave
});
```

**Status**: Integration point identified; spawn system will subscribe to wave_transition.

### Integration 2: Scene Manager (Downstream Consumer)

**How It Works**:
1. Scene manager listens for `wave_complete` and `wave_transition` events
2. On `wave_complete`: Can pause gameplay, show completion screen
3. On `wave_transition`: Can trigger scene effects, zone entry overlay
4. On `entering_zone`: Shows zone number on screen for 2-3 seconds

**Status**: Integration point identified; scene manager will subscribe to wave events.

### Integration 3: Collision System (Upstream Producer)

**How It Works**:
1. Collision system detects asteroid-missile collision
2. Emits `asteroid_destroyed` event with size and position
3. WaveTrackingSystem listens and increments `asteroidsDestroyedThisWave`
4. Same pattern for alien collisions

**Status**: Collision system already exists; will emit required events.

### Integration 4: Asteroid & Alien Components

**How It Works**:
1. Spawn system creates entities with `AsteroidComponent` and `AlienComponent`
2. WaveTrackingSystem queries these components to count active entities
3. When entities are destroyed, components are removed
4. Query counts automatically update

**Status**: Components will be created in Phase 3.

---

## State Transitions Diagram

```
Game Start
    ↓
Initialize Wave 1
  WaveManager.currentWaveNumber = 1
  WaveManager.difficultyMultiplier = 1.0
  WaveManager.asteroidCount = 5 (spawned by spawn system)
  WaveManager.alienCount = 0
    ↓
Active Gameplay
  - Asteroids destroyed → asteroidCount decreases
  - Aliens spawn → alienCount increases
  - Aliens destroyed → alienCount decreases
    ↓
Asteroids Cleared (interim state)
  WaveManager.isAsteroidsCleared = true
  Awaiting final alien destruction
    ↓
Wave Complete
  WaveManager.asteroidCount = 0
  WaveManager.alienCount = 0
  WaveManager.isWaveComplete = true
  Emit: wave_complete
    ↓
Wave Transition
  Increment: currentWaveNumber (1 → 2)
  Calculate: difficultyMultiplier (1.0 → 1.15)
  Emit: wave_transition
  Emit: entering_zone (optional visual effect)
    ↓
Next Wave Initialization
  Reset entity counts
  Spawn system receives wave_transition with new multiplier
  Spawn new asteroids (scaled by multiplier)
    ↓
Back to Active Gameplay (repeat)
```

---

## Design Decisions & Rationale

### Decision 1: Query-Based Entity Counting
**Approach**: Count entities via ECS queries rather than manual increment/decrement.

**Rationale**:
- Self-healing: If entities are destroyed outside normal pathways, queries remain accurate
- Simple: No manual bookkeeping needed
- Aligned with ECS principles
- Engine already supports efficient queries

**Alternative**: Event-based counting (increment/decrement on spawn/destroy)
- Rejected because: More error-prone, requires tight coupling with spawn/collision systems

### Decision 2: Two-Stage Wave Completion Detection
**Approach**: Separately detect "asteroids cleared" and "wave complete" states.

**Rationale**:
- Allows interim messaging (e.g., "All asteroids destroyed!")
- Handles async alien despawn/cleanup gracefully
- Clear state machine for debugging

**Alternative**: Single completion state
- Rejected because: Less responsive to player feedback

### Decision 3: Linear Difficulty Scaling (15% per wave)
**Formula**: `1.0 + (waveNumber - 1) * 0.15`

**Rationale**:
- Predictable and understandable progression
- Testable and tunable
- 15% increase provides meaningful challenge without exponential spike

**Examples**:
- Wave 1: 1.00x (baseline, 5 asteroids)
- Wave 5: 1.60x (60% harder, 8 asteroids)
- Wave 10: 2.35x (135% harder, 12 asteroids)

**Alternative**: Exponential scaling
- Could be applied if waves become too easy at higher numbers
- Formula: `1.0 * (1.15 ^ (waveNumber - 1))`

### Decision 4: WaveManager as Resource (Not Component)
**Approach**: Single resource shared across all systems.

**Rationale**:
- Persists across scene transitions
- Single source of truth for wave state
- Consistent with engine patterns (Time, SceneManager are resources)
- No redundant copies across entities

**Alternative**: Component on player or game entity
- Rejected because: Would require querying to access, less efficient

### Decision 5: Event-Driven Architecture
**Approach**: Systems communicate via events (wave_complete → wave_transition).

**Rationale**:
- Decouples spawn system from wave manager
- Allows multiple systems to react to wave events
- Extensible (audio, UI can listen to same events)
- Aligns with engine patterns

**Alternative**: Direct system method calls
- Rejected because: Tight coupling, harder to extend

### Decision 6: Single Active Alien at a Time
**Approach**: Only one alien can exist per wave; new alien spawns after previous despawns/dies.

**Rationale**:
- Keeps alien pressure consistent regardless of wave
- Difficulty scaling applies only to asteroids
- Simpler alien spawning logic
- Reduces complexity of alien count tracking

**Impact**: `alienCount` is either 0 or 1 for most gameplay.

---

## Pseudo-code Summary

### Initialize Game
```typescript
function initializeGame(world: World) {
  const waveManager: WaveManager = {
    currentWaveNumber: 1,
    asteroidCount: 0,
    alienCount: 0,
    isWaveComplete: false,
    difficultyMultiplier: 1.0,
    // ... other fields
  };
  
  world.addResource(waveManager);
  world.registerSystem(WaveTrackingSystem);
  world.registerSystem(WaveTransitionSystem);
  
  // Start wave 1
  spawnWave1(world);
}
```

### Wave Tracking (Every Frame)
```typescript
class WaveTrackingSystem {
  execute(world: World) {
    const waveManager = world.getResource(WaveManager);
    
    waveManager.asteroidCount = world.query([AsteroidComponent]).length;
    waveManager.alienCount = world.query([AlienComponent]).length;
    
    if (waveManager.asteroidCount === 0 && 
        waveManager.alienCount === 0 && 
        !waveManager.isWaveComplete) {
      waveManager.isWaveComplete = true;
      world.emitEvent({ type: "wave_complete", ... });
    }
  }
}
```

### Wave Transition (On Event)
```typescript
world.onEvent("wave_complete", (event) => {
  const waveManager = world.getResource(WaveManager);
  
  waveManager.currentWaveNumber++;
  waveManager.difficultyMultiplier = 
    1.0 + (waveManager.currentWaveNumber - 1) * 0.15;
  
  world.emitEvent({
    type: "wave_transition",
    toWave: waveManager.currentWaveNumber,
    difficultyMultiplier: waveManager.difficultyMultiplier,
  });
});
```

---

## Phase 2 Checklist
- ✅ Resource data structures defined
- ✅ System behavior documented
- ✅ Event schemas finalized
- ✅ Integration points identified
- ✅ Design decisions documented with rationale
- ✅ State transitions visualized
- ✅ Pseudo-code provided for implementation reference

**Phase 2 Status: COMPLETE**

---

## Next Steps
Proceed to Phase 3: Implementation to create the resource, systems, and events based on this design.

---

## Appendices

### Appendix A: Difficulty Scaling Reference Table

| Wave | Difficulty Multiplier | Asteroid Count (Base 5) | Alien Behavior |
|------|----------------------|----------------------|----------------|
| 1    | 1.00x                | 5                    | Standard spawn |
| 2    | 1.15x                | 6                    | Standard spawn |
| 3    | 1.30x                | 7                    | Standard spawn |
| 4    | 1.45x                | 8                    | Standard spawn |
| 5    | 1.60x                | 8                    | Standard spawn |
| 6    | 1.75x                | 9                    | Standard spawn |
| 7    | 1.90x                | 10                   | Standard spawn |
| 8    | 2.05x                | 11                   | Standard spawn |
| 9    | 2.20x                | 12                   | Standard spawn |
| 10   | 2.35x                | 12                   | Standard spawn |

*Note: Alien spawn rate and behavior remain constant; only asteroid counts scale.*

### Appendix B: Related Components (To Be Created)

1. **AsteroidComponent**: Marks entity as asteroid, queried by WaveTrackingSystem
2. **AlienComponent**: Marks entity as alien, queried by WaveTrackingSystem
3. **CollisionSystem**: Emits asteroid_destroyed and alien_destroyed events
4. **SpawnSystem**: Listens to wave_transition, applies difficulty multiplier
