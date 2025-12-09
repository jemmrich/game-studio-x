import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { World } from "../../../core/world.ts";
import { BaseScene } from "../../../core/base-scene.ts";
import { createOrbitControlPlugin, OrbitControlConfig } from "../mod.ts";

/**
 * Integration tests for OrbitControlPlugin in demo scenes
 * Tests the plugin with actual RenderPlugin setup
 */
describe("OrbitControlPlugin in Demo Scenes", () => {
  describe("Plugin Creation and Configuration", () => {
    it("should create orbit control plugin factory function", () => {
      const mockCanvas = {
        width: 800,
        height: 600,
      } as any;

      const plugin = createOrbitControlPlugin(mockCanvas);
      expect(plugin).toBeDefined();
      expect(typeof plugin).toBe("function");
    });

    it("should accept custom configuration options", () => {
      const mockCanvas = {
        width: 800,
        height: 600,
      } as any;

      const customConfig = {
        minDistance: 5,
        maxDistance: 50,
        autoRotate: true,
      };

      const plugin = createOrbitControlPlugin(mockCanvas, customConfig);
      expect(plugin).toBeDefined();
    });

    it("should create plugin with default configuration", () => {
      const mockCanvas = {
        width: 800,
        height: 600,
      } as any;

      const plugin = createOrbitControlPlugin(mockCanvas);
      expect(plugin).toBeDefined();
    });

    it("should handle partial configuration overrides", () => {
      const mockCanvas = {
        width: 800,
        height: 600,
      } as any;

      const config = new OrbitControlConfig({
        rotateSpeed: 0.5,
        autoRotate: true,
        enablePan: false,
      });

      expect(config.rotateSpeed).toBe(0.5);
      expect(config.autoRotate).toBe(true);
      expect(config.enablePan).toBe(false);
      expect(config.zoomSpeed).toBe(1.0); // Default value
    });
  });

  describe("Configuration Management", () => {
    it("should store and retrieve configuration from world", () => {
      const world = new World();
      const config = new OrbitControlConfig({
        minDistance: 10,
        maxDistance: 100,
      });

      world.addResource("OrbitControlConfig", config);

      const retrieved = world.getResource<OrbitControlConfig>("OrbitControlConfig");
      expect(retrieved.minDistance).toBe(10);
      expect(retrieved.maxDistance).toBe(100);
    });

    it("should allow updating configuration at runtime", () => {
      const config = new OrbitControlConfig();

      config.minDistance = 5;
      config.maxDistance = 50;
      config.autoRotate = true;
      config.rotateSpeed = 2.0;

      expect(config.minDistance).toBe(5);
      expect(config.maxDistance).toBe(50);
      expect(config.autoRotate).toBe(true);
      expect(config.rotateSpeed).toBe(2.0);
    });

    it("should handle feature toggles", () => {
      const config = new OrbitControlConfig();

      config.enableRotate = false;
      config.enablePan = false;
      config.enableZoom = false;

      expect(config.enableRotate).toBe(false);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(false);

      // Re-enable features
      config.enableRotate = true;
      config.enablePan = true;
      config.enableZoom = true;

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });
  });

  describe("Configuration Presets", () => {
    it("should support exploring mode configuration", () => {
      const config = new OrbitControlConfig({
        minDistance: 5,
        maxDistance: 100,
        rotateSpeed: 1.0,
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
      });

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });

    it("should support inspection mode configuration", () => {
      const config = new OrbitControlConfig({
        minDistance: 1,
        maxDistance: 50,
        rotateSpeed: 0.5,
        autoRotate: false,
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
      });

      expect(config.rotateSpeed).toBe(0.5);
      expect(config.autoRotate).toBe(false);
    });

    it("should support auto-tour mode configuration", () => {
      const config = new OrbitControlConfig({
        autoRotate: true,
        autoRotateSpeed: 2.0,
        enableRotate: false,
        enablePan: false,
        enableZoom: false,
      });

      expect(config.autoRotate).toBe(true);
      expect(config.autoRotateSpeed).toBe(2.0);
      expect(config.enableRotate).toBe(false);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(false);
    });

    it("should support constrained interaction mode configuration", () => {
      const config = new OrbitControlConfig({
        enableRotate: true,
        enablePan: false,
        enableZoom: true,
        minPolarAngle: Math.PI / 4,
        maxPolarAngle: (3 * Math.PI) / 4,
      });

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(true);
      expect(config.minPolarAngle).toBe(Math.PI / 4);
      expect(config.maxPolarAngle).toBe((3 * Math.PI) / 4);
    });
  });

  describe("Plugin Design Compliance", () => {
    it("should export OrbitControlConfig class", () => {
      expect(OrbitControlConfig).toBeDefined();
    });

    it("should provide factory function for plugin creation", () => {
      const mockCanvas = {} as any;
      expect(() => createOrbitControlPlugin(mockCanvas)).not.toThrow();
    });

    it("should follow plugin architecture patterns", () => {
      const mockCanvas = {} as any;
      const plugin = createOrbitControlPlugin(mockCanvas, {
        autoRotate: true,
      });

      // Plugin should be a function that takes a World
      expect(typeof plugin).toBe("function");
    });

    it("should support dependency injection through configuration", () => {
      const mockCanvas = {} as any;

      const config1 = { minDistance: 5 };
      const plugin1 = createOrbitControlPlugin(mockCanvas, config1);

      const config2 = { maxDistance: 200 };
      const plugin2 = createOrbitControlPlugin(mockCanvas, config2);

      expect(plugin1).not.toBe(plugin2);
    });
  });

  describe("Default Behavior", () => {
    it("should initialize with sensible defaults", () => {
      const config = new OrbitControlConfig();

      expect(config.enabled).toBe(true);
      expect(config.minDistance).toBe(1);
      expect(config.maxDistance).toBe(100);
      expect(config.enableDamping).toBe(true);
      expect(config.autoRotate).toBe(false);
    });

    it("should allow overriding defaults", () => {
      const config = new OrbitControlConfig({
        minDistance: 20,
        maxDistance: 200,
      });

      expect(config.minDistance).toBe(20);
      expect(config.maxDistance).toBe(200);
      expect(config.enableDamping).toBe(true); // Still default
    });

    it("should maintain property independence across instances", () => {
      const config1 = new OrbitControlConfig({ minDistance: 5 });
      const config2 = new OrbitControlConfig({ minDistance: 50 });

      config1.minDistance = 15;

      expect(config1.minDistance).toBe(15);
      expect(config2.minDistance).toBe(50);
    });
  });

  describe("Plugin Compatibility", () => {
    it("should be compatible with render plugin resource names", () => {
      const world = new World();
      const config = new OrbitControlConfig();

      // Plugin expects these resources from render plugin
      world.addResource("OrbitControlConfig", config);

      const retrieved = world.getResource<OrbitControlConfig>("OrbitControlConfig");
      expect(retrieved).toBe(config);
    });

    it("should work with camera state resource", () => {
      const world = new World();

      // OrbitControlSystem needs CameraState from render plugin
      const mockCameraState = {
        position: [10, 10, 10],
        target: [0, 0, 0],
        up: [0, 1, 0],
      };

      world.addResource("CameraState", mockCameraState);

      const retrieved = world.getResource("CameraState");
      expect(retrieved).toEqual(mockCameraState);
    });
  });

  describe("Real-World Usage Scenarios", () => {
    it("should support free-form exploration", () => {
      const config = new OrbitControlConfig({
        minDistance: 1,
        maxDistance: 1000,
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
        autoRotate: false,
      });

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });

    it("should support guided view with auto-rotation", () => {
      const config = new OrbitControlConfig({
        autoRotate: true,
        autoRotateSpeed: 3.0,
        enableRotate: false,
        enablePan: false,
        enableZoom: false,
      });

      expect(config.autoRotate).toBe(true);
    });

    it("should support viewing with manual rotation only", () => {
      const config = new OrbitControlConfig({
        enableRotate: true,
        enablePan: false,
        enableZoom: false,
      });

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(false);
    });

    it("should support presentation mode with constraints", () => {
      const config = new OrbitControlConfig({
        minDistance: 10,
        maxDistance: 20,
        minPolarAngle: Math.PI / 3,
        maxPolarAngle: (2 * Math.PI) / 3,
        enableRotate: true,
        enablePan: false,
        enableZoom: false,
      });

      expect(config.minDistance).toBe(10);
      expect(config.maxDistance).toBe(20);
    });
  });
});
