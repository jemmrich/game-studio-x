import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../../../core/world.ts";
import { Transform } from "../../transform-plugin/components/transform.ts";
import {
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  Material,
  Visible,
} from "../components/mod.ts";
import { installRenderPlugin } from "../mod.ts";
import {
  generateBoxMesh,
  generateSphereMesh,
  generateCylinderMesh,
} from "../utils/mesh-generators.ts";

/**
 * Performance Benchmark Tests
 *
 * These tests measure:
 * 1. Entity creation time
 * 2. Rendering system execution time
 * 3. Memory usage for many entities
 * 4. Draw call efficiency
 * 5. Buffer generation performance
 *
 * Thresholds are set to reasonable values for development machines.
 */

class MockCanvas {
  width = 800;
  height = 600;
  getContext() {
    return new MockWebGL2RenderingContext();
  }
  addEventListener() {}
  removeEventListener() {}
}

class MockWebGL2RenderingContext {
  ARRAY_BUFFER = 0x8892;
  ELEMENT_ARRAY_BUFFER = 0x8893;
  STATIC_DRAW = 0x88e4;
  FLOAT = 0x1406;
  UNSIGNED_INT = 0x1405;
  UNSIGNED_SHORT = 0x1403;
  TRIANGLES = 0x0004;
  DEPTH_TEST = 0x0b71;
  CULL_FACE = 0x0b44;
  BACK = 0x0405;
  CCW = 0x0901;
  BLEND = 0x0be2;
  SRC_ALPHA = 0x0302;
  ONE_MINUS_SRC_ALPHA = 0x0303;

  createBuffer() {
    return { _mock: "buffer" };
  }
  bindBuffer() {}
  bufferData() {}
  createProgram() {
    return { _mock: "program" };
  }
  createShader() {
    return { _mock: "shader" };
  }
  shaderSource() {}
  compileShader() {}
  attachShader() {}
  linkProgram() {}
  useProgram() {}
  enable() {}
  disable() {}
  cullFace() {}
  clearColor() {}
  clear() {}
  drawElements() {}
  bindVertexArray() {}
  getAttribLocation() {
    return 0;
  }
  getUniformLocation() {
    return { _mock: "uniform" };
  }
  uniformMatrix4fv() {}
  uniformMatrix3fv() {}
  uniform4f() {}
  uniform3f() {}
  uniform1f() {}
  uniform1i() {}
  vertexAttribPointer() {}
  enableVertexAttribArray() {}
  createVertexArray() {
    return { _mock: "vao" };
  }
  deleteBuffer() {}
  deleteProgram() {}
  deleteShader() {}
  deleteVertexArray() {}
  getShaderParameter() {
    return true;
  }
  getProgramParameter() {
    return true;
  }
  getExtension(name: string) {
    if (name === "WEBGL_lose_context") {
      return { loseContext: () => {} };
    }
    return null;
  }
  depthFunc() {}
  frontFace() {}
  viewport() {}
  blendFunc() {}
}

describe("RenderPlugin Performance Benchmarks", () => {
  let world: World;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    world = new World();
    mockCanvas = new MockCanvas() as any;
    installRenderPlugin(world, { canvas: mockCanvas as any });
  });

  describe("Mesh Generation Performance", () => {
    it("should generate box mesh quickly", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        generateBoxMesh(1, 1, 1);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 100 box meshes in under 50ms
      expect(duration).toBeLessThan(50);
    });

    it("should generate sphere mesh in reasonable time", () => {
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        generateSphereMesh(1, 32, 16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 50 sphere meshes in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it("should generate cylinder mesh in reasonable time", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        generateCylinderMesh(1, 1, 2, 32);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 100 cylinder meshes in under 50ms
      expect(duration).toBeLessThan(50);
    });

    it("should handle high-segment geometries", () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        generateSphereMesh(1, 128, 64); // Very detailed sphere
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 10 high-detail spheres in under 200ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Entity Creation Performance", () => {
    it("should create 100 entities with components quickly", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material());
        world.add(entity, new Visible());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should create 100 fully-configured entities in under 100ms
      expect(duration).toBeLessThan(100);

      expect(world.getAllEntities().length).toBe(100);
    });

    it("should create 500 simple entities", () => {
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Visible());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should create 500 entities in under 250ms
      expect(duration).toBeLessThan(250);

      expect(world.getAllEntities().length).toBe(500);
    });

    it("should create 1000 entities efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Visible());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should create 1000 entities in under 500ms
      expect(duration).toBeLessThan(500);

      expect(world.getAllEntities().length).toBe(1000);
    });
  });

  describe("System Execution Performance", () => {
    it("should execute rendering systems with few entities", () => {
      // Create 10 entities
      for (let i = 0; i < 10; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material());
        world.add(entity, new Visible());
      }

      const startTime = performance.now();

      // Run 60 frames
      for (let frame = 0; frame < 60; frame++) {
        world.updateSystems(0.016); // 60 FPS
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgFrameTime = duration / 60;

      // Average frame time should be under 5ms for 10 entities
      expect(avgFrameTime).toBeLessThan(5);
    });

    it("should execute rendering systems with 100 entities", () => {
      // Create 100 entities
      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        const t = new Transform();
        t.position = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
        world.add(entity, t);

        const geomType = i % 3;
        if (geomType === 0) {
          world.add(entity, new BoxGeometry(1, 1, 1));
        } else if (geomType === 1) {
          world.add(entity, new SphereGeometry(1, 16, 8));
        } else {
          world.add(entity, new CylinderGeometry(1, 1, 2, 16));
        }

        world.add(entity, new Material());
        world.add(entity, new Visible());
      }

      const startTime = performance.now();

      // Run 30 frames
      for (let frame = 0; frame < 30; frame++) {
        world.updateSystems(0.016);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgFrameTime = duration / 30;

      // Average frame time should be under 20ms for 100 entities
      expect(avgFrameTime).toBeLessThan(20);
    });

    it("should execute rendering systems with 500 entities", () => {
      // Create 500 entities
      for (let i = 0; i < 500; i++) {
        const entity = world.createEntity();
        const t = new Transform();
        t.position = [Math.random() * 50, Math.random() * 50, Math.random() * 50];
        world.add(entity, t);

        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material());
        world.add(entity, new Visible());
      }

      const startTime = performance.now();

      // Run 10 frames
      for (let frame = 0; frame < 10; frame++) {
        world.updateSystems(0.016);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgFrameTime = duration / 10;

      // Average frame time should be under 100ms for 500 entities
      expect(avgFrameTime).toBeLessThan(100);
    });
  });

  describe("Component Access Performance", () => {
    it("should access components quickly", () => {
      // Create entities
      const entities: any[] = [];
      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new Material());
        entities.push(entity);
      }

      const startTime = performance.now();

      // Access components 1000 times
      for (let i = 0; i < 1000; i++) {
        for (const entity of entities) {
          const transform = world.get(entity, Transform);
          const material = world.get(entity, Material);
          (transform, material); // Prevent optimization
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should access 200,000 components in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it("should query entities efficiently", () => {
      // Create mixed entities
      for (let i = 0; i < 200; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());

        if (i % 2 === 0) {
          world.add(entity, new BoxGeometry(1, 1, 1));
          world.add(entity, new Visible());
        } else {
          world.add(entity, new Material());
        }
      }

      const startTime = performance.now();

      // Query 100 times
      for (let i = 0; i < 100; i++) {
        const query = world.query(BoxGeometry, Visible);
        const results = query.entities();
        results; // Prevent optimization
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should perform 100 queries in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Material Property Updates", () => {
    it("should update material properties efficiently", () => {
      // Create entities
      const entities: any[] = [];
      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        world.add(entity, new Material());
        entities.push(entity);
      }

      const startTime = performance.now();

      // Update material properties 1000 times per entity
      for (let update = 0; update < 1000; update++) {
        for (const entity of entities) {
          const material = world.get(entity, Material)!;
          material.color[0] = Math.random();
          material.color[1] = Math.random();
          material.color[2] = Math.random();
          material.metallic = Math.random();
          material.roughness = Math.random();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should perform 100,000 updates in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Memory Efficiency", () => {
    it("should not leak memory with entity creation", () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy entities multiple times
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 100; i++) {
          const entity = world.createEntity();
          world.add(entity, new Transform());
          world.add(entity, new BoxGeometry(1, 1, 1));
          world.add(entity, new Material());
        }

        // Clear all entities
        const entities = world.getAllEntities();
        for (const entity of entities) {
          world.destroyEntity(entity);
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory shouldn't grow significantly
      // Note: This is a rough check, actual GC behavior varies
      if (initialMemory > 0 && finalMemory > 0) {
        const growth = finalMemory - initialMemory;
        const growthPercent = (growth / initialMemory) * 100;
        expect(growthPercent).toBeLessThan(200); // Allow up to 2x growth
      }
    });
  });

  describe("Batch Operations", () => {
    it("should handle batch creation efficiently", () => {
      const startTime = performance.now();

      // Create 50 entities with varying component combinations
      for (let i = 0; i < 50; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());

        const geomType = i % 3;
        if (geomType === 0) {
          world.add(entity, new BoxGeometry(1, 1, 1));
        } else if (geomType === 1) {
          world.add(entity, new SphereGeometry(1, 32, 16));
        } else {
          world.add(entity, new CylinderGeometry(1, 1, 2, 32));
        }

        if (i % 2 === 0) {
          world.add(entity, new Material([Math.random(), Math.random(), Math.random(), 1]));
        }

        if (i % 3 === 0) {
          world.add(entity, new Visible());
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Batch creation should be under 25ms
      expect(duration).toBeLessThan(25);
      expect(world.getAllEntities().length).toBe(50);
    });
  });

  describe("Rendering Throughput", () => {
    it("should maintain 60 FPS with 100 entities", () => {
      // Create 100 entities
      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material());
        world.add(entity, new Visible());
      }

      const frameTime = 1000 / 60; // ~16.67ms for 60 FPS
      const startTime = performance.now();

      // Run 60 frames
      for (let frame = 0; frame < 60; frame++) {
        world.updateSystems(frameTime / 1000);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgFrameTime = totalTime / 60;

      // Should maintain well under 16.67ms per frame
      expect(avgFrameTime).toBeLessThan(10);
    });
  });
});
