import * as THREE from "three";

/**
 * Component for managing the entering zone effect
 * Attached to an ephemeral entity that manages particle animation
 */
export class EnteringZoneEffectComponent {
  zoneNumber = 0;
  startTime = 0;
  duration = 0;
  particlePositions = new Float32Array();
  particleVelocities = new Float32Array(); // Per-particle velocity for acceleration
  particleGeometry: THREE.BufferGeometry | null = null;
  particleMesh: THREE.Points | null = null;
  particleSpread = 0;
  acceleration = 0;
  fadeOutStart = 0;
  audioElement: HTMLAudioElement | null = null; // For fading warp sound
  maxAudioVolume = 0.7; // Maximum volume for the audio
}
