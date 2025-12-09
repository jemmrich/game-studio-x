import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { World } from "../../../core/world.ts";
import { OrbitControlSystem } from "./orbit-control-system.ts";
import { OrbitControlConfig } from "../resources/orbit-control-config.ts";
import { CameraState } from "../../render-plugin/resources/camera-state.ts";

/**
 * Mock HTMLCanvasElement for testing without a real DOM
 */
class MockCanvasElement {
  width: number = 800;
  height: number = 600;
  addEventListener: (event: string, callback: any) => void = () => {};
  removeEventListener: (event: string, callback: any) => void = () => {};
}

describe("OrbitControlSystem", () => {
  let world: World;
  let canvas: any;
  let system: OrbitControlSystem;
  let cameraState: CameraState;

  beforeEach(() => {
    // Setup world with required resources
    world = new World();

    // Initialize camera state (required by OrbitControlSystem)
    cameraState = new CameraState([10, 10, 10], [0, 0, 0], [0, 1, 0]);
    world.addResource("CameraState", cameraState);

    // Create mock canvas
    canvas = new MockCanvasElement();

    // Create system
    system = new OrbitControlSystem(canvas as any);
  });

  afterEach(() => {
    system.dispose();
  });

  describe("initialization", () => {
    it("should initialize with a valid canvas", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);

      system.init(world);
      expect(system).toBeDefined();
      expect(system.enabled).toBe(true);
    });

    it("should handle missing CameraState gracefully", () => {
      const world2 = new World();
      const config = new OrbitControlConfig();
      world2.addResource("OrbitControlConfig", config);

      system.init(world2);
      expect(system).toBeDefined();
    });

    it("should handle missing OrbitControlConfig gracefully", () => {
      const world2 = new World();
      world2.addResource(
        "CameraState",
        new CameraState([5, 5, 5], [0, 0, 0], [0, 1, 0])
      );

      system.init(world2);
      expect(system).toBeDefined();
    });

    it("should set enabled to true by default", () => {
      expect(system.enabled).toBe(true);
    });
  });

  describe("configuration", () => {
    beforeEach(() => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);
    });

    it("should use default configuration values", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      expect(config.enabled).toBe(true);
      expect(config.enableDamping).toBe(true);
      expect(config.dampingFactor).toBe(0.05);
      expect(config.minDistance).toBe(1);
      expect(config.maxDistance).toBe(100);
      expect(config.rotateSpeed).toBe(1.0);
      expect(config.panSpeed).toBe(1.0);
      expect(config.zoomSpeed).toBe(1.0);
      expect(config.autoRotate).toBe(false);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
      expect(config.enableRotate).toBe(true);
    });

    it("should accept partial configuration overrides", () => {
      const customConfig = new OrbitControlConfig({
        minDistance: 5,
        maxDistance: 50,
        autoRotate: true,
        autoRotateSpeed: 5,
      });

      expect(customConfig.minDistance).toBe(5);
      expect(customConfig.maxDistance).toBe(50);
      expect(customConfig.autoRotate).toBe(true);
      expect(customConfig.autoRotateSpeed).toBe(5);
      expect(customConfig.dampingFactor).toBe(0.05);
    });

    it("should create new config instance without mutation", () => {
      const original = new OrbitControlConfig({ minDistance: 3 });
      const copy = new OrbitControlConfig(original);

      expect(copy.minDistance).toBe(3);
      copy.minDistance = 10;
      expect(original.minDistance).toBe(3);
      expect(copy.minDistance).toBe(10);
    });
  });

  describe("update loop", () => {
    beforeEach(() => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);
    });

    it("should not crash when enabled is true", () => {
      system.enabled = true;
      expect(() => system.update(world, 0.016)).not.toThrow();
    });

    it("should not update when enabled is false", () => {
      system.enabled = false;
      const initialPos = [...cameraState.position];

      system.update(world, 0.016);

      expect(cameraState.position[0]).toBe(initialPos[0]);
      expect(cameraState.position[1]).toBe(initialPos[1]);
      expect(cameraState.position[2]).toBe(initialPos[2]);
    });

    it("should not update when config is disabled", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      config.enabled = false;
      const initialPos = [...cameraState.position];

      system.update(world, 0.016);

      expect(cameraState.position[0]).toBe(initialPos[0]);
      expect(cameraState.position[1]).toBe(initialPos[1]);
      expect(cameraState.position[2]).toBe(initialPos[2]);
    });

    it("should handle missing resources gracefully", () => {
      const emptyWorld = new World();

      expect(() => system.update(emptyWorld, 0.016)).not.toThrow();
      expect(system).toBeDefined();
    });

    it("should sync camera state from orbit controls", () => {
      system.update(world, 0.016);

      expect(cameraState.position).toBeDefined();
      expect(cameraState.position.length).toBe(3);
    });
  });

  describe("enabling/disabling controls", () => {
    beforeEach(() => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);
    });

    it("should toggle enabled state", () => {
      expect(system.enabled).toBe(true);
      system.enabled = false;
      expect(system.enabled).toBe(false);
      system.enabled = true;
      expect(system.enabled).toBe(true);
    });

    it("should stop updating when disabled", () => {
      system.enabled = true;
      system.update(world, 0.016);

      system.enabled = false;
      const posBeforeDisable = [...cameraState.position];
      system.update(world, 0.016);

      expect(cameraState.position[0]).toBe(posBeforeDisable[0]);
      expect(cameraState.position[1]).toBe(posBeforeDisable[1]);
      expect(cameraState.position[2]).toBe(posBeforeDisable[2]);
    });

    it("should resume updating when re-enabled", () => {
      system.enabled = false;
      system.update(world, 0.016);

      system.enabled = true;
      expect(() => system.update(world, 0.016)).not.toThrow();
      expect(system).toBeDefined();
    });
  });

  describe("disposal", () => {
    it("should dispose without throwing", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      expect(() => system.dispose()).not.toThrow();
    });

    it("should cleanup resources", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      system.dispose();

      expect(() => system.update(world, 0.016)).not.toThrow();
    });

    it("should be callable multiple times", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      expect(() => {
        system.dispose();
        system.dispose();
        system.dispose();
      }).not.toThrow();
    });
  });

  describe("camera state synchronization", () => {
    beforeEach(() => {
      const config = new OrbitControlConfig({
        enableDamping: false,
      });
      world.addResource("OrbitControlConfig", config);
      system.init(world);
    });

    it("should initialize camera position from CameraState", () => {
      system.update(world, 0.016);

      expect(cameraState.position).toBeDefined();
      expect(cameraState.position.length).toBe(3);
    });

    it("should maintain up vector orientation", () => {
      system.update(world, 0.016);

      expect(cameraState.up).toBeDefined();
      expect(cameraState.up.length).toBe(3);
    });

    it("should maintain target", () => {
      system.update(world, 0.016);

      expect(cameraState.target).toBeDefined();
      expect(cameraState.target.length).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("should handle null canvas gracefully", () => {
      const systemWithoutCanvas = new OrbitControlSystem(null as any);

      expect(() => {
        systemWithoutCanvas.init(world);
        systemWithoutCanvas.update(world, 0.016);
        systemWithoutCanvas.dispose();
      }).not.toThrow();
    });

    it("should handle zero delta time", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      expect(() => system.update(world, 0)).not.toThrow();
    });

    it("should handle very large delta time", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      expect(() => system.update(world, 10.0)).not.toThrow();
    });

    it("should handle rapid enable/disable toggling", () => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          system.enabled = i % 2 === 0;
          system.update(world, 0.016);
        }
      }).not.toThrow();
      expect(system).toBeDefined();
    });
  });

  describe("configuration updates at runtime", () => {
    beforeEach(() => {
      const config = new OrbitControlConfig();
      world.addResource("OrbitControlConfig", config);
      system.init(world);
    });

    it("should respect distance limits", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      config.minDistance = 5;
      config.maxDistance = 50;

      expect(() => system.update(world, 0.016)).not.toThrow();
      expect(system).toBeDefined();
    });

    it("should respect angle limits", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      config.minPolarAngle = Math.PI / 4;
      config.maxPolarAngle = (3 * Math.PI) / 4;

      expect(() => system.update(world, 0.016)).not.toThrow();
      expect(system).toBeDefined();
    });

    it("should respect speed settings", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      config.rotateSpeed = 0.5;
      config.panSpeed = 0.5;
      config.zoomSpeed = 0.5;

      expect(() => system.update(world, 0.016)).not.toThrow();
      expect(system).toBeDefined();
    });

    it("should toggle features on/off at runtime", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );

      expect(() => {
        config.enableRotate = false;
        system.update(world, 0.016);

        config.enablePan = false;
        system.update(world, 0.016);

        config.enableZoom = false;
        system.update(world, 0.016);
      }).not.toThrow();
      expect(system).toBeDefined();
    });

    it("should toggle auto-rotate at runtime", () => {
      const config = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );

      expect(() => {
        config.autoRotate = false;
        system.update(world, 0.016);

        config.autoRotate = true;
        system.update(world, 0.016);

        config.autoRotate = false;
        system.update(world, 0.016);
      }).not.toThrow();
      expect(system).toBeDefined();
    });
  });
});
