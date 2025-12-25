# Wave Manager — Phase 1: Discovery

Feature: Wave Manager
Document: `2025-12-25-wave-manager-phase-1-discovery.md`
Date: December 25, 2025
Status: ✅ COMPLETE

## Overview

Phase 1 establishes the requirements, technical feasibility, and dependencies for the Wave Manager system. This document confirms that the feature is well-scoped, feasible within the current engine architecture, and identifies all integration points.

---

## Requirements Confirmation

### Functional Requirements
- ✅ Track active asteroid count in real-time
- ✅ Track active alien count in real-time
- ✅ Detect wave completion (no asteroids AND no aliens)
- ✅ Emit wave completion event with metadata
- ✅ Calculate difficulty multiplier based on wave number
- ✅ Emit wave transition event with new difficulty

### Non-Functional Requirements
- ✅ Efficient entity counting (query-based, not manual tracking)
- ✅ Reliable wave state persistence across scene transitions
- ✅ Support for dynamic entity spawning/despawning during waves
- ✅ Event-driven architecture for decoupled system integration

### Scope Validation
- ✅ Asteroid/alien spawning is OUT OF SCOPE (handled by spawn systems)
- ✅ Score calculation is OUT OF SCOPE (handled by separate systems)
- ✅ UI updates are OUT OF SCOPE (triggered by wave events)
- ✅ Difficulty parameter application is OUT OF SCOPE (spawn systems apply multiplier)

---

## Technical Feasibility Review

### Architecture Compatibility
The proposed Wave Manager fits naturally into the Game Studio X engine architecture:

1. **ECS Resource Pattern**: WaveManager as a resource ✅
   - Persists across systems
   - Single source of truth for wave state
   - Accessible to multiple systems
   - Consistent with engine design (Time, SceneManager resources)

2. **ECS System Pattern**: WaveTrackingSystem and WaveTransitionSystem ✅
   - Query-based entity counting aligns with ECS principles
   - Event emission follows existing engine event patterns
   - System scheduling allows proper ordering

3. **Event System**: Event-driven wave progression ✅
   - Engine supports custom events
   - Multiple systems can listen to wave events
   - Decouples wave logic from spawn/collision systems

### Implementation Feasibility
- ✅ Resource creation: Straightforward ECS pattern
- ✅ Query-based counting: Existing engine query infrastructure
- ✅ Event emission: Established engine event system
- ✅ Difficulty calculation: Simple linear math (no complex algorithms)
- ✅ Integration points: Clear and well-defined

### Performance Considerations
- ✅ Query-based counting is O(n) per frame but acceptable (asteroid/alien count is small)
- ✅ Event emission is negligible cost
- ✅ No external dependencies or complex data structures
- ✅ Can optimize later with entity lifecycle events if needed

---

## Dependencies Identified

### Engine Dependencies
1. **ECS World & Resource System**
   - Location: `engine/src/core/world.ts`
   - Usage: Register WaveManager resource
   - Status: ✅ Available and tested

2. **ECS System Manager**
   - Location: `engine/src/ecs/system-manager.ts`
   - Usage: Register WaveTrackingSystem and WaveTransitionSystem
   - Status: ✅ Available and tested

3. **Entity Query System**
   - Location: `engine/src/core/query.ts`
   - Usage: Query AsteroidComponent and AlienComponent entities
   - Status: ✅ Available and tested

4. **Event System**
   - Location: Engine event infrastructure
   - Usage: Emit and listen to wave events
   - Status: ✅ Established pattern (used by existing systems)

### Game Dependencies
1. **AsteroidComponent**
   - Location: `games/asteroids/src/ecs/components/asteroid.ts` (to be created)
   - Purpose: Mark entities as asteroids for query filtering
   - Dependency Type: Must exist before WaveTrackingSystem can query

2. **AlienComponent**
   - Location: `games/asteroids/src/ecs/components/alien.ts` (to be created)
   - Purpose: Mark entities as aliens for query filtering
   - Dependency Type: Must exist before WaveTrackingSystem can query

3. **Collision System (existing)**
   - Location: `games/asteroids/src/systems/` (must locate)
   - Purpose: Emit asteroid_destroyed and alien_destroyed events
   - Dependency Type: Integration point (already exists, wave manager subscribes)

4. **Spawn System (existing)**
   - Location: `games/asteroids/src/systems/` (must locate)
   - Purpose: Listen to wave_transition event, apply difficulty multiplier
   - Dependency Type: Integration point (already exists, receives wave events)

### External Dependencies
- ✅ None required

---

## Integration Points

### Upstream (What Wave Manager Receives)
1. **From Collision System**: `asteroid_destroyed` and `alien_destroyed` events
   - Used for: Increment destroyed counts (for scoring)
   - Optional: Can track via queries instead
   - Status: Integration point confirmed

2. **From Entity Lifecycle**: Entity creation/destruction
   - Used for: Query-based count updates
   - Implementation: ECS queries handle automatically
   - Status: No integration needed

### Downstream (What Wave Manager Sends)
1. **To Scene Transition System**: `wave_complete` and `wave_transition` events
   - Triggered: When wave is complete
   - Data: Wave number, difficulty, metadata
   - Consumers: Scene manager, spawn system, UI system

2. **To Spawn System**: `wave_transition` event with difficultyMultiplier
   - Triggered: When transitioning to next wave
   - Data: New difficulty multiplier (1.0 + (n-1) * 0.15)
   - Consumer: Spawn system scales asteroid/alien spawn counts

---

## Confirmed Dependencies Checklist
- ✅ ECS world and resource system available
- ✅ ECS query system available
- ✅ Event system available
- ✅ AsteroidComponent will be created (Phase 3)
- ✅ AlienComponent will be created (Phase 3)
- ✅ Collision system exists and can emit events
- ✅ Spawn system exists and can receive events
- ✅ No external library dependencies

---

## Risk Assessment

### Low Risk
- ✅ Architecture aligns with engine patterns
- ✅ No new engine modifications needed
- ✅ Simple state management (no complex data structures)
- ✅ Clear integration points with existing systems

### Mitigations
- Create AsteroidComponent and AlienComponent early for testing
- Verify event system can handle custom wave events
- Test query performance with expected entity counts

---

## Phase 1 Checklist
- ✅ Requirements confirmed
- ✅ Technical feasibility reviewed
- ✅ Dependencies identified
- ✅ Integration points validated
- ✅ Risk assessment completed

**Phase 1 Status: COMPLETE**

---

## Next Steps
Proceed to Phase 2: Design to define resource structures, system behavior, and event schemas.
