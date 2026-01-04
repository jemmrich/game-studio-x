import type { World } from "@engine/core/world.ts";
import * as THREE from "three";
import { EnteringZoneEffectComponent } from "../components/entering-zone-effect.ts";
import { AudioSystem } from "../../../systems/audio-system.ts";

interface WorldEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Fade animation constants (as fractions of total animation duration)
 * Adjust these to control how quickly particles fade in and out
 */
const FADE_IN_START = 0.0;      // When fade in begins (0 = at start)
const FADE_IN_END = 0.20;       // When fade in completes (20% of animation)
const FADE_OUT_START = 0.70;    // When fade out begins (70% of animation)
const FADE_OUT_END = 1.0;       // When fade out completes (1.0 = at end)

/**
 * Configuration for the entering zone effect system
 */
export interface EnteringZoneEffectConfig {
  /** Number of particles to spawn (default: 200) */
  particleCount: number;
  /** Size of each particle in THREE.js units (default: 0.5) */
  particleSize: number;
  /** Total animation duration in milliseconds (default: 3000) */
  animationDuration: number;
  /** Spread of particles from origin in world units (default: 100) */
  particleSpread: number;
  /** Easing acceleration factor (default: 2.0) */
  acceleration: number;
  /** Progress (0-1) at which fade-out begins (default: 0.7) */
  fadeOutStart: number;
}

/**
 * EnteringZoneEffectSystem
 * Listens for entering_zone events and creates particle animations
 * 
 * Behavior:
 * - On entering_zone event: spawns particles and effect entity
 * - Each frame: animates particles toward camera with easing
 * - On completion: removes effect entity and emits entering_zone_effect_complete event
 */
export class EnteringZoneEffectSystem {
  private config: EnteringZoneEffectConfig;
  private threeScene: THREE.Scene;
  private enteringZoneListener?: (event: WorldEvent) => void;
  private isCreatingEffect = false;

  constructor(
    threeScene: THREE.Scene,
    _camera: THREE.PerspectiveCamera,
    config: Partial<EnteringZoneEffectConfig> = {},
  ) {
    this.threeScene = threeScene;
    this.config = {
      particleCount: 8000, // Increased to match old warp effect
      particleSize: 0.5,
      animationDuration: 4000,
      particleSpread: 200,
      acceleration: 0.012, // Speed of particle movement
      fadeOutStart: 0.7,
      ...config,
    };
  }

  /**
   * Setup event listeners during initialization
   */
  setup(world: World): void {
    if (this.enteringZoneListener) {
      return;
    }

    this.enteringZoneListener = (event) => {
      this.onEnteringZone(world, event);
    };

    world.onEvent("entering_zone", this.enteringZoneListener);
  }

  /**
   * Update method - called each frame
   * Handles animation and cleanup of effect entities
   */
  update(world: World, _dt: number): void {
    const currentTime = performance.now();

    // Find all entities with EnteringZoneEffectComponent
    const effectEntities = world.query(EnteringZoneEffectComponent).entities();

    for (const entity of effectEntities) {
      const effect = world.get<EnteringZoneEffectComponent>(
        entity,
        EnteringZoneEffectComponent,
      );

      if (!effect) continue;

      // Calculate animation progress (0 to 1)
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1);

      // Debug logging
      if (elapsed % 500 < 16) { // Log roughly every 500ms
        const material = effect.particleMesh?.material as THREE.PointsMaterial | undefined;
        const opacity = material?.opacity.toFixed(2) || 'N/A';
        // console.log(`[EnteringZoneEffect] Progress: ${(progress * 100).toFixed(1)}% | Elapsed: ${elapsed.toFixed(0)}ms / ${effect.duration}ms | Opacity: ${opacity}`);
      }

      // Update audio volume with fade in/out
      if (effect.audioElement && !effect.audioElement.paused) {
        let volumeFactor = 1.0;
        
        // Fade in during first 20% of animation
        if (progress < FADE_IN_END) {
          volumeFactor = progress / FADE_IN_END;
        }
        // Fade out during last 30% of animation
        else if (progress > FADE_OUT_START) {
          volumeFactor = 1.0 - ((progress - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START));
        }
        
        effect.audioElement.volume = effect.maxAudioVolume * volumeFactor;
      }

      // Update particle positions and opacity
      this.updateParticleEffect(effect, progress);

      // Check if animation is complete
      if (progress >= 1) {
        console.log("[EnteringZoneEffect] Animation complete");
        
        // Stop and cleanup audio
        if (effect.audioElement) {
          effect.audioElement.pause();
          effect.audioElement.currentTime = 0;
          effect.audioElement = null;
        }
        
        // Clean up
        if (effect.particleMesh) {
          this.threeScene.remove(effect.particleMesh);
        }
        if (effect.particleGeometry) {
          effect.particleGeometry.dispose();
        }
        if (effect.particleMesh) {
          const material = effect.particleMesh.material as THREE.Material;
          material.dispose();
        }

        // Remove entity from world
        world.destroyEntity(entity);

        // Note: entering_zone_effect_complete event is emitted by EnteringZoneScene.dispose()
        // when the scene is popped from the stack, not here. This keeps scene lifecycle
        // management centralized in the scene manager.
      }
    }
  }

  /**
   * Handle entering_zone event
   */
  private onEnteringZone(world: World, event: WorldEvent): void {
    if (this.isCreatingEffect) {
      return;
    }

    this.isCreatingEffect = true;

    try {
      const zoneNumber = event.data.zoneNumber as number;

      // Play warp sound with fade control
      const audioElement = AudioSystem.playSoundWithFade(world, 'warp', 0.0);

      // Create effect entity
      const entity = world.createEntity();

      // Create and initialize particles
      const { geometry, mesh, positions, velocities } = this.createParticles();

      const startTime = performance.now();

      // Create effect component and assign properties
      const effect = new EnteringZoneEffectComponent();
      
      effect.zoneNumber = zoneNumber;
      effect.startTime = startTime;
      effect.duration = this.config.animationDuration;
      effect.particlePositions = positions as Float32Array<ArrayBuffer>;
      effect.particleVelocities = velocities as Float32Array<ArrayBuffer>;
      effect.particleGeometry = geometry;
      effect.particleMesh = mesh;
      effect.particleSpread = this.config.particleSpread;
      effect.acceleration = this.config.acceleration;
      effect.fadeOutStart = this.config.fadeOutStart;
      effect.audioElement = audioElement;
      effect.maxAudioVolume = 0.7;

      // Attach component to entity
      world.add(entity, effect);

      // Add mesh to THREE.js scene
      try {
        this.threeScene.add(mesh);
      } catch (meshError) {
        console.error("[EnteringZoneEffectSystem] Error adding mesh to scene:", meshError);
      }
    } catch (error) {
      console.error("[EnteringZoneEffectSystem] Error in onEnteringZone:", error);
      console.error("[EnteringZoneEffectSystem] Stack:", (error as Error).stack);
      // Don't rethrow - component was added successfully, mesh add is optional
    } finally {
      this.isCreatingEffect = false;
    }
  }

  /**
   * Create particle geometry and mesh
   */
  private createParticles(): {
    geometry: THREE.BufferGeometry;
    mesh: THREE.Points;
    positions: Float32Array;
    velocities: Float32Array;
  } {
    const geometry = new THREE.BufferGeometry();
    const positions = this.generateParticlePositions();
    const velocities = new Float32Array(this.config.particleCount);
    velocities.fill(0); // All particles start with zero velocity

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Create particle material
    const material = new THREE.PointsMaterial({
      size: this.config.particleSize,
      color: 0xffffff, // White like the old effect
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.0, // Start fully transparent - will fade in during animation
    });

    const mesh = new THREE.Points(geometry, material);
    return { geometry, mesh, positions, velocities };
  }

  /**
   * Generate random particle positions
   * Distributes particles randomly throughout the camera's view volume
   * Matches the old warp effect positioning
   */
  private generateParticlePositions(): Float32Array {
    const positions = new Float32Array(this.config.particleCount * 3);
    const spread = this.config.particleSpread;

    for (let i = 0; i < this.config.particleCount; i++) {
      // Random position in XY plane within spread, matching old effect
      const posX = Math.ceil(Math.random() * spread) * (Math.round(Math.random()) ? 1 : -1);
      const posY = Math.ceil(Math.random() * spread) * (Math.round(Math.random()) ? 1 : -1);
      
      // Random Z starting far behind camera, matching old effect (z=-250 to z=0)
      const posZ = Math.ceil(Math.random() * 250) * (Math.round(Math.random()) ? 1 : -1);

      positions[i * 3] = posX;
      positions[i * 3 + 1] = posY;
      positions[i * 3 + 2] = posZ;
    }

    return positions;
  }

  /**
   * Update particle positions using per-particle velocity accumulation
   * Matches the old warp effect's acceleration-based movement model
   */
  private updateParticleEffect(
    effect: EnteringZoneEffectComponent,
    progress: number,
  ): void {
    if (!effect.particleGeometry || !effect.particleMesh) return;

    // Get position attribute
    const positionAttribute = effect.particleGeometry.getAttribute("position");
    const positions = positionAttribute.array as Float32Array;

    // Update each particle using velocity accumulation
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;

      // Accumulate velocity (acceleration-based movement)
      effect.particleVelocities[i] += effect.acceleration;

      // Get current position
      let posZ = positions[i3 + 2];
      
      // Update Z position with accumulated velocity
      posZ += effect.particleVelocities[i];

      // Reset particle when it passes through camera (Z > 200)
      // This creates the infinite warp effect
      if (posZ > 200) {
        // Reset to initial position
        const initialX = effect.particlePositions[i3];
        const initialY = effect.particlePositions[i3 + 1];
        const initialZ = effect.particlePositions[i3 + 2];
        
        positions[i3] = initialX;
        positions[i3 + 1] = initialY;
        positions[i3 + 2] = initialZ;
        
        // Reset velocity for next cycle
        effect.particleVelocities[i] = 0;
      } else {
        // Update Z position
        positions[i3 + 2] = posZ;
      }
    }

    // Mark attributes as needing update
    positionAttribute.needsUpdate = true;

    // Update material opacity for fade in/out effect
    if (effect.particleMesh) {
      const material = effect.particleMesh.material as THREE.PointsMaterial;
      
      // Fade in phase
      if (progress < FADE_IN_END) {
        const fadeInProgress = (progress - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
        material.opacity = fadeInProgress;
      }
      // Fade out phase
      else if (progress > FADE_OUT_START) {
        const fadeOutProgress = (progress - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
        material.opacity = Math.max(0, 1.0 - fadeOutProgress);
      }
      // Full opacity in the middle
      else {
        material.opacity = 1.0;
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.enteringZoneListener = undefined;
  }
}
