# Tech Debt: Consolidate Game Stats into GameStats Resource

**Status**: Proposed  
**Created**: January 5, 2026  
**Priority**: Medium  
**Effort**: 3-4 hours  

## Problem Statement

Game state is currently scattered across multiple sources:
- `ShipComponent.lives` - player lives
- `WaveManager.asteroidsDestroyedThisWave` / `aliensDestroyedThisWave` - destruction counts
- Individual systems track statistics inconsistently
- HUD component polls various sources to render state
- No centralized game statistics tracking

**Goal**: Enable leaderboard tracking with comprehensive session statistics that capture player performance and playstyle.

This creates:
1. **Tight Coupling**: UI components poll multiple sources
2. **Inconsistent Tracking**: Stats tracked in different places with different patterns
3. **Scalability Issues**: Adding new stats requires modifying multiple systems
4. **Debugging Difficulty**: Hard to see complete game state in one place
5. **Leaderboard Blocker**: No clean way to capture and serialize session stats for submission

## Proposed Solution

Create a centralized `GameStats` resource to track all player/game statistics in one place.

### GameStats Resource

**Location**: `src/game/features/game-stats-plugin/resources/game-stats.ts`

```typescript
/**
 * GameStats Resource
 * Centralized tracking of all game statistics and player state
 * Single source of truth for game progress and performance metrics
 */
export interface GameStatsOptions {
  startingLives?: number;
  startingScore?: number;
}

export class GameStats {
  // Lives System
  currentLives: number;
  bonusLives: number;
  totalDeaths: number;

  // Score
  currentScore: number;

  // Weapon Stats
  totalMissilesFired: number;
  totalMissileHits: number;
  totalHyperjumpsUsed: number;

  // Bonus Life Tracking
  bonusLifeThreshold: number = 10000; // Extra life every 10,000 points
  lastBonusLifeScore: number = 0;

  // Death Tracking
  deathsByAsteroid: number;
  deathsBySmallAlien: number;
  deathsByLargeAlien: number;

  // Destruction Tracking
  totalLargeAliensKilled: number;
  totalSmallAliensKilled: number;
  totalLargeAsteroidsDestroyed: number;
  totalMediumAsteroidsDestroyed: number;
  totalSmallAsteroidsDestroyed: number;

  // Wave Metrics
  highWaterMarkAsteroidsInWave: number;

  // Timing
  gameStartTimestamp: number;
  gameEndTimestamp: number | null;

  constructor(options?: GameStatsOptions) {
    const {
      startingLives = 3,
      startingScore = 0,
    } = options || {};

    this.currentLives = startingLives;
    this.bonusLives = 0;
    this.totalDeaths = 0;
    this.currentScore = startingScore;
    this.totalMissilesFired = 0;
    this.totalMissileHits = 0;
    this.totalHyperjumpsUsed = 0;

    this.deathsByAsteroid = 0;
    this.deathsBySmallAlien = 0;
    this.deathsByLargeAlien = 0;

    this.totalLargeAliensKilled = 0;
    this.totalSmallAliensKilled = 0;
    this.totalLargeAsteroidsDestroyed = 0;
    this.totalMediumAsteroidsDestroyed = 0;
    this.totalSmallAsteroidsDestroyed = 0;

    this.highWaterMarkAsteroidsInWave = 0;

    this.gameStartTimestamp = Date.now();
    this.gameEndTimestamp = null;
  }

  // Life Management
  loseLife(): void {
    if (this.currentLives > 0) {
      this.currentLives--;
      this.totalDeaths++;
    }
  }

  gainLife(): void {
    this.currentLives++;
  }

  gainBonusLife(): void {
    this.bonusLives++;
    this.gainLife();
  }

  isGameOver(): boolean {
    return this.currentLives <= 0;
  }

  // Score Management
  addScore(points: number): void {
    this.currentScore += points;
    this.checkBonusLifeThreshold();
  }

  checkBonusLifeThreshold(): void {
    while (this.currentScore >= this.lastBonusLifeScore + this.bonusLifeThreshold) {
      this.lastBonusLifeScore += this.bonusLifeThreshold;
      this.gainBonusLife();
    }
  }

  // Destruction with automatic scoring
  destroyLargeAsteroid(): void {
    this.recordLargeAsteroidDestroyed();
    this.addScore(20); // Base points for large asteroid
  }

  destroyMediumAsteroid(): void {
    this.recordMediumAsteroidDestroyed();
    this.addScore(50); // More points for medium
  }

  destroySmallAsteroid(): void {
    this.recordSmallAsteroidDestroyed();
    this.addScore(100); // Most points for small
  }

  killLargeAlien(): void {
    this.recordLargeAliensKilled();
    this.addScore(200); // High value target
  }

  killSmallAlien(): void {
    this.recordSmallAliensKilled();
    this.addScore(1000); // Very high value, harder to hit
  }

  // Tracking Methods
  recordMissileFired(): void {
    this.totalMissilesFired++;
  }

  recordMissileHit(): void {
    this.totalMissileHits++;
  }

  getAccuracy(): number {
    if (this.totalMissilesFired === 0) return 0;
    return (this.totalMissileHits / this.totalMissilesFired) * 100;
  }

  recordHyperjump(): void {
    this.totalHyperjumpsUsed++;
  }

  recordDeathByAsteroid(): void {
    this.deathsByAsteroid++;
    this.loseLife();
  }

  recordDeathBySmallAlien(): void {
    this.deathsBySmallAlien++;
    this.loseLife();
  }

  recordDeathByLargeAlien(): void {
    this.deathsByLargeAlien++;
    this.loseLife();
  }

  recordLargeAlienKilled(): void {
    this.totalLargeAliensKilled++;
  }

  recordSmallAlienKilled(): void {
    this.totalSmallAliensKilled++;
  }

  recordLargeAsteroidDestroyed(): void {
    this.totalLargeAsteroidsDestroyed++;
  }

  recordMediumAsteroidDestroyed(): void {
    this.totalMediumAsteroidsDestroyed++;
  }

  recordSmallAsteroidDestroyed(): void {
    this.totalSmallAsteroidsDestroyed++;
  }

  updateHighWaterMark(asteroidCount: number): void {
    this.highWaterMarkAsteroidsInWave = Math.max(
      this.highWaterMarkAsteroidsInWave,
      asteroidCount
    );
  }

  endGame(): void {
    this.gameEndTimestamp = Date.now();
  }

  getGameDuration(): number {
    const endTime = this.gameEndTimestamp || Date.now();
    return endTime - this.gameStartTimestamp;
  }

  reset(options?: GameStatsOptions): void {
    const newStats = new GameStats(options);
    Object.assign(this, newStats);
  }
}
```

## Scoring System

All destruction events automatically award points and trigger bonus life checks:

| Entity | Points | Mechanic |
|--------|--------|----------|
| Large Asteroid | 20 pts | Breaks into 2 medium asteroids |
| Medium Asteroid | 50 pts | Breaks into 2 small asteroids |
| Small Asteroid | 100 pts | Fully destroyed |
| Large Saucer | 200 pts | Fires randomly |
| Small Saucer | 1,000 pts | Fires accurately at player |
| **Bonus Life** | Every 10,000 pts | Awards extra life at each threshold |

## Planned Future Stats

The following statistics are candidates for future implementation to provide deeper player insights:

### Close Calls Tracking
- **Definition**: Instances where player narrowly avoids collision (e.g., within 2 pixels of asteroid/alien)
- **Use Case**: Playtesting feedback, difficulty tuning, player skill assessment
- **Implementation**: `closeCalls: number` + method to increment when near-miss collision detected
- **UI Display**: Show in DebugInfo and potentially in post-game summary

### Distance Traveled
- **Definition**: Total distance player ship has traversed during the game session
- **Use Case**: Engagement metric, leaderboard secondary metric, movement pattern analysis
- **Implementation**: 
  - Track `previousPosition` each frame
  - Calculate distance: `magnitude(currentPosition - previousPosition)`
  - Accumulate in `totalDistanceTraveled: number`
- **UI Display**: Show in DebugInfo, final stats screen, and leaderboard details

These stats will be particularly useful for:
1. **Difficulty Analysis**: Close calls indicate how challenging the current wave is
2. **Player Engagement**: Distance traveled shows how active/mobile the player is
3. **Leaderboard Depth**: Secondary metrics for comparing similar scores
4. **Replay Analysis**: Correlate playstyle (mobile vs stationary) with performance



### Recommended: Direct Resource Access

Systems should **directly access and update GameStats** when events occur. This is simpler, more performant, and maintains loose coupling.

**Why direct resource access?**
1. **Simplicity**: No intermediate event layer needed
2. **Performance**: Direct calls vs. event queue/listener overhead (matters when many collisions happen per frame)
3. **Clarity**: Stats update at point of logic, not through async listeners
4. **Minimal Coupling**: GameStats is just a data container—accessing it doesn't couple systems
5. **Maintainability**: Events can get messy with many event types; direct calls are explicit

**Example Pattern:**

```typescript
// Collision system detects missile hit
// Simple, direct update
export class MissileCollisionSystem {
  update(world: World, deltaTime: number): void {
    const gameStats = world.getResource<GameStats>("gameStats")!;
    const missiles = this.missileQuery.entities();
    const asteroids = this.asteroidQuery.entities();

    for (const missileEntity of missiles) {
      for (const asteroidEntity of asteroids) {
        if (this.checkCollision(missileEntity, asteroidEntity, world)) {
          // Direct update - no event indirection needed
          gameStats.recordMissileHit();
          gameStats.recordLargeAsteroidDestroyed();
          
          // Then destroy entities as normal
          world.despawn(missileEntity);
          world.despawn(asteroidEntity);
        }
      }
    }
  }
}

// Similar pattern for other systems
export class PlayerDeathSystem {
  update(world: World, deltaTime: number): void {
    const gameStats = world.getResource<GameStats>("gameStats")!;
    
    const collisions = this.detectPlayerCollisions(world);
    for (const collision of collisions) {
      if (collision.withAsteroid) {
        gameStats.recordDeathByAsteroid();
      } else if (collision.withAlien) {
        gameStats.recordDeathByLargeAlien(); // or Small
      }
    }
  }
}
```

**When is direct resource access NOT appropriate?**

Only use events for **cross-system coordination** where:
- One system needs to trigger behavior in a completely different system
- The communication isn't about simple state updates
- You want systems to be independently testable without knowing about each other

Example: Wave completion should emit an event → triggers scene transition, UI update, etc.

**For GameStats: Use Direct Access**

Since GameStats is purely a data container for metrics, systems should update it directly. This keeps the codebase simpler and more performant.

## DebugInfo Component Integration

The `DebugInfo` component should display comprehensive GameStats information for developer debugging and playtesting.

**Debug Display:**

```typescript
// src/ui/components/debug/DebugInfo.tsx
export const DebugInfo: React.FC<DebugInfoProps> = ({ world, isVisible }) => {
  const gameStats = world.getResource<GameStats>("gameStats");

  if (!isVisible || !gameStats) return null;

  return (
    <div className="debug-panel">
      <h3>Game Stats</h3>
      
      <section>
        <h4>Lives & Score</h4>
        <div>Lives: {gameStats.currentLives}</div>
        <div>Bonus Lives: {gameStats.bonusLives}</div>
        <div>Score: {gameStats.currentScore}</div>
        <div>Deaths: {gameStats.totalDeaths}</div>
      </section>

      <section>
        <h4>Weapon Accuracy</h4>
        <div>Missiles Fired: {gameStats.totalMissilesFired}</div>
        <div>Missiles Hit: {gameStats.totalMissileHits}</div>
        <div>Accuracy: {gameStats.getAccuracy().toFixed(1)}%</div>
        <div>Missed: {gameStats.totalMissilesFired - gameStats.totalMissileHits}</div>
      </section>

      <section>
        <h4>Destruction Stats</h4>
        <div>Large Asteroids: {gameStats.totalLargeAsteroidsDestroyed}</div>
        <div>Medium Asteroids: {gameStats.totalMediumAsteroidsDestroyed}</div>
        <div>Small Asteroids: {gameStats.totalSmallAsteroidsDestroyed}</div>
        <div>Large Aliens: {gameStats.totalLargeAliensKilled}</div>
        <div>Small Aliens: {gameStats.totalSmallAliensKilled}</div>
      </section>

      <section>
        <h4>Death Breakdown</h4>
        <div>By Asteroid: {gameStats.deathsByAsteroid}</div>
        <div>By Small Alien: {gameStats.deathsBySmallAlien}</div>
        <div>By Large Alien: {gameStats.deathsByLargeAlien}</div>
      </section>

      <section>
        <h4>Gameplay</h4>
        <div>Hyperjumps Used: {gameStats.totalHyperjumpsUsed}</div>
        <div>Asteroid High Water Mark: {gameStats.highWaterMarkAsteroidsInWave}</div>
        <div>Game Duration: {(gameStats.getGameDuration() / 1000).toFixed(1)}s</div>
      </section>
    </div>
  );
};
```

This makes it easy to:
- Monitor stats in real-time during playtesting
- Verify stat tracking is working correctly
- Check accuracy and efficiency metrics
- Debug death causes and destruction counts

## Implementation Plan

### Phase 1: Create GameStats Resource
- [x] Create `GameStats` resource class
- [x] Add unit tests for stat tracking methods (41/41 tests passing)
- [x] Add `GameStatsPlugin` to register resource in world

### Phase 2: Update ShipComponent
- [x] Remove `lives` property from `ShipComponent`
- [x] Remove lives initialization from constructor
- [x] Update any code reading `ship.lives`

### Phase 3: Update Systems
- [x] Update collision systems to call `gameStats.recordDeathByAsteroid()`, etc.
- [x] Update asteroid destruction to call `gameStats.recordXAsteroidDestroyed()`
- [x] Update missile system to call `gameStats.recordMissileFired()`
- [x] Update missile collision system to track hits with `gameStats.recordMissileHit()`

### Phase 4: Update WaveManager
- [x] Remove `asteroidsDestroyedThisWave` and `aliensDestroyedThisWave` (use GameStats instead)
- [x] Update `WaveTrackingSystem` to use GameStats

### Phase 5: Update UI Components
- [x] Update `Hud.tsx` to read from `gameStats` resource instead of polling `ShipComponent`
- [x] Ensure HUD updates with resource listener pattern

### Phase 6: Testing & Cleanup
- [x] Run all tests
- [x] Integration test with full game flow
- [x] Update documentation

## Affected Files

### New Files
- `src/game/features/game-stats-plugin/resources/game-stats.ts`
- `src/game/features/game-stats-plugin/resources/game-stats.test.ts`
- `src/game/features/game-stats-plugin/mod.ts`

### Modified Files
- `src/game/features/ship-plugin/components/ship.ts` - Remove `lives` property
- `src/game/features/ship-plugin/systems/collision-system.ts` - Call GameStats methods
- `src/game/features/alien-plugin/systems/alien-destruction-system.ts` - Call GameStats methods
- `src/game/features/asteroid-plugin/systems/asteroid-destruction-system.ts` - Call GameStats methods
- `src/game/features/ship-plugin/systems/missile-system.ts` - Track fired missiles
- `src/game/features/wave-manager-plugin/systems/wave-tracking-system.ts` - Update high water mark
- `src/game/features/wave-manager-plugin/resources/wave-manager.ts` - Remove destruction counts
- `src/ui/components/hud/Hud.tsx` - Read from GameStats resource
- `src/ui/components/debug/DebugInfo.tsx` - Display comprehensive GameStats
- `src/main.tsx` - Initialize GameStats resource

## Benefits

1. **Single Source of Truth**: All game stats in one place
2. **Easier to Debug**: Can inspect GameStats to see complete game state
3. **Better Testability**: GameStats methods are easy to test independently
4. **Scalability**: Easy to add new stats without modifying multiple systems
5. **UI Decoupling**: HUD no longer needs to know about ShipComponent
6. **Analytics Ready**: Centralized stats make it easy to add analytics/telemetry

## Timeline

- **Phase 1-2**: 30 minutes
- **Phase 3**: 1 hour (updating multiple systems)
- **Phase 4**: 30 minutes
- **Phase 5**: 45 minutes
- **Phase 6**: 30 minutes

**Total**: 3-4 hours

## Leaderboard Integration
Accuracy: `totalMissileHits / totalMissilesFired * 100`
- Missiles Missed: `totalMissilesFired - totalMissileHits`

Once GameStats is implemented, the next phase will add leaderboard support:

### Primary Leaderboard Metrics
- **Score**: `currentScore` (primary ranking metric)
- **Waves Survived**: `waveManager.currentWaveNumber` (secondary ranking)
- **Game Duration**: `gameEndTimestamp - gameStartTimestamp`

### Secondary Metrics (for detailed leaderboard viewing)
- Efficiency: `totalAsteroidsDestroyed / totalMissilesFired`
- Alien Kill Rate: `totalAliensKilled / totalDeaths`
- Hyperjump Count: `totalHyperjumpsUsed`
- High Water Mark: `highWaterMarkAsteroidsInWave`

### Serialization Methods (to implement in Phase 1)
```typescript
// Serialize stats for leaderboard submission
toLeaderboardEntry(): LeaderboardEntry {
  return {
    score: this.currentScore,
    wavesSurvived: this.currentWaveNumber,
    duration: this.getGameDuration(),
    timestamp: this.gameEndTimestamp || Date.now(),
    stats: this.toJSON(),
  };
}

// Convert to JSON for storage/transmission
toJSON(): object {
  return {
    currentLives: this.currentLives,
    bonusLives: this.bonusLives,
    totalDeaths: this.totalDeaths,
    currentScore: this.currentScore,
    totalMissilesFired: this.totalMissilesFired,
    totalHyperjumpsUsed: this.totalHyperjumpsUsed,
    // ... all other stats
  };
}

// Restore from stored stats
static fromJSON(data: any): GameStats {
  const stats = new GameStats();
  Object.assign(stats, data);
  return stats;
}
```

## Notes

- Should we track `lives` in GameStats or keep it separate? Lives are tied to the player's current session state, but stats are broader. Keeping them together makes the UI simpler.
- Serialization methods should be added in Phase 1 to support future leaderboard integration
- Consider adding a `playerName` or `playerId` field if not handled elsewhere
- This opens the door for leaderboards, replays, detailed analytics, and player statistics tracking
