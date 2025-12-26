import type { World } from "@engine/core/world.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { AsteroidComponent } from "../components/asteroid.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * AsteroidFadeInSystem
 * Fades in asteroids when a wave starts or transitions.
 * - Listens for entering_zone_effect_complete event
 * - Animates asteroid opacity from 0 to 1 over duration
 * - Creates smooth visual transition as asteroids appear
 */
export class AsteroidFadeInSystem {
  private fadingAsteroids = new Map<number, { startTime: number; duration: number }>();
  private effectCompleteListener?: (event: WorldEvent) => void;
  private fadeDuration: number = 2000; // milliseconds

  constructor(fadeDuration: number = 1000) {
    this.fadeDuration = fadeDuration;
  }

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    this.effectCompleteListener = (event) => {
      this.onEnteringZoneEffectComplete(world, event);
    };

    world.onEvent("entering_zone_effect_complete", this.effectCompleteListener);
  }

  /**
   * Update method - called each frame to update asteroid opacity
   */
  update(world: World, _dt: number): void {
    const currentTime = performance.now();
    const asteroidEntities = world.query(AsteroidComponent).entities();

    for (const entity of asteroidEntities) {
      const material = world.get<BasicMaterial>(entity, BasicMaterial);
      if (!material) continue;

      const fadeInfo = this.fadingAsteroids.get(entity as unknown as number);
      if (!fadeInfo) continue;

      // Calculate fade progress (0 to 1)
      const elapsed = currentTime - fadeInfo.startTime;
      const progress = Math.min(elapsed / fadeInfo.duration, 1);

      // Update opacity
      material.opacity = progress;

      // Remove from tracking when complete
      if (progress >= 1) {
        this.fadingAsteroids.delete(entity as unknown as number);
      }
    }
  }

  /**
   * Handle entering_zone_effect_complete event - start fading in all asteroids
   */
  private onEnteringZoneEffectComplete(world: World, _event: WorldEvent): void {
    const currentTime = performance.now();
    const asteroidEntities = world.query(AsteroidComponent).entities();

    for (const entity of asteroidEntities) {
      const material = world.get<BasicMaterial>(entity, BasicMaterial);

      if (!material) continue;

      // Reset opacity to 0 for fade-in animation
      material.opacity = 0;

      // Track this asteroid for fade-in
      this.fadingAsteroids.set(entity as unknown as number, {
        startTime: currentTime,
        duration: this.fadeDuration,
      });
    }
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.effectCompleteListener = undefined;
    this.fadingAsteroids.clear();
  }
}
