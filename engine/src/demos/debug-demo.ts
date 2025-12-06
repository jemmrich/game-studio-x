import { DemoBaseScene } from "../core/demo-base-scene.ts";
import type { World } from "../core/world.ts";
import { Name } from "../mod.ts";
import { Transform } from "../features/transform-plugin/mod.ts";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  BasicMaterial,
  PhongMaterial,
  SphereGeometry,
  Visible,
} from "../features/render-plugin/mod.ts";
import {
  installDebugPlugin,
  DebugBounds,
  DebugGridOverlay,
  DebugLabel,
  DebugPerformance,
} from "../features/debug-plugin/mod.ts";

/**
 * Debug demo scene showcasing debug visualization tools.
 * Demonstrates debug bounds, labels, grid overlay, and performance monitoring.
 */
export class DebugScene extends DemoBaseScene {
  // Store transform references for animation
  private boxTransform: Transform | null = null;
  private sphereTransform: Transform | null = null;
  private cylinderTransform: Transform | null = null;
  private coneTransform: Transform | null = null;

  constructor() {
    super("debug-demo");
    this.demoDescription = "Debug demo: Primitives with debug bounds, labels, grid, and performance monitoring.";
    this.demoInstructions = [
      "R - Reset Scene",
      "WASD - Move Camera",
      "Click + Drag - Orbit Camera",
      "Middle Click - Pan Camera",
      "Scroll - Zoom",
      "Debug features: bounds (red), labels, grid overlay, performance metrics",
    ];
  }

  initDemo(world: World): void {
    // Install debug plugin
    installDebugPlugin(world, {
      enabled: true,
      enabledLayers: ["bounds", "grid", "labels", "performance"]
    });

    // Add global debug components
    const debugEntity = this.createEntity(world);
    world.add(debugEntity, new DebugGridOverlay(1, { r: 0.5, g: 0.5, b: 0.5, a: 0.3 }, 0.3, true));
    world.add(debugEntity, new DebugPerformance(true, true, true, 30));

    // Create rainbow box with debug bounds and label
    const box = this.createEntity(world);
    world.add(box, new Name("Rainbow Box"));
    world.add(box, new Transform());
    this.boxTransform = world.get<Transform>(box, Transform)!;
    this.boxTransform.position = [-3, 0, 0];
    world.add(box, new BoxGeometry());
    const boxMaterial = new BasicMaterial([1, 1, 1, 1]); // White base for rainbow shader
    boxMaterial.shaderId = "rainbow";
    world.add(box, boxMaterial);
    world.add(box, new Visible());

    // Add debug components
    world.add(box, new DebugBounds({ r: 1, g: 0, b: 0, a: 1 }, 2, false));
    world.add(box, new DebugLabel("Rotating Box", { x: 0, y: 1, z: 0 }, { r: 1, g: 1, b: 1, a: 1 }, 14));

    // Create green sphere with debug bounds and label
    const sphere = this.createEntity(world);
    world.add(sphere, new Name("Green Sphere"));
    world.add(sphere, new Transform());
    this.sphereTransform = world.get<Transform>(sphere, Transform)!;
    this.sphereTransform.position = [0, 0, 0];
    world.add(sphere, new SphereGeometry());
    const sphereMaterial = new BasicMaterial([0, 1, 0, 1]); // Green
    world.add(sphere, sphereMaterial);
    world.add(sphere, new Visible());

    // Add debug components
    world.add(sphere, new DebugBounds({ r: 0, g: 1, b: 0, a: 1 }, 2, false));
    world.add(sphere, new DebugLabel("Green Sphere", { x: 0, y: 1.5, z: 0 }, { r: 0, g: 1, b: 0, a: 1 }, 14));

    // Create blue cylinder with debug bounds and label
    const cylinder = this.createEntity(world);
    world.add(cylinder, new Name("Blue Cylinder"));
    world.add(cylinder, new Transform());
    this.cylinderTransform = world.get<Transform>(cylinder, Transform)!;
    this.cylinderTransform.position = [3, 0, 0];
    world.add(cylinder, new CylinderGeometry());
    const cylinderMaterial = new BasicMaterial([0, 0, 1, 1]); // Blue
    world.add(cylinder, cylinderMaterial);
    world.add(cylinder, new Visible());

    // Add debug components
    world.add(cylinder, new DebugBounds({ r: 0, g: 0, b: 1, a: 1 }, 2, false));
    world.add(cylinder, new DebugLabel("Blue Cylinder", { x: 0, y: 2, z: 0 }, { r: 0, g: 0, b: 1, a: 1 }, 14));

    // Create yellow shiny cone with debug bounds and label
    const cone = this.createEntity(world);
    world.add(cone, new Name("Yellow Shiny Cone"));
    world.add(cone, new Transform());
    this.coneTransform = world.get<Transform>(cone, Transform)!;
    this.coneTransform.position = [0, 3, 0];
    world.add(cone, new ConeGeometry());
    const coneMaterial = new PhongMaterial(
      [1, 1, 0, 1], // Yellow diffuse
      [1, 1, 1], // White specular
      64 // Shiny
    );
    world.add(cone, coneMaterial);
    world.add(cone, new Visible());

    // Add debug components
    world.add(cone, new DebugBounds({ r: 1, g: 1, b: 0, a: 1 }, 2, false));
    world.add(cone, new DebugLabel("Shiny Cone", { x: 0, y: 1.2, z: 0 }, { r: 1, g: 1, b: 0, a: 1 }, 14));
  }

  /**
   * Reset clears transforms before re-initializing.
   */
  override reset(world: World): void {
    // Clear all transform references
    this.boxTransform = null;
    this.sphereTransform = null;
    this.cylinderTransform = null;
    this.coneTransform = null;

    // Call parent reset which cleans up and re-inits
    super.reset(world);
  }

  /**
   * Update shape rotations and positions.
   * Called automatically by SceneLifecycleSystem every frame.
   */
  override update(_world: World, dt: number): void {
    const time = Date.now() * 0.001; // Current time in seconds

    if (this.boxTransform) {
      this.boxTransform.rotation = [
        this.boxTransform.rotation[0] + dt,
        this.boxTransform.rotation[1] + dt * 0.7,
        this.boxTransform.rotation[2],
      ];
      // Move box in a circle
      this.boxTransform.position = [
        -3 + Math.sin(time) * 2,
        Math.cos(time) * 1,
        0
      ];
    }

    if (this.sphereTransform) {
      this.sphereTransform.rotation = [
        this.sphereTransform.rotation[0],
        this.sphereTransform.rotation[1] + dt * 1.2,
        this.sphereTransform.rotation[2],
      ];
      // Move sphere up and down
      this.sphereTransform.position = [
        0,
        Math.sin(time * 1.5) * 2,
        0
      ];
    }

    if (this.cylinderTransform) {
      this.cylinderTransform.rotation = [
        this.cylinderTransform.rotation[0] + dt * 0.5,
        this.cylinderTransform.rotation[1],
        this.cylinderTransform.rotation[2] + dt,
      ];
      // Move cylinder left and right
      this.cylinderTransform.position = [
        3 + Math.cos(time * 0.8) * 1.5,
        0,
        0
      ];
    }

    if (this.coneTransform) {
      this.coneTransform.rotation = [
        this.coneTransform.rotation[0] + dt * 0.9,
        this.coneTransform.rotation[1],
        this.coneTransform.rotation[2],
      ];
      // Move cone in a figure-8
      this.coneTransform.position = [
        Math.sin(time) * 2,
        3 + Math.sin(time * 2) * 1,
        0
      ];
    }
  }
}