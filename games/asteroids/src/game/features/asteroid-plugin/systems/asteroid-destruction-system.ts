import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { AsteroidComponent, type AsteroidSizeTier } from "../components/asteroid.ts";

/**
 * AsteroidDestructionSystem
 * Handles asteroid destruction and respawning of smaller asteroids.
 * - Listens for destruction events
 * - Spawns next-size-tier asteroids when parent is destroyed
 * - Removes destroyed asteroids from world
 * - Tracks score updates
 */
export class AsteroidDestructionSystem {
  private scoreCallback?: (points: number) => void;
  private renderSystem?: any;

  setScoreCallback(callback: (points: number) => void): void {
    this.scoreCallback = callback;
  }

  // Set reference to render system so we can clean up bounding circles on destruction
  setRenderSystem(renderSystem: any): void {
    this.renderSystem = renderSystem;
  }

  update(world: World, _dt: number): void {
    // Check for destruction events
    const destructionEvents = world.getEvents("asteroid_destroyed");

    for (const event of destructionEvents) {
      this.handleDestruction(world, event.data as { asteroidId: GUID; position: [number, number, number] });
    }
  }

  private handleDestruction(
    world: World,
    event: { asteroidId: GUID; position: [number, number, number] },
  ): void {
    const { asteroidId, position } = event;

    // Get asteroid component to determine size tier
    const asteroidComponent = world.get<AsteroidComponent>(asteroidId, AsteroidComponent);

    if (!asteroidComponent) {
      return;
    }

    // Award points based on size tier
    const points = this.getPointsForSize(asteroidComponent.sizeTier);
    if (this.scoreCallback) {
      this.scoreCallback(points);
    }

    // Get next tier and spawn count - use the current component's sizeTier to ensure freshness
    const currentSizeTier = asteroidComponent.sizeTier;
    const nextTier = AsteroidComponent.getNextSizeTier(currentSizeTier);
    const breakCount = AsteroidComponent.getBreakCount(currentSizeTier);

    // Spawn smaller asteroids if applicable
    if (nextTier !== null && breakCount > 0) {
      for (let i = 0; i < breakCount; i++) {
        const spawnX = position[0];
        const spawnY = position[1];
        const spawnZ = position[2];

        // Emit event to spawn asteroid (will be handled by spawner system)
        world.emitEvent("spawn_asteroid", {
          position: [spawnX, spawnY, spawnZ] as [number, number, number],
          sizeTier: nextTier,
        });
      }
    }

    // Clear any visuals associated with this asteroid (mesh and bounding circle)
    // This is important to prevent reusing circles from recycled entity IDs
    if (this.renderSystem) {
      this.renderSystem.clearEntityVisuals(asteroidId);
    }

    // Remove destroyed asteroid from world
    world.destroyEntity(asteroidId);
  }

  /**
   * Get points awarded for destroying an asteroid of given size
   */
  private getPointsForSize(sizeTier: AsteroidSizeTier): number {
    switch (sizeTier) {
      case 3:
        return 20; // Large
      case 2:
        return 50; // Medium
      case 1:
        return 100; // Small
    }
  }
}
