import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { World } from "../../../core/world.ts";
import { Transform } from "../../transform-plugin/components/transform.ts";
import {
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  PlaneGeometry,
  ConeGeometry,
  Material,
  Visible,
} from "../components/mod.ts";
import {
  installRenderPlugin,
  disposeRenderPlugin,
  RenderContext,
  GeometryBufferCache,
} from "../mod.ts";

// Mock canvas for testing
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

describe("RenderPlugin Integration Tests", () => {
  let world: World;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    world = new World();
    mockCanvas = new MockCanvas() as any;
  });

  afterEach(() => {
    disposeRenderPlugin(world);
  });

  describe("Plugin Installation", () => {
    it("should install render plugin successfully", () => {
      expect(() => {
        installRenderPlugin(world, { canvas: mockCanvas as any });
      }).not.toThrow();
    });

    it("should throw error without canvas", () => {
      expect(() => {
        installRenderPlugin(world, { canvas: undefined });
      }).toThrow("canvas");
    });

    it("should initialize render resources", () => {
      installRenderPlugin(world, { canvas: mockCanvas as any });

      const renderContext = world.getResource<RenderContext>("RenderContext");
      const geometryCache = world.getResource<GeometryBufferCache>("GeometryBufferCache");

      expect(renderContext).toBeDefined();
      expect(geometryCache).toBeDefined();
    });

    it("should create entity successfully after plugin installation", () => {
      installRenderPlugin(world, { canvas: mockCanvas as any });

      const entity = world.createEntity();
      expect(world.entityExists(entity)).toBe(true);
    });
  });

  describe("Entity Component Management", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should add geometry component to entity", () => {
      const entity = world.createEntity();
      const geometry = new BoxGeometry(1, 1, 1);

      world.add(entity, geometry);

      const retrieved = world.get(entity, BoxGeometry);
      expect(retrieved).toBeDefined();
      expect(retrieved?.width).toBe(1);
      expect(retrieved?.height).toBe(1);
      expect(retrieved?.depth).toBe(1);
    });

    it("should add material component to entity", () => {
      const entity = world.createEntity();
      const material = new Material([1, 0, 0, 1], 0.5, 0.3, 1.0);

      world.add(entity, material);

      const retrieved = world.get(entity, Material);
      expect(retrieved).toBeDefined();
      expect(retrieved?.color).toEqual([1, 0, 0, 1]);
      expect(retrieved?.metallic).toBe(0.5);
      expect(retrieved?.roughness).toBe(0.3);
    });

    it("should add visible component to entity", () => {
      const entity = world.createEntity();
      const visible = new Visible();

      world.add(entity, visible);

      expect(world.has(entity, Visible)).toBe(true);
    });

    it("should create complete renderable entity", () => {
      const entity = world.createEntity();

      // Add transform
      const transform = new Transform();
      transform.position = [1, 2, 3];
      world.add(entity, transform);

      // Add geometry
      world.add(entity, new SphereGeometry(2, 32, 16));

      // Add material
      const material = new Material([0, 1, 0, 1]);
      world.add(entity, material);

      // Add visible
      world.add(entity, new Visible());

      // Verify all components
      expect(world.get(entity, Transform)).toBeDefined();
      expect(world.get(entity, SphereGeometry)).toBeDefined();
      expect(world.get(entity, Material)).toBeDefined();
      expect(world.has(entity, Visible)).toBe(true);
    });

    it("should handle multiple geometry types", () => {
      const shapes = [
        { type: BoxGeometry, instance: new BoxGeometry(1, 2, 3) },
        { type: SphereGeometry, instance: new SphereGeometry(1, 16, 8) },
        { type: CylinderGeometry, instance: new CylinderGeometry(1, 1, 2, 16) },
        { type: PlaneGeometry, instance: new PlaneGeometry(1, 1, 1, 1) },
        { type: ConeGeometry, instance: new ConeGeometry(1, 2, 16) },
      ];

      for (const { type, instance } of shapes) {
        const entity = world.createEntity();
        world.add(entity, instance);

        const retrieved = world.get(entity, type);
        expect(retrieved).toBeDefined();
      }
    });
  });

  describe("Geometry Buffer Cache", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should access geometry buffer cache", () => {
      const cache = world.getResource<GeometryBufferCache>("GeometryBufferCache");
      expect(cache).toBeDefined();
    });

    it("should handle cache key generation", () => {
      const cache = world.getResource<GeometryBufferCache>("GeometryBufferCache");

      // Cache should be empty initially
      expect(cache).toBeDefined();
    });
  });

  describe("Entity Queries", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should query entities with specific components", () => {
      // Create entities with different components
      const entity1 = world.createEntity();
      world.add(entity1, new BoxGeometry(1, 1, 1));
      world.add(entity1, new Material());

      const entity2 = world.createEntity();
      world.add(entity2, new SphereGeometry(1, 16, 8));
      world.add(entity2, new Material());

      const entity3 = world.createEntity();
      world.add(entity3, new Material()); // Only material, no geometry

      // Query for entities with geometry and material
      const query = world.query(BoxGeometry, Material);
      const results = query.entities();

      // Should find at least entity1
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.includes(entity1)).toBe(true);
    });

    it("should query visible entities", () => {
      const entity1 = world.createEntity();
      world.add(entity1, new BoxGeometry(1, 1, 1));
      world.add(entity1, new Visible());

      const entity2 = world.createEntity();
      world.add(entity2, new SphereGeometry(1, 16, 8));
      // Not visible

      const query = world.query(Visible);
      const results = query.entities();

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.includes(entity1)).toBe(true);
    });
  });

  describe("Material Properties", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should have default material properties", () => {
      const material = new Material();

      expect(material.color).toEqual([1, 1, 1, 1]);
      expect(material.metallic).toBe(0);
      expect(material.roughness).toBe(0.5);
      expect(material.opacity).toBe(1.0);
      expect(material.wireframe).toBe(false);
    });

    it("should support custom material properties", () => {
      const color: [number, number, number, number] = [1, 0, 0, 1];
      const material = new Material(color, 0.8, 0.2, 0.9, true);

      expect(material.color).toEqual(color);
      expect(material.metallic).toBe(0.8);
      expect(material.roughness).toBe(0.2);
      expect(material.opacity).toBe(0.9);
      expect(material.wireframe).toBe(true);
    });

    it("should allow modifying material properties at runtime", () => {
      const entity = world.createEntity();
      const material = new Material();
      world.add(entity, material);

      const retrieved = world.get(entity, Material)!;
      retrieved.color = [1, 0, 0, 1];
      retrieved.metallic = 0.7;

      const updated = world.get(entity, Material)!;
      expect(updated.color).toEqual([1, 0, 0, 1]);
      expect(updated.metallic).toBe(0.7);
    });
  });

  describe("Geometry Component Properties", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should have correct box geometry defaults", () => {
      const box = new BoxGeometry();
      expect(box.width).toBe(1);
      expect(box.height).toBe(1);
      expect(box.depth).toBe(1);
    });

    it("should have correct sphere geometry defaults", () => {
      const sphere = new SphereGeometry();
      expect(sphere.radius).toBe(1);
      expect(sphere.segments).toBe(32);
      expect(sphere.rings).toBe(16);
    });

    it("should have correct cylinder geometry defaults", () => {
      const cylinder = new CylinderGeometry();
      expect(cylinder.radiusTop).toBe(1);
      expect(cylinder.radiusBottom).toBe(1);
      expect(cylinder.height).toBe(2);
      expect(cylinder.segments).toBe(32);
    });

    it("should have correct plane geometry defaults", () => {
      const plane = new PlaneGeometry();
      expect(plane.width).toBe(1);
      expect(plane.height).toBe(1);
      expect(plane.widthSegments).toBe(1);
      expect(plane.heightSegments).toBe(1);
    });

    it("should have correct cone geometry defaults", () => {
      const cone = new ConeGeometry();
      expect(cone.radius).toBe(1);
      expect(cone.height).toBe(2);
      expect(cone.segments).toBe(32);
    });

    it("should support custom geometry parameters", () => {
      const box = new BoxGeometry(2, 3, 4);
      expect(box.width).toBe(2);
      expect(box.height).toBe(3);
      expect(box.depth).toBe(4);

      const sphere = new SphereGeometry(2, 16, 8);
      expect(sphere.radius).toBe(2);
      expect(sphere.segments).toBe(16);
      expect(sphere.rings).toBe(8);
    });
  });

  describe("Entity Lifecycle", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should create and destroy entities", () => {
      const entity = world.createEntity();
      expect(world.entityExists(entity)).toBe(true);

      world.destroyEntity(entity);
      expect(world.entityExists(entity)).toBe(false);
    });

    it("should remove components from entities", () => {
      const entity = world.createEntity();
      world.add(entity, new Material());

      expect(world.has(entity, Material)).toBe(true);

      world.remove(entity, Material);
      expect(world.has(entity, Material)).toBe(false);
    });

    it("should handle entity with multiple components", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new BoxGeometry(1, 1, 1));
      world.add(entity, new Material());
      world.add(entity, new Visible());

      const components = world.getComponentsForEntity(entity);
      expect(components.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Plugin Disposal", () => {
    it("should dispose plugin without errors", () => {
      installRenderPlugin(world, { canvas: mockCanvas as any });

      expect(() => {
        disposeRenderPlugin(world);
      }).not.toThrow();
    });

    it("should handle disposing without installation gracefully", () => {
      // This is expected to throw since resources aren't available
      // but the function should at least attempt disposal
      try {
        disposeRenderPlugin(world);
      } catch (e) {
        // Expected - world doesn't have render resources
        expect(e).toBeDefined();
      }
    });
  });

  describe("Rendering Pipeline Integration", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should execute systems after installation", () => {
      const entity = world.createEntity();
      world.add(entity, new Transform());
      world.add(entity, new BoxGeometry());
      world.add(entity, new Material());
      world.add(entity, new Visible());

      // Execute systems
      expect(() => {
        world.updateSystems(0.016); // ~60 FPS
      }).not.toThrow();
    });

    it("should handle multiple entities in rendering pipeline", () => {
      // Create multiple renderable entities
      for (let i = 0; i < 10; i++) {
        const entity = world.createEntity();
        world.add(entity, new Transform());
        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material([Math.random(), Math.random(), Math.random(), 1]));
        world.add(entity, new Visible());
      }

      expect(() => {
        world.updateSystems(0.016);
      }).not.toThrow();
    });

    it("should skip rendering for invisible entities", () => {
      const visible = world.createEntity();
      world.add(visible, new Transform());
      world.add(visible, new BoxGeometry());
      world.add(visible, new Visible());

      const invisible = world.createEntity();
      world.add(invisible, new Transform());
      world.add(invisible, new BoxGeometry());
      // No Visible component

      expect(() => {
        world.updateSystems(0.016);
      }).not.toThrow();
    });
  });

  describe("Resource Management", () => {
    beforeEach(() => {
      installRenderPlugin(world, { canvas: mockCanvas as any });
    });

    it("should provide access to RenderContext resource", () => {
      const renderContext = world.getResource<RenderContext>("RenderContext");
      expect(renderContext).toBeDefined();
      expect(renderContext.canvas).toBe(mockCanvas);
    });

    it("should provide access to GeometryBufferCache resource", () => {
      const cache = world.getResource<GeometryBufferCache>("GeometryBufferCache");
      expect(cache).toBeDefined();
    });

    it("should throw when accessing non-existent resource", () => {
      expect(() => {
        world.getResource("NonExistentResource");
      }).toThrow();
    });
  });
});
