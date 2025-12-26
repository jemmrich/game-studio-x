import type { World } from "@engine/core/world.ts";
import * as THREE from "three";

/**
 * System that renders the Three.js scene to the canvas
 */
export class RendererSystem {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor(scene: THREE.Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);

    // Create perspective camera positioned to see the game area
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      60,  // Narrow FOV to see more of the scene at once
      width / height,
      0.1,
      1000
    );
    
    // Position camera above the origin looking down
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  update(_world: World, _dt: number): void {
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Keep camera positioned above the origin
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setSize(width, height);
  }

  dispose(): void {
    this.renderer.dispose();
  }

  /**
   * Get the camera for use by other systems
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
