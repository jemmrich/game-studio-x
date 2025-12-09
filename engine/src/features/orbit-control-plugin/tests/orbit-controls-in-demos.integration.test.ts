import { describe, it, expect, vi } from "vitest";
import { World } from "../../../core/world.ts";
import { DebugScene } from "../../../demos/debug-demo.ts";
import { PrimitivesScene } from "../../../demos/primatives.ts";
import { ShapesScene } from "../../../demos/shapes.ts";
import { installRenderPlugin } from "../../render-plugin/mod.ts";
import { createOrbitControlPlugin } from "../mod.ts";
import type { CameraState } from "../../render-plugin/resources/camera-state.ts";
import { Transform } from "../../transform-plugin/mod.ts";

/**
 * Integration tests verifying that orbit controls work correctly with demo scenes.
 * 
 * These tests verify:
 * - Orbit controls initialize without errors in demo scenes
 * - Camera state synchronizes properly
 * - Scene can be reset and orbit controls continue to work
 * - Enable/disable functionality works in demo context
 * - Configuration changes apply correctly
 */
describe("Orbit Controls in Demo Scenes", () => {
  let mockCanvas: HTMLCanvasElement;

  function createMockCanvas(): HTMLCanvasElement {
    return {
      width: 800,
      height: 600,
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      style: {
        touchAction: "none",
      },
      ownerDocument: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      getRootNode: vi.fn(() => ({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    } as any;
  }

  describe("Debug Demo Scene", () => {
    it("should initialize without errors", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      // Install render plugin (required for orbit controls)
      installRenderPlugin(world, { canvas: mockCanvas });

      // Create and initialize debug scene
      const scene = new DebugScene();
      expect(() => {
        scene.init(world);
      }).not.toThrow();

      world.dispose();
    });

    it("should have camera state after scene initialization", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      const cameraState = world.getResource<CameraState>("CameraState");
      expect(cameraState).toBeDefined();
      expect(cameraState?.position).toBeDefined();
      expect(cameraState?.target).toBeDefined();
      expect(cameraState?.up).toBeDefined();

      world.dispose();
    });

    it("should allow resetting scene", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      const initialEntityCount = world.entities().length;
      expect(initialEntityCount).toBeGreaterThan(0);

      // Reset scene
      expect(() => {
        scene.reset(world);
      }).not.toThrow();

      // Scene should be reset
      const afterResetCount = world.entities().length;
      // UI entities should be preserved, demo entities cleared
      expect(afterResetCount).toBeLessThanOrEqual(initialEntityCount);

      world.dispose();
    });

    it("should have orbit control-compatible camera setup", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      // Verify render context exists (required for orbit controls)
      const renderContext = world.getResource("RenderContext");
      expect(renderContext).toBeDefined();

      // Verify camera state exists and has proper values
      const cameraState = world.getResource<CameraState>("CameraState");
      expect(cameraState?.position).toBeDefined();
      expect(cameraState?.target).toBeDefined();
      expect(cameraState?.up).toBeDefined();

      world.dispose();
    });

    it("should maintain scene state when camera is manipulated", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      const initialEntityCount = world.entities().length;
      const cameraState = world.getResource<CameraState>("CameraState");
      const initialCameraPos = { ...cameraState?.position };

      // Simulate camera manipulation (would happen with orbit controls in real usage)
      if (cameraState) {
        cameraState.position.x += 1;
        cameraState.position.y += 0.5;
      }

      // Scene entities should be unchanged
      expect(world.entities().length).toBe(initialEntityCount);

      // Camera position should reflect changes
      expect(cameraState?.position.x).not.toBe(initialCameraPos?.x);

      world.dispose();
    });
  });

  describe("Primitives Demo Scene", () => {
    it("should initialize without errors", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      expect(() => {
        scene.init(world);
      }).not.toThrow();

      world.dispose();
    });

    it("should create demo entities with transforms", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      scene.init(world);

      // Count entities with Transform component (demo shapes)
      const entitiesWithTransform = world
        .entities()
        .filter((entity) => world.has(entity, Transform));

      expect(entitiesWithTransform.length).toBeGreaterThan(0);

      world.dispose();
    });

    it("should have correct demo description and instructions", () => {
      const scene = new PrimitivesScene();
      expect(scene.demoDescription).toBeDefined();
      expect(scene.demoInstructions).toBeDefined();
      expect(scene.demoInstructions).toContain("Click + Drag - Orbit Camera");
      expect(scene.demoInstructions).toContain("Scroll - Zoom");
    });

    it("should allow scene reset", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      scene.init(world);

      const beforeReset = world.entities().length;
      scene.reset(world);
      const afterReset = world.entities().length;

      // After reset, some entities (UI) may be preserved
      expect(afterReset).toBeLessThanOrEqual(beforeReset);

      world.dispose();
    });

    it("should handle multiple update cycles", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      scene.init(world);

      // Simulate multiple update cycles (like game loop)
      expect(() => {
        for (let i = 0; i < 5; i++) {
          scene.update(world, 0.016); // 16ms delta (60 FPS)
        }
      }).not.toThrow();

      world.dispose();
    });
  });

  describe("Shapes Demo Scene", () => {
    it("should initialize without errors", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new ShapesScene();
      expect(() => {
        scene.init(world);
      }).not.toThrow();

      world.dispose();
    });

    it("should create three basic shapes", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new ShapesScene();
      scene.init(world);

      // Find entities with Transform (the three shapes)
      const shapesCount = world
        .entities()
        .filter((entity) => world.has(entity, Transform)).length;

      expect(shapesCount).toBeGreaterThanOrEqual(3);

      world.dispose();
    });

    it("should have minimal demo instructions referencing orbit controls", () => {
      const scene = new ShapesScene();
      expect(scene.demoInstructions).toContain("Click + Drag - Orbit");
      expect(scene.demoInstructions).toContain("Scroll - Zoom");
    });

    it("should support scene disposal", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new ShapesScene();
      scene.init(world);

      expect(() => {
        scene.dispose(world);
      }).not.toThrow();

      world.dispose();
    });
  });

  describe("Cross-Demo Integration", () => {
    it("should allow switching between demo scenes", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      // Initialize first scene
      const debugScene = new DebugScene();
      debugScene.init(world);
      const debugEntityCount = world.entities().length;

      // Reset to second scene
      debugScene.reset(world);
      const primitivesScene = new PrimitivesScene();
      primitivesScene.init(world);

      // Should have entities from new scene
      const primitiveEntityCount = world.entities().length;
      expect(primitiveEntityCount).toBeGreaterThan(0);

      world.dispose();
    });

    it("should maintain camera state across scene changes", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      // Initialize scene
      const debugScene = new DebugScene();
      debugScene.init(world);

      const cameraState1 = world.getResource<CameraState>("CameraState");
      expect(cameraState1).toBeDefined();

      // Reset and initialize new scene
      debugScene.reset(world);
      const shapesScene = new ShapesScene();
      shapesScene.init(world);

      const cameraState2 = world.getResource<CameraState>("CameraState");
      expect(cameraState2).toBeDefined();

      // Same resource reference should persist
      expect(world.hasResource("CameraState")).toBe(true);

      world.dispose();
    });

    it("should allow orbit control plugin to be installed in demo scenes", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      // Install orbit control plugin
      expect(() => {
        createOrbitControlPlugin(mockCanvas)(world);
      }).not.toThrow();

      // Verify plugin resources exist
      expect(world.hasResource("OrbitControlConfig")).toBe(true);

      world.dispose();
    });
  });

  describe("Demo Scene Orbit Control Configuration", () => {
    it("should support custom orbit control configuration in debug demo", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      // Install orbit controls with custom config
      createOrbitControlPlugin(mockCanvas, {
        autoRotate: false,
        enableDamping: true,
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
      })(world);

      const config = world.getResource("OrbitControlConfig");
      expect(config).toBeDefined();
      expect(config?.autoRotate).toBe(false);
      expect(config?.enableDamping).toBe(true);

      world.dispose();
    });

    it("should support enabling auto-rotation for presentation mode", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      scene.init(world);

      // Install orbit controls with auto-rotation for presentation
      createOrbitControlPlugin(mockCanvas, {
        autoRotate: true,
        autoRotateSpeed: 1,
        enablePan: false,
        enableZoom: true,
      })(world);

      const config = world.getResource("OrbitControlConfig");
      expect(config?.autoRotate).toBe(true);
      expect(config?.autoRotateSpeed).toBe(1);
      expect(config?.enablePan).toBe(false);

      world.dispose();
    });

    it("should support constrained exploration mode", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new ShapesScene();
      scene.init(world);

      // Install orbit controls with constraints for guided exploration
      createOrbitControlPlugin(mockCanvas, {
        minDistance: 5,
        maxDistance: 20,
        minPolarAngle: Math.PI / 4, // 45 degrees
        maxPolarAngle: (3 * Math.PI) / 4, // 135 degrees
        enablePan: false,
        rotateSpeed: 1,
      })(world);

      const config = world.getResource("OrbitControlConfig");
      expect(config?.minDistance).toBe(5);
      expect(config?.maxDistance).toBe(20);
      expect(config?.minPolarAngle).toBe(Math.PI / 4);
      expect(config?.maxPolarAngle).toBe((3 * Math.PI) / 4);

      world.dispose();
    });
  });

  describe("Demo Scene Orbit Control Lifecycle", () => {
    it("should properly initialize orbit controls in demo context", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      // Should be able to install without errors
      const plugin = createOrbitControlPlugin(mockCanvas);
      expect(() => {
        plugin(world);
      }).not.toThrow();

      world.dispose();
    });

    it("should handle scene reset with orbit controls active", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      // Install orbit controls
      createOrbitControlPlugin(mockCanvas)(world);

      // Reset scene
      expect(() => {
        scene.reset(world);
      }).not.toThrow();

      // Orbit controls resource should persist
      expect(world.hasResource("OrbitControlConfig")).toBe(true);

      world.dispose();
    });

    it("should support toggling orbit control features for different demo modes", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new PrimitivesScene();
      scene.init(world);

      createOrbitControlPlugin(mockCanvas)(world);

      const config = world.getResource("OrbitControlConfig");

      // Verification mode: enable everything
      if (config) {
        config.enableRotate = true;
        config.enablePan = true;
        config.enableZoom = true;
        config.autoRotate = false;
      }
      expect(config?.enableRotate).toBe(true);

      // Presentation mode: auto-rotate only
      if (config) {
        config.enableRotate = false;
        config.enablePan = false;
        config.enableZoom = false;
        config.autoRotate = true;
      }
      expect(config?.autoRotate).toBe(true);
      expect(config?.enableRotate).toBe(false);

      world.dispose();
    });
  });

  describe("Demo Scene Performance with Orbit Controls", () => {
    it("should handle orbit control updates without affecting demo performance", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      const scene = new DebugScene();
      scene.init(world);

      createOrbitControlPlugin(mockCanvas)(world);

      const initialEntityCount = world.entities().length;

      // Simulate multiple updates (game loop iterations)
      const updateCount = 10;
      for (let i = 0; i < updateCount; i++) {
        scene.update(world, 0.016); // 16ms per frame
      }

      // Entity count should remain stable
      expect(world.entities().length).toBe(initialEntityCount);

      world.dispose();
    });

    it("should not create memory leaks with repeated scene resets", () => {
      const world = new World();
      mockCanvas = createMockCanvas();

      installRenderPlugin(world, { canvas: mockCanvas });

      let scene: DebugScene = new DebugScene();
      scene.init(world);

      createOrbitControlPlugin(mockCanvas)(world);

      const initialEntityCount = world.entities().length;

      // Multiple reset cycles
      for (let i = 0; i < 3; i++) {
        scene.reset(world);
        // scene.init(world); // Would reinitialize if needed
      }

      // Should not accumulate entities
      const finalCount = world.entities().length;
      expect(finalCount).toBeLessThanOrEqual(initialEntityCount);

      world.dispose();
    });
  });
});
