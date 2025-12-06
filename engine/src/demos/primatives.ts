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

/**
 * Primitives demo scene displaying animated 3D shapes.
 * Demonstrates basic scene setup, entity creation, and animation.
 */
export class PrimitivesScene extends DemoBaseScene {
  // Store transform references for animation
  private boxTransform: Transform | null = null;
  private sphereTransform: Transform | null = null;
  private cylinderTransform: Transform | null = null;
  private coneTransform: Transform | null = null;

  constructor() {
    super("primitives-demo");
    this.demoDescription = "Primitives demo: Four rotating 3D shapes with shaders.";
    this.demoInstructions = [
      "R - Reset Scene",
      "WASD - Move Camera",
      "Click + Drag - Orbit Camera",
      "Middle Click - Pan Camera",
      "Scroll - Zoom",
      "Observe the rotating primitives",
    ];
  }

  initDemo(world: World): void {
    // Create rainbow box
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

    // Create green sphere
    const sphere = this.createEntity(world);
    world.add(sphere, new Name("Green Sphere"));
    world.add(sphere, new Transform());
    this.sphereTransform = world.get<Transform>(sphere, Transform)!;
    this.sphereTransform.position = [0, 0, 0];
    world.add(sphere, new SphereGeometry());
    const sphereMaterial = new BasicMaterial([0, 1, 0, 1]); // Green
    world.add(sphere, sphereMaterial);
    world.add(sphere, new Visible());

    // Create blue cylinder
    const cylinder = this.createEntity(world);
    world.add(cylinder, new Name("Blue Cylinder"));
    world.add(cylinder, new Transform());
    this.cylinderTransform = world.get<Transform>(cylinder, Transform)!;
    this.cylinderTransform.position = [3, 0, 0];
    world.add(cylinder, new CylinderGeometry());
    const cylinderMaterial = new BasicMaterial([0, 0, 1, 1]); // Blue
    world.add(cylinder, cylinderMaterial);
    world.add(cylinder, new Visible());

    // Create yellow shiny cone
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
   * Update shape rotations.
   * Called automatically by SceneLifecycleSystem every frame.
   */
  override update(_world: World, dt: number): void {
    if (this.boxTransform) {
      this.boxTransform.rotation = [
        this.boxTransform.rotation[0] + dt,
        this.boxTransform.rotation[1] + dt * 0.7,
        this.boxTransform.rotation[2],
      ];
    }

    if (this.sphereTransform) {
      this.sphereTransform.rotation = [
        this.sphereTransform.rotation[0],
        this.sphereTransform.rotation[1] + dt * 1.2,
        this.sphereTransform.rotation[2],
      ];
    }

    if (this.cylinderTransform) {
      this.cylinderTransform.rotation = [
        this.cylinderTransform.rotation[0] + dt * 0.5,
        this.cylinderTransform.rotation[1],
        this.cylinderTransform.rotation[2] + dt,
      ];
    }

    if (this.coneTransform) {
      this.coneTransform.rotation = [
        this.coneTransform.rotation[0] + dt * 0.9,
        this.coneTransform.rotation[1],
        this.coneTransform.rotation[2],
      ];
    }
  }
}
