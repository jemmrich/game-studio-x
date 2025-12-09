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
import { CameraState } from "../features/render-plugin/resources/camera-state.ts";
import { OrbitControlConfig } from "../features/orbit-control-plugin/resources/mod.ts";

/**
 * Orbit Controls Demonstration Scene
 * 
 * This scene showcases the OrbitControls plugin with multiple 3D objects
 * that can be orbited around. It demonstrates various camera control interactions:
 * - Left-click drag to orbit (rotate camera around focal point)
 * - Middle-click drag to pan (move camera laterally)
 * - Scroll wheel to zoom in/out
 * - Auto-rotation can be toggled (see OrbitControlConfig)
 */
export class OrbitControlsDemoScene extends DemoBaseScene {
  constructor() {
    super("orbit-controls-demo");
    this.demoDescription =
      "Orbit Controls Demonstration: Interact with the camera using mouse controls to orbit around 3D shapes.";
    this.demoInstructions = [
      "R - Reset Scene",
      "Left Click + Drag - Orbit Camera",
      "Middle Click + Drag - Pan Camera",
      "Scroll - Zoom In/Out",
    ];
  }

  initDemo(world: World): void {
    // Reset orbit controls configuration to defaults
    const orbitConfig = world.getResource<OrbitControlConfig>(
      "OrbitControlConfig"
    );
    if (orbitConfig) {
      // Only reset non-distance settings
      // Distance constraints are set once during plugin init and should persist
      orbitConfig.rotateSpeed = 1.0;
      orbitConfig.panSpeed = 1.0;
      orbitConfig.zoomSpeed = 1.0;
      orbitConfig.enableDamping = true;
      orbitConfig.dampingFactor = 0.05;
      orbitConfig.autoRotate = false;
      orbitConfig.enabled = true;
      orbitConfig.enablePan = true;
      orbitConfig.enableZoom = true;
      orbitConfig.enableRotate = true;
    }

    // Create a central sphere as the focal point
    const centerSphere = this.createEntity(world);
    world.add(centerSphere, new Transform());
    const centerTransform = world.get<Transform>(centerSphere, Transform)!;
    centerTransform.position = [0, 0, 0];
    world.add(centerSphere, new SphereGeometry(1, 32, 32));
    const centerMaterial = new BasicMaterial([1, 1, 0, 1]); // Yellow
    world.add(centerSphere, centerMaterial);
    world.add(centerSphere, new Visible());

    // Create a rotating orbit of boxes
    const boxPositions: [number, number, number][] = [
      [-3, 1, -2],
      [3, 1, -2],
      [-3, 1, 2],
      [3, 1, 2],
    ];

    boxPositions.forEach((position, index) => {
      const box = this.createEntity(world);
      world.add(box, new Transform());
      const transform = world.get<Transform>(box, Transform)!;
      transform.position = position;
      world.add(box, new BoxGeometry(0.8, 0.8, 0.8));

      // Alternate colors
      const colors: [number, number, number, number][] = [
        [1, 0, 0, 1], // Red
        [0, 1, 0, 1], // Green
        [0, 0, 1, 1], // Blue
        [1, 0, 1, 1], // Magenta
      ];
      world.add(box, new BasicMaterial(colors[index % colors.length]));
      world.add(box, new Visible());
    });

    // Create some cylinders above and below
    const cylinderPositions: [number, number, number][] = [
      [0, 3, 0],
      [0, -3, 0],
    ];

    cylinderPositions.forEach((position, index) => {
      const cylinder = this.createEntity(world);
      world.add(cylinder, new Transform());
      const transform = world.get<Transform>(cylinder, Transform)!;
      transform.position = position;
      world.add(cylinder, new CylinderGeometry(0.6, 0.6, 1.5, 32));

      const colors: [number, number, number, number][] = [
        [1, 1, 0, 1], // Yellow
        [0, 1, 1, 1], // Cyan
      ];
      world.add(
        cylinder,
        new BasicMaterial(colors[index % colors.length])
      );
      world.add(cylinder, new Visible());
    });
  }
}
