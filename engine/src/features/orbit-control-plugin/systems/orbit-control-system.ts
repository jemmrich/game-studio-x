// This file uses Three.js which is available at runtime in consuming applications
// but may not be resolvable when type-checking the engine in isolation
import type { World } from "../../../core/world.ts";
import { OrbitControls } from "../controls/OrbitControls.ts";
import type { PerspectiveCamera } from "../../../three.ts";
import { Vector3, PerspectiveCamera as ThreePerspectiveCamera } from "../../../three.ts";
import { CameraState } from "../../render-plugin/resources/camera-state.ts";
import { OrbitControlConfig } from "../resources/orbit-control-config.ts";
import type { HTMLCanvasElement } from "../../render-plugin/types.ts";

/**
 * System that manages OrbitControls and synchronizes camera state
 * with the engine's CameraState resource.
 *
 * Execution Order:
 * - Runs BEFORE CameraUpdateSystem
 * - Updates OrbitControls and syncs to CameraState
 * - CameraUpdateSystem then updates view/projection matrices
 */
export class OrbitControlSystem {
  enabled: boolean = true;
  private controls: any = null; // OrbitControls instance
  private threeCamera: PerspectiveCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private resizeObserver: any = null; // ResizeObserver (browser API)
  private onWindowResize: ((this: Window, ev: Event) => any) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initialize the orbit controls system
   * Called once when the system is added to the world
   */
  init(world: World): void {
    if (!this.canvas) {
      return;
    }

    let cameraState: CameraState | undefined;
    let config: OrbitControlConfig | undefined;

    try {
      cameraState = world.getResource<CameraState>("CameraState");
    } catch {
      // CameraState not found
    }

    try {
      config = world.getResource<OrbitControlConfig>("OrbitControlConfig");
    } catch {
      // OrbitControlConfig not found
    }

    if (!cameraState) {
      return;
    }

    if (!config) {
      return;
    }

    // Create a Three.js perspective camera from the engine's CameraState
    const camera = new ThreePerspectiveCamera(
      cameraState.fov,
      cameraState.aspectRatio,
      cameraState.near,
      cameraState.far
    );

    camera.position.set(
      cameraState.position[0],
      cameraState.position[1],
      cameraState.position[2]
    );

    camera.up.set(
      cameraState.up[0],
      cameraState.up[1],
      cameraState.up[2]
    );

    this.threeCamera = camera;

    // Create OrbitControls instance
    // Cast canvas to any because Three.js expects full HTMLElement interface
    // but our minimal type only has the essential properties
    this.controls = new OrbitControls(camera, this.canvas as any);

    // Set initial target
    this.controls.target.set(
      cameraState.target[0],
      cameraState.target[1],
      cameraState.target[2]
    );

    // Apply configuration
    this.applyConfig(config);

    // Handle canvas resize events
    this.setupResizeHandling();

    // Perform initial update
    this.controls.update();


  }

  /**
   * Update the orbit controls and sync camera state
   * Called every frame
   */
  update(world: World, _dt: number): void {
    if (!this.controls || !this.threeCamera || !this.enabled) {
      return;
    }

    let cameraState: CameraState | undefined;
    let config: OrbitControlConfig | undefined;

    try {
      cameraState = world.getResource<CameraState>("CameraState");
    } catch {
      // CameraState not found
    }

    try {
      config = world.getResource<OrbitControlConfig>("OrbitControlConfig");
    } catch {
      // OrbitControlConfig not found
    }

    if (!cameraState || !config) {
      return;
    }

    // Check if config was disabled
    if (!config.enabled) {
      return;
    }

    // Update orbit controls (handles damping, auto-rotate, etc.)
    this.controls.update();

    // Sync Three.js camera back to CameraState
    cameraState.position = [
      this.threeCamera.position.x,
      this.threeCamera.position.y,
      this.threeCamera.position.z,
    ];

    cameraState.target = [
      this.controls.target.x,
      this.controls.target.y,
      this.controls.target.z,
    ];

    // Update up vector (in case it changed)
    cameraState.up = [
      this.threeCamera.up.x,
      this.threeCamera.up.y,
      this.threeCamera.up.z,
    ];
  }

  /**
   * Apply configuration to the orbit controls
   */
  private applyConfig(config: OrbitControlConfig): void {
    if (!this.controls) return;

    this.controls.enableDamping = config.enableDamping;
    this.controls.dampingFactor = config.dampingFactor;
    this.controls.minDistance = config.minDistance;
    this.controls.maxDistance = config.maxDistance;
    this.controls.minPolarAngle = config.minPolarAngle;
    this.controls.maxPolarAngle = config.maxPolarAngle;
    this.controls.minAzimuthAngle = config.minAzimuthAngle;
    this.controls.maxAzimuthAngle = config.maxAzimuthAngle;
    this.controls.rotateSpeed = config.rotateSpeed;
    this.controls.panSpeed = config.panSpeed;
    this.controls.zoomSpeed = config.zoomSpeed;
    this.controls.autoRotate = config.autoRotate;
    this.controls.autoRotateSpeed = config.autoRotateSpeed;
    this.controls.enablePan = config.enablePan;
    this.controls.enableZoom = config.enableZoom;
    this.controls.enableRotate = config.enableRotate;
  }

  /**
   * Setup canvas resize handling
   * Updates aspect ratio when canvas size changes
   */
  private setupResizeHandling(): void {
    if (!this.canvas || !this.threeCamera) return;

    // Handle window resize (only if window object is available, e.g., in browser)
    this.onWindowResize = () => {
      this.updateAspectRatio();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onWindowResize);
    }

    // Try to use ResizeObserver for canvas-specific resize detection
    if (typeof (globalThis as any).ResizeObserver !== "undefined") {
      this.resizeObserver = new (globalThis as any).ResizeObserver(() => {
        this.updateAspectRatio();
      });
      this.resizeObserver.observe(this.canvas as any);
    }
  }

  /**
   * Update camera aspect ratio based on canvas size
   */
  private updateAspectRatio(): void {
    if (!this.canvas || !this.threeCamera) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    if (width > 0 && height > 0) {
      const aspectRatio = width / height;
      this.threeCamera.aspect = aspectRatio;
      this.threeCamera.updateProjectionMatrix();

      // Also update the engine's CameraState if accessible
      // This will be handled by the system accessing the world
    }
  }

  /**
   * Cleanup when system is disposed
   */
  dispose(): void {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.onWindowResize && typeof window !== "undefined") {
      window.removeEventListener("resize", this.onWindowResize);
      this.onWindowResize = null;
    }

    this.threeCamera = null;
    this.canvas = null;
  }

  /**
   * Reset orbit controls to initial state based on current CameraState
   * Call this when you want to reset the camera view (e.g., scene reset)
   */
  resetToCamera(world: World): void {
    if (!this.controls || !this.threeCamera) {
      return;
    }

    let cameraState: CameraState | undefined;
    try {
      cameraState = world.getResource<CameraState>("CameraState");
    } catch {
      // CameraState not found
    }

    if (!cameraState) {
      return;
    }

    // Reset camera position
    this.threeCamera.position.set(
      cameraState.position[0],
      cameraState.position[1],
      cameraState.position[2]
    );

    // Reset orbit target
    this.controls.target.set(
      cameraState.target[0],
      cameraState.target[1],
      cameraState.target[2]
    );

    // Reset up vector
    this.threeCamera.up.set(
      cameraState.up[0],
      cameraState.up[1],
      cameraState.up[2]
    );

    // Clear damping/momentum state by resetting velocity
    (this.controls as any).rotateVelocity = { x: 0, y: 0 };
    (this.controls as any).panVelocity = { x: 0, y: 0 };
    (this.controls as any).zoomVelocity = 0;

    // Update the controls to apply all changes
    this.controls.update();
  }
}
