import { DemoBaseScene } from "../core/demo-base-scene.ts";
import type { World } from "../core/world.ts";
import { Transform } from "../features/transform-plugin/mod.ts";
import {
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  BasicMaterial,
  Visible,
} from "../features/render-plugin/mod.ts";

/**
 * Shapes demo scene: A simple demonstration of basic 3D shapes.
 * This is a foundational demo for testing scene reset and lifecycle.
 */
export class ShapesScene extends DemoBaseScene {
  constructor() {
    super("shapes-demo");
    this.demoDescription =
      "Basic shapes demo: Box, Sphere, and Cylinder. Press R to reset the scene.";
    this.demoInstructions = [
      "R - Reset Scene",
      "WASD - Move Camera",
      "Click + Drag - Orbit",
      "Middle Click - Pan",
      "Scroll - Zoom",
    ];
  }

  initDemo(world: World): void {
    // Red Box at origin
    const box = this.createEntity(world);
    world.add(box, new Transform());
    const boxTransform = world.get<Transform>(box, Transform)!;
    boxTransform.position = [-2, 0, 0];
    world.add(box, new BoxGeometry(1, 1, 1));
    const boxMaterial = new BasicMaterial([1, 0, 0, 1]); // Red
    world.add(box, boxMaterial);
    world.add(box, new Visible());

    // Green Sphere in the middle
    const sphere = this.createEntity(world);
    world.add(sphere, new Transform());
    const sphereTransform = world.get<Transform>(sphere, Transform)!;
    sphereTransform.position = [0, 0, 0];
    world.add(sphere, new SphereGeometry(0.8, 32, 32));
    const sphereMaterial = new BasicMaterial([0, 1, 0, 1]); // Green
    world.add(sphere, sphereMaterial);
    world.add(sphere, new Visible());

    // Blue Cylinder on the right
    const cylinder = this.createEntity(world);
    world.add(cylinder, new Transform());
    const cylinderTransform = world.get<Transform>(cylinder, Transform)!;
    cylinderTransform.position = [2, 0, 0];
    world.add(cylinder, new CylinderGeometry(0.6, 0.6, 1.5, 32));
    const cylinderMaterial = new BasicMaterial([0, 0, 1, 1]); // Blue
    world.add(cylinder, cylinderMaterial);
    world.add(cylinder, new Visible());
  }
}
