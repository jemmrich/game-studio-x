import { BaseScene } from "./base-scene.ts";
import type { World } from "./world.ts";
import { DemoUIText } from "../components/demo-ui-text.ts";
import { Tag } from "../components/tag.ts";
import { createOrbitControlPlugin } from "../features/orbit-control-plugin/mod.ts";
import { OrbitControlSystem } from "../features/orbit-control-plugin/systems/orbit-control-system.ts";
import { RenderContext } from "../features/render-plugin/resources/render-context.ts";
import { CameraState } from "../features/render-plugin/resources/camera-state.ts";
import { OrbitControlConfig } from "../features/orbit-control-plugin/resources/orbit-control-config.ts";

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

    // Initialize orbit controls for the demo
    this.initOrbitControls(world);

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

    // Reset camera state for a fresh view
    try {
      const cameraState = world.getResource<CameraState>("CameraState");
      if (cameraState) {
        cameraState.position = [0, 0, 5];
        cameraState.target = [0, 0, 0];
        cameraState.up = [0, 1, 0];
      }
    } catch {
      // CameraState not found, skip reset
    }

    // Reset orbit control config to defaults
    try {
      const orbitConfig = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      if (orbitConfig) {
        orbitConfig.rotateSpeed = 1.0;
        orbitConfig.panSpeed = 1.0;
        orbitConfig.zoomSpeed = 1.0;
        orbitConfig.enableDamping = true;
        orbitConfig.dampingFactor = 0.05;
        orbitConfig.autoRotate = false;
        orbitConfig.enabled = true;
        // Note: minDistance and maxDistance are set per-demo in initDemo()
      }
    } catch {
      // OrbitControlConfig not found, skip reset
    }

    // Reset orbit controls to match the camera state
    try {
      const orbitSystem = world.getResource<OrbitControlSystem>(
        "OrbitControlSystem"
      );
      if (orbitSystem) {
        orbitSystem.resetToCamera(world);
      }
    } catch (error) {
      // OrbitControlSystem may not be available in all demo scenes
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

  /**
   * Initialize orbit controls for this demo scene.
   * Sets up camera manipulation with mouse/touch input.
   */
  private initOrbitControls(world: World): void {
    try {
      // Get the canvas from RenderContext
      const renderContext = world.getResource<RenderContext>("RenderContext");
      
      if (!renderContext || !renderContext.canvas) {
        console.warn(
          "[DemoBaseScene] Could not initialize orbit controls: RenderContext or canvas not found"
        );
        return;
      }

      // Create and install the orbit controls plugin
      const orbitPlugin = createOrbitControlPlugin(renderContext.canvas, {
        enableDamping: true,
        dampingFactor: 0.05,
        autoRotate: false, // Can be enabled per-demo if needed
        rotateSpeed: 1.0,
        panSpeed: 1.0,
        zoomSpeed: 1.0,
        minDistance: 2,
        maxDistance: 100,
      });

      // Add the plugin to the world
      orbitPlugin(world);
    } catch (error) {
      console.warn(
        "[DemoBaseScene] Failed to initialize orbit controls:",
        error
      );
      // Continue without orbit controls if plugin fails to load
    }
  }
}
