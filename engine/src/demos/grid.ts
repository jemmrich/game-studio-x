import { DemoBaseScene } from "../core/demo-base-scene.ts";
import type { World } from "../core/world.ts";
import { Transform } from "../features/transform-plugin/mod.ts";
import { BoxGeometry, BasicMaterial, Visible } from "../features/render-plugin/mod.ts";

/**
 * Grid demo scene: A grid of colored cubes in a pattern.
 * This is used for testing scene transitions and state changes.
 */
export class GridScene extends DemoBaseScene {
  constructor() {
    super("grid-demo");
    this.demoDescription =
      "Grid demo: A 3x3 grid of colored cubes demonstrating scene state and transitions.";
    this.demoInstructions = [
      "R - Reset Scene",
      "WASD - Move Camera",
      "Click + Drag - Orbit",
      "Middle Click - Pan",
      "Scroll - Zoom",
    ];
  }

  initDemo(world: World): void {
    const colors = [
      [1, 0, 0], // Red
      [0, 1, 0], // Green
      [0, 0, 1], // Blue
      [1, 1, 0], // Yellow
      [1, 0, 1], // Magenta
      [0, 1, 1], // Cyan
      [1, 0.5, 0], // Orange
      [0.5, 0, 1], // Purple
      [1, 1, 1], // White
    ];

    let colorIndex = 0;
    const gridSize = 3;
    const spacing = 1.5;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const cube = this.createEntity(world);
        world.add(cube, new Transform());

        const transform = world.get<Transform>(cube, Transform)!;
        transform.position = [
          x * spacing - (gridSize - 1) * spacing * 0.5,
          0,
          z * spacing - (gridSize - 1) * spacing * 0.5,
        ];

        world.add(cube, new BoxGeometry(0.8, 0.8, 0.8));

        const color = colors[colorIndex % colors.length];
        const material = new BasicMaterial([color[0], color[1], color[2], 1]);
        world.add(cube, material);

        world.add(cube, new Visible());

        colorIndex++;
      }
    }
  }
}
