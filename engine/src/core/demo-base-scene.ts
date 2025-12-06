import { BaseScene } from "./base-scene.ts";
import type { World } from "./world.ts";
import { DemoUIText } from "../components/demo-ui-text.ts";
import { Tag } from "../components/tag.ts";

/**
 * Specialized base class for engine demonstration scenes.
 * Provides minimal boilerplate with standardized UI for demos.
 *
 * Features:
 * - Automatic demo UI setup (instructions, description)
 * - Default controls display
 * - FPS counter support
 * - Reset button integration
 * - Easy scene reset for iteration
 *
 * Usage:
 * ```typescript
 * export class ShapesDemoScene extends DemoBaseScene {
 *   constructor() {
 *     super('shapes-demo');
 *     this.demoDescription = 'Demonstrates 3D shape rendering.';
 *   }
 *
 *   initDemo(world: World): void {
 *     // Spawn your demo entities here
 *     const box = this.createEntity(world);
 *     box.addComponent(new Transform());
 *     box.addComponent(new BoxGeometry(2, 2, 2));
 *   }
 * }
 * ```
 */
export abstract class DemoBaseScene extends BaseScene {
  /** Entity IDs for UI elements (preserved during reset) */
  private uiEntityIds: string[] = [];

  /**
   * Description shown in bottom-left corner.
   * Override in subclass to customize.
   */
  protected demoDescription: string =
    "This is a demo of engine capabilities.";

  /**
   * Interaction instructions shown in top-left corner.
   * Override to customize for your specific demo.
   */
  protected demoInstructions: string[] = [
    "R - Reset Scene",
    "WASD - Move Camera",
    "Click + Drag - Orbit Camera",
    "Middle Click - Pan Camera",
    "Scroll - Zoom",
  ];

  constructor(id: string) {
    super(id);
  }

  /**
   * Main init() calls this after setting up UI.
   * Override this instead of init() - it's automatically called
   * after demo UI is initialized.
   */
  abstract initDemo(world: World): void;

  /**
   * Standard init() - sets up demo UI then calls initDemo().
   * Don't override; implement initDemo() instead.
   */
  override init(world: World): void {
    // Add standard demo UI
    this.initDemoUI(world);

    // Call subclass implementation
    this.initDemo(world);
  }

  /**
   * Standard reset() - clears demo entities but preserves UI.
   */
  override reset(world: World): void {
    // Remove all scene entities except UI
    const allEntities = world.getAllEntities();

    for (const entity of allEntities) {
      // Only remove non-UI entities
      if (!this.uiEntityIds.includes(String(entity))) {
        const tag = world.get(entity, Tag) as Tag | undefined;
        if (tag && tag.value === this.id) {
          world.destroyEntity(entity);
        }
      }
    }

    // Re-initialize demo content
    this.initDemo(world);
  }

  /**
   * Set up standard demo UI elements.
   */
  private initDemoUI(world: World): void {
    // Top-left: Interaction Instructions
    const instructionsEntity = this.createEntity(world);
    world.add(
      instructionsEntity,
      new DemoUIText({
        position: "top-left",
        title: "Controls",
        lines: this.demoInstructions,
        fontSize: 12,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 12,
        marginX: 16,
        marginY: 16,
      })
    );
    this.uiEntityIds.push(String(instructionsEntity));

    // Bottom-left: Demo Description
    const descriptionEntity = this.createEntity(world);
    world.add(
      descriptionEntity,
      new DemoUIText({
        position: "bottom-left",
        lines: [this.demoDescription],
        fontSize: 11,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 12,
        marginX: 16,
        marginY: 16,
      })
    );
    this.uiEntityIds.push(String(descriptionEntity));

    // Note: FPS counter and reset button are typically managed by:
    // - A global FPS display system
    // - Global input handling (for R key → reset)
  }
}
