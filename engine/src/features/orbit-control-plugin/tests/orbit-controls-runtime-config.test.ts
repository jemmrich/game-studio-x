import { describe, it, expect } from "vitest";
import { World } from "../../../core/world.ts";
import { OrbitControlConfig } from "../resources/orbit-control-config.ts";

/**
 * Tests for enable/disable functionality and runtime configuration changes.
 * These tests verify that the OrbitControl plugin supports dynamic behavior changes
 * without requiring full scene initialization.
 */
describe("Orbit Controls - Enable/Disable and Runtime Configuration", () => {
  describe("Enable/Disable Functionality", () => {
    it("should allow toggling enabled state", () => {
      const config = new OrbitControlConfig({ enabled: true });
      expect(config.enabled).toBe(true);

      config.enabled = false;
      expect(config.enabled).toBe(false);

      config.enabled = true;
      expect(config.enabled).toBe(true);
    });

    it("should allow toggling rotation enable", () => {
      const config = new OrbitControlConfig({ enableRotate: true });
      expect(config.enableRotate).toBe(true);

      config.enableRotate = false;
      expect(config.enableRotate).toBe(false);
    });

    it("should allow toggling pan enable", () => {
      const config = new OrbitControlConfig({ enablePan: true });
      expect(config.enablePan).toBe(true);

      config.enablePan = false;
      expect(config.enablePan).toBe(false);
    });

    it("should allow toggling zoom enable", () => {
      const config = new OrbitControlConfig({ enableZoom: true });
      expect(config.enableZoom).toBe(true);

      config.enableZoom = false;
      expect(config.enableZoom).toBe(false);
    });

    it("should allow toggling auto-rotate enable", () => {
      const config = new OrbitControlConfig({ autoRotate: false });
      expect(config.autoRotate).toBe(false);

      config.autoRotate = true;
      expect(config.autoRotate).toBe(true);
    });

    it("should support disabling all interactive features", () => {
      const config = new OrbitControlConfig({
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
      });

      // Disable all
      config.enableRotate = false;
      config.enablePan = false;
      config.enableZoom = false;

      expect(config.enableRotate).toBe(false);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(false);
    });

    it("should support enabling all interactive features", () => {
      const config = new OrbitControlConfig({
        enableRotate: false,
        enablePan: false,
        enableZoom: false,
      });

      // Enable all
      config.enableRotate = true;
      config.enablePan = true;
      config.enableZoom = true;

      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });

    it("should maintain other config values when toggling enable state", () => {
      const config = new OrbitControlConfig({
        enabled: true,
        rotateSpeed: 0.5,
        minDistance: 1,
        maxDistance: 100,
      });

      config.enabled = false;

      // Other values should persist
      expect(config.rotateSpeed).toBe(0.5);
      expect(config.minDistance).toBe(1);
      expect(config.maxDistance).toBe(100);
    });
  });

  describe("Runtime Configuration Changes", () => {
    it("should update rotate speed at runtime", () => {
      const config = new OrbitControlConfig({ rotateSpeed: 1 });
      expect(config.rotateSpeed).toBe(1);

      config.rotateSpeed = 0.5;
      expect(config.rotateSpeed).toBe(0.5);

      config.rotateSpeed = 2;
      expect(config.rotateSpeed).toBe(2);
    });

    it("should update pan speed at runtime", () => {
      const config = new OrbitControlConfig({ panSpeed: 1 });
      expect(config.panSpeed).toBe(1);

      config.panSpeed = 0.8;
      expect(config.panSpeed).toBe(0.8);

      config.panSpeed = 1.5;
      expect(config.panSpeed).toBe(1.5);
    });

    it("should update zoom speed at runtime", () => {
      const config = new OrbitControlConfig({ zoomSpeed: 1.2 });
      expect(config.zoomSpeed).toBe(1.2);

      config.zoomSpeed = 0.6;
      expect(config.zoomSpeed).toBe(0.6);

      config.zoomSpeed = 2;
      expect(config.zoomSpeed).toBe(2);
    });

    it("should update auto-rotate speed at runtime", () => {
      const config = new OrbitControlConfig({ autoRotateSpeed: 2 });
      expect(config.autoRotateSpeed).toBe(2);

      config.autoRotateSpeed = 1;
      expect(config.autoRotateSpeed).toBe(1);

      config.autoRotateSpeed = 5;
      expect(config.autoRotateSpeed).toBe(5);
    });

    it("should update damping factor at runtime", () => {
      const config = new OrbitControlConfig({ dampingFactor: 0.05 });
      expect(config.dampingFactor).toBe(0.05);

      config.dampingFactor = 0.1;
      expect(config.dampingFactor).toBe(0.1);

      config.dampingFactor = 0.02;
      expect(config.dampingFactor).toBe(0.02);
    });

    it("should update distance constraints at runtime", () => {
      const config = new OrbitControlConfig({
        minDistance: 1,
        maxDistance: 100,
      });

      // Increase constraints
      config.minDistance = 5;
      config.maxDistance = 200;

      expect(config.minDistance).toBe(5);
      expect(config.maxDistance).toBe(200);

      // Decrease constraints
      config.minDistance = 0.1;
      config.maxDistance = 50;

      expect(config.minDistance).toBe(0.1);
      expect(config.maxDistance).toBe(50);
    });

    it("should update polar angle constraints at runtime", () => {
      const config = new OrbitControlConfig({
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
      });

      const quarterPi = Math.PI / 4;
      const threePi = (3 * Math.PI) / 4;

      config.minPolarAngle = quarterPi;
      config.maxPolarAngle = threePi;

      expect(config.minPolarAngle).toBe(quarterPi);
      expect(config.maxPolarAngle).toBe(threePi);
    });

    it("should update azimuth angle constraints at runtime", () => {
      const config = new OrbitControlConfig({
        minAzimuthAngle: -Math.PI,
        maxAzimuthAngle: Math.PI,
      });

      config.minAzimuthAngle = 0;
      config.maxAzimuthAngle = Math.PI / 2;

      expect(config.minAzimuthAngle).toBe(0);
      expect(config.maxAzimuthAngle).toBe(Math.PI / 2);
    });
  });

  describe("Complex Runtime Scenarios", () => {
    it("should support presentation mode (auto-rotate with disabled interaction)", () => {
      const config = new OrbitControlConfig({
        autoRotate: true,
        autoRotateSpeed: 2,
        enableRotate: false,
        enablePan: false,
        enableZoom: false,
      });

      expect(config.autoRotate).toBe(true);
      expect(config.autoRotateSpeed).toBe(2);
      expect(config.enableRotate).toBe(false);
      expect(config.enablePan).toBe(false);
      expect(config.enableZoom).toBe(false);
    });

    it("should allow switching from presentation to interactive mode", () => {
      // Start in presentation mode
      const config = new OrbitControlConfig({
        autoRotate: true,
        enableRotate: false,
        enablePan: false,
        enableZoom: false,
      });

      // Switch to interactive mode
      config.autoRotate = false;
      config.enableRotate = true;
      config.enablePan = true;
      config.enableZoom = true;

      expect(config.autoRotate).toBe(false);
      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });

    it("should support constrained exploration mode", () => {
      const config = new OrbitControlConfig({
        minDistance: 5,
        maxDistance: 20,
        minPolarAngle: Math.PI / 4,
        maxPolarAngle: (3 * Math.PI) / 4,
        enablePan: false,
        enableZoom: false,
        enableRotate: true,
      });

      expect(config.minDistance).toBe(5);
      expect(config.maxDistance).toBe(20);
      expect(config.enableRotate).toBe(true);
      expect(config.enablePan).toBe(false);

      // Switch to full exploration
      config.minDistance = 0.1;
      config.maxDistance = 1000;
      config.enablePan = true;
      config.enableZoom = true;

      expect(config.minDistance).toBe(0.1);
      expect(config.maxDistance).toBe(1000);
      expect(config.enablePan).toBe(true);
      expect(config.enableZoom).toBe(true);
    });

    it("should support slow, damped controls for precise inspection", () => {
      const config = new OrbitControlConfig({
        enableDamping: true,
        dampingFactor: 0.02,
        rotateSpeed: 0.3,
        panSpeed: 0.3,
        zoomSpeed: 0.5,
      });

      expect(config.enableDamping).toBe(true);
      expect(config.dampingFactor).toBe(0.02);
      expect(config.rotateSpeed).toBe(0.3);
      expect(config.panSpeed).toBe(0.3);
      expect(config.zoomSpeed).toBe(0.5);
    });

    it("should support fast, snappy controls for exploration", () => {
      const config = new OrbitControlConfig({
        enableDamping: false,
        rotateSpeed: 2,
        panSpeed: 2,
        zoomSpeed: 2,
      });

      expect(config.enableDamping).toBe(false);
      expect(config.rotateSpeed).toBe(2);
      expect(config.panSpeed).toBe(2);
      expect(config.zoomSpeed).toBe(2);
    });

    it("should allow switching between control profiles during gameplay", () => {
      const config = new OrbitControlConfig({
        enableDamping: false,
        rotateSpeed: 1,
      });

      // Switch to damped profile
      config.enableDamping = true;
      config.dampingFactor = 0.05;
      config.rotateSpeed = 0.5;

      expect(config.enableDamping).toBe(true);
      expect(config.dampingFactor).toBe(0.05);
      expect(config.rotateSpeed).toBe(0.5);

      // Switch back to snappy profile
      config.enableDamping = false;
      config.rotateSpeed = 1.5;

      expect(config.enableDamping).toBe(false);
      expect(config.rotateSpeed).toBe(1.5);
    });
  });

  describe("Configuration Persistence in World", () => {
    it("should persist configuration in world resource", () => {
      const world = new World();
      const config = new OrbitControlConfig({ rotateSpeed: 1 });

      world.addResource("OrbitControlConfig", config);

      // Modify configuration
      config.rotateSpeed = 0.5;

      // Retrieve and verify
      const retrievedConfig = world.getResource<OrbitControlConfig>(
        "OrbitControlConfig"
      );
      expect(retrievedConfig?.rotateSpeed).toBe(0.5);
    });

    it("should allow multiple config instances for different modes", () => {
      const world = new World();

      const explorationMode = new OrbitControlConfig({
        rotateSpeed: 1,
        panSpeed: 1,
        zoomSpeed: 1,
        minDistance: 0.1,
        maxDistance: 1000,
      });

      const inspectionMode = new OrbitControlConfig({
        rotateSpeed: 0.3,
        panSpeed: 0.3,
        zoomSpeed: 0.5,
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 1,
        maxDistance: 100,
      });

      // Store both configs (though only one would be used at a time)
      expect(explorationMode.rotateSpeed).toBe(1);
      expect(inspectionMode.rotateSpeed).toBe(0.3);
      expect(inspectionMode.enableDamping).toBe(true);
    });

    it("should support resetting configuration to defaults", () => {
      const config = new OrbitControlConfig({
        rotateSpeed: 2,
        panSpeed: 2,
        zoomSpeed: 2,
        enableDamping: false,
        dampingFactor: 0.1,
      });

      // Create a fresh default config
      const defaultConfig = new OrbitControlConfig();

      // Verify changes were made
      expect(config.rotateSpeed).not.toBe(defaultConfig.rotateSpeed);
      expect(config.enableDamping).not.toBe(defaultConfig.enableDamping);

      // Reset to defaults
      config.rotateSpeed = defaultConfig.rotateSpeed;
      config.panSpeed = defaultConfig.panSpeed;
      config.zoomSpeed = defaultConfig.zoomSpeed;
      config.enableDamping = defaultConfig.enableDamping;
      config.dampingFactor = defaultConfig.dampingFactor;

      expect(config.rotateSpeed).toBe(defaultConfig.rotateSpeed);
      expect(config.enableDamping).toBe(defaultConfig.enableDamping);
    });
  });

  describe("Feature Toggle Combinations", () => {
    it("should handle all feature combinations", () => {
      const combinations = [
        {
          enableRotate: true,
          enablePan: true,
          enableZoom: true,
          autoRotate: false,
        },
        {
          enableRotate: false,
          enablePan: true,
          enableZoom: true,
          autoRotate: false,
        },
        {
          enableRotate: true,
          enablePan: false,
          enableZoom: true,
          autoRotate: false,
        },
        {
          enableRotate: true,
          enablePan: true,
          enableZoom: false,
          autoRotate: false,
        },
        {
          enableRotate: false,
          enablePan: false,
          enableZoom: false,
          autoRotate: true,
        },
      ];

      combinations.forEach((combo) => {
        const config = new OrbitControlConfig(combo);
        expect(config.enableRotate).toBe(combo.enableRotate);
        expect(config.enablePan).toBe(combo.enablePan);
        expect(config.enableZoom).toBe(combo.enableZoom);
        expect(config.autoRotate).toBe(combo.autoRotate);
      });
    });

    it("should allow dynamic feature toggling during gameplay", () => {
      const config = new OrbitControlConfig({
        enableRotate: true,
        enablePan: true,
        enableZoom: true,
      });

      // Simulate player interaction disabling rotation temporarily
      config.enableRotate = false;
      expect(config.enableRotate).toBe(false);
      expect(config.enablePan).toBe(true); // Other features unaffected

      // Re-enable rotation
      config.enableRotate = true;
      expect(config.enableRotate).toBe(true);
    });
  });

  describe("Speed Configuration During Gameplay", () => {
    it("should allow adjusting sensitivity for accessibility", () => {
      const config = new OrbitControlConfig({
        rotateSpeed: 1,
        panSpeed: 1,
        zoomSpeed: 1,
      });

      // High sensitivity for experienced players
      config.rotateSpeed = 1.5;
      config.panSpeed = 1.5;
      config.zoomSpeed = 1.5;

      expect(config.rotateSpeed).toBe(1.5);
      expect(config.panSpeed).toBe(1.5);
      expect(config.zoomSpeed).toBe(1.5);

      // Low sensitivity for accessibility
      config.rotateSpeed = 0.5;
      config.panSpeed = 0.5;
      config.zoomSpeed = 0.5;

      expect(config.rotateSpeed).toBe(0.5);
      expect(config.panSpeed).toBe(0.5);
      expect(config.zoomSpeed).toBe(0.5);
    });

    it("should support independent speed adjustments", () => {
      const config = new OrbitControlConfig();

      config.rotateSpeed = 2;
      expect(config.panSpeed).not.toBe(2); // Other speeds unchanged

      config.panSpeed = 0.5;
      expect(config.rotateSpeed).toBe(2); // Rotation unchanged
      expect(config.zoomSpeed).not.toBe(0.5); // Zoom unchanged
    });
  });
});
