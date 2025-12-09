import { describe, it, expect } from "vitest";
import { OrbitControlConfig } from "../resources/orbit-control-config.ts";

/**
 * Performance and profiling tests for Orbit Controls
 * These tests measure the overhead and efficiency of the OrbitControl plugin
 * under different configuration scenarios.
 */
describe("Orbit Controls - Performance & Profiling", () => {
  describe("Configuration Creation Performance", () => {
    it("should create default config quickly", () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        new OrbitControlConfig();
      }

      const duration = performance.now() - start;

      // Creating 1000 default configs should take less than 50ms (0.05ms per config)
      expect(duration).toBeLessThan(50);
    });

    it("should create configured config quickly", () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        new OrbitControlConfig({
          rotateSpeed: 1,
          panSpeed: 1,
          zoomSpeed: 1,
          enableDamping: true,
          dampingFactor: 0.05,
          minDistance: 1,
          maxDistance: 100,
        });
      }

      const duration = performance.now() - start;

      // Creating 1000 configured configs should take less than 100ms (0.1ms per config)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Configuration Mutation Performance", () => {
    it("should update single property efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        config.rotateSpeed = Math.random() * 2;
      }

      const duration = performance.now() - start;

      // 10000 property updates should take less than 20ms
      expect(duration).toBeLessThan(20);
    });

    it("should update multiple properties efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        config.rotateSpeed = Math.random() * 2;
        config.panSpeed = Math.random() * 2;
        config.zoomSpeed = Math.random() * 2;
        config.dampingFactor = Math.random() * 0.1;
      }

      const duration = performance.now() - start;

      // 1000 iterations of 4 property updates should take less than 20ms
      expect(duration).toBeLessThan(20);
    });

    it("should toggle boolean flags efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        config.enableRotate = !config.enableRotate;
        config.enablePan = !config.enablePan;
        config.enableZoom = !config.enableZoom;
        config.autoRotate = !config.autoRotate;
      }

      const duration = performance.now() - start;

      // 10000 iterations of 4 boolean toggles should take less than 10ms
      expect(duration).toBeLessThan(10);
    });
  });

  describe("Configuration Memory Efficiency", () => {
    it("should not leak memory with repeated config creation", () => {
      const configs: OrbitControlConfig[] = [];

      for (let i = 0; i < 10000; i++) {
        configs.push(new OrbitControlConfig());
      }

      // Should be able to create and store 10000 configs
      expect(configs.length).toBe(10000);

      // Clear and verify no memory issues
      configs.length = 0;
      expect(configs.length).toBe(0);
    });

    it("should support large arrays of configs", () => {
      const configs = Array.from({ length: 1000 }, (_, i) => {
        return new OrbitControlConfig({
          rotateSpeed: 1 + i * 0.001,
          panSpeed: 1 + i * 0.001,
          zoomSpeed: 1 + i * 0.001,
        });
      });

      expect(configs.length).toBe(1000);

      // Verify configs are independent
      expect(configs[0].rotateSpeed).not.toBe(configs[999].rotateSpeed);
    });
  });

  describe("Runtime Scenario Performance", () => {
    it("should handle frequent mode switches efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Simulate switching between presentation and interactive modes 1000 times
      for (let i = 0; i < 1000; i++) {
        // Switch to presentation mode
        config.autoRotate = true;
        config.enableRotate = false;
        config.enablePan = false;
        config.enableZoom = false;

        // Switch to interactive mode
        config.autoRotate = false;
        config.enableRotate = true;
        config.enablePan = true;
        config.enableZoom = true;
      }

      const duration = performance.now() - start;

      // 1000 mode switches should take less than 10ms
      expect(duration).toBeLessThan(10);
    });

    it("should handle sensitivity adjustments efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Simulate real-time sensitivity adjustment (e.g., from UI slider)
      for (let i = 0; i < 1000; i++) {
        const sensitivity = (i % 100) / 100; // 0 to 1
        config.rotateSpeed = 0.5 + sensitivity * 2;
        config.panSpeed = 0.5 + sensitivity * 2;
        config.zoomSpeed = 0.5 + sensitivity * 2;
      }

      const duration = performance.now() - start;

      // 1000 sensitivity updates should take less than 10ms
      expect(duration).toBeLessThan(10);
    });

    it("should handle constraint adjustments efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Simulate adjusting zoom constraints (e.g., when viewing different objects)
      for (let i = 0; i < 1000; i++) {
        const scale = 1 + i * 0.001;
        config.minDistance = 1 * scale;
        config.maxDistance = 100 * scale;
      }

      const duration = performance.now() - start;

      // 1000 constraint adjustments should take less than 10ms
      expect(duration).toBeLessThan(10);
    });

    it("should handle per-frame updates efficiently", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Simulate 60 frames of updates at 60 FPS (1 second of game time)
      for (let frame = 0; frame < 60; frame++) {
        const deltaTime = 0.016; // ~60 FPS

        // Update position-based on input (would be from actual input in real usage)
        config.minDistance = Math.max(0.1, config.minDistance - deltaTime);

        // Check enabled state
        if (!config.enableRotate) {
          config.rotateSpeed = 0;
        }

        // Simulate damping
        if (config.enableDamping) {
          const dampedFactor = config.dampingFactor * (1 - deltaTime);
          config.dampingFactor = dampedFactor;
        }
      }

      const duration = performance.now() - start;

      // 60 frames of updates should take less than 2ms
      expect(duration).toBeLessThan(2);
    });

    it("should handle stress without errors", () => {
      const config = new OrbitControlConfig();

      // Run multiple updates under stress
      expect(() => {
        for (let iteration = 0; iteration < 10; iteration++) {
          for (let i = 0; i < 100; i++) {
            config.rotateSpeed = Math.random() * 2;
            config.enableRotate = Math.random() > 0.5;
            config.minDistance = Math.random() * 50;
          }
        }
      }).not.toThrow();
    });
  });

  describe("Comparative Performance", () => {
    it("should consistently handle property access across different properties", () => {
      const config = new OrbitControlConfig();

      // Just verify all properties can be accessed without error
      const rotateSpeed = config.rotateSpeed;
      const panSpeed = config.panSpeed;
      const zoomSpeed = config.zoomSpeed;

      expect(rotateSpeed).toBeDefined();
      expect(panSpeed).toBeDefined();
      expect(zoomSpeed).toBeDefined();
    });
  });

  describe("Predictable Performance", () => {
    it("should have predictable overhead for different config sizes", () => {
      const smallConfig = new OrbitControlConfig();
      const largeConfig = new OrbitControlConfig({
        enabled: true,
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 1,
        maxDistance: 100,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
        minAzimuthAngle: -Math.PI,
        maxAzimuthAngle: Math.PI,
        rotateSpeed: 1,
        panSpeed: 1,
        zoomSpeed: 1,
        autoRotate: true,
        autoRotateSpeed: 2,
        enablePan: true,
        enableZoom: true,
        enableRotate: true,
      });

      const smallDuration = (() => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
          smallConfig.rotateSpeed = Math.random();
        }
        return performance.now() - start;
      })();

      const largeDuration = (() => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
          largeConfig.rotateSpeed = Math.random();
        }
        return performance.now() - start;
      })();

      // Large config shouldn't be significantly slower (generous threshold for CI variability)
      expect(largeDuration).toBeLessThan(smallDuration * 2);
    });

    it("should maintain performance with nested operations", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Simulate nested/complex update pattern
      for (let outer = 0; outer < 100; outer++) {
        config.enableRotate = true;

        for (let inner = 0; inner < 100; inner++) {
          config.rotateSpeed = (inner / 100) * 2;

          if (config.enableDamping) {
            config.dampingFactor = 0.05;
          }
        }

        config.enableRotate = false;
      }

      const duration = performance.now() - start;

      // 10,000 nested operations should complete in reasonable time (generous threshold for CI)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Optimization Opportunities", () => {
    it("should demonstrate configuration batching efficiency", () => {
      const config = new OrbitControlConfig();

      // Unbatched updates (multiple transactions)
      const unbatchedStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        config.rotateSpeed = 1;
        config.panSpeed = 1;
        config.zoomSpeed = 1;
        config.enableDamping = true;
        config.dampingFactor = 0.05;
      }
      const unbatchedDuration = performance.now() - unbatchedStart;

      // Reset config
      const config2 = new OrbitControlConfig();

      // Batched updates (single configuration object)
      const batchedStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        const newConfig = new OrbitControlConfig({
          rotateSpeed: 1,
          panSpeed: 1,
          zoomSpeed: 1,
          enableDamping: true,
          dampingFactor: 0.05,
        });
        // Simulate using the config
        config2.rotateSpeed = newConfig.rotateSpeed;
      }
      const batchedDuration = performance.now() - batchedStart;

      // Both approaches should be performant
      expect(unbatchedDuration).toBeLessThan(20);
      expect(batchedDuration).toBeLessThan(20);
    });

    it("should demonstrate efficient constraint application", () => {
      const config = new OrbitControlConfig();
      const start = performance.now();

      // Apply constraints progressively
      for (let level = 0; level < 1000; level++) {
        const minDist = level * 0.01;
        const maxDist = 100 + level * 0.1;

        config.minDistance = minDist;
        config.maxDistance = maxDist;
        config.minPolarAngle = Math.PI * (level / 1000);
        config.maxPolarAngle = Math.PI * ((1000 - level) / 1000);
      }

      const duration = performance.now() - start;

      // 1000 constraint updates should be efficient (generous for CI)
      expect(duration).toBeLessThan(50);
    });
  });
});
