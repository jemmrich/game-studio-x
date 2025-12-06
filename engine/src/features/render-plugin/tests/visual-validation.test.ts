import { describe, it, expect, beforeEach } from "vitest";
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
import { installRenderPlugin } from "../mod.ts";
import {
  generateBoxMesh,
  generateSphereMesh,
  generateCylinderMesh,
  generatePlaneMesh,
  generateConeMesh,
} from "../utils/mesh-generators.ts";

/**
 * Visual Validation Tests
 *
 * These tests verify that:
 * 1. Shapes are generated with correct vertex/normal data
 * 2. Materials are properly applied
 * 3. Transform positions are correct
 * 4. Combinations of shapes and materials produce expected results
 *
 * Note: These are validation tests that check data correctness,
 * not pixel-perfect rendering tests.
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

describe("RenderPlugin Visual Validation Tests", () => {
  let world: World;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    world = new World();
    mockCanvas = new MockCanvas() as any;
    installRenderPlugin(world, { canvas: mockCanvas as any });
  });

  describe("Box Geometry Visual Validation", () => {
    it("should render red box with correct appearance", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [0, 0, -5];
      world.add(entity, transform);

      const geometry = new BoxGeometry(1, 1, 1);
      world.add(entity, geometry);

      const material = new Material([1, 0, 0, 1]); // Red
      world.add(entity, material);

      world.add(entity, new Visible());

      // Verify entity has all components
      expect(world.get(entity, Transform)?.position).toEqual([0, 0, -5]);
      expect(world.get(entity, BoxGeometry)).toBeDefined();
      expect(world.get(entity, Material)?.color).toEqual([1, 0, 0, 1]);
      expect(world.has(entity, Visible)).toBe(true);

      // Verify mesh generation
      const meshData = generateBoxMesh(1, 1, 1);
      expect(meshData.positions.length).toBe(72); // 24 vertices * 3
      expect(meshData.indices.length).toBe(36); // 12 triangles * 3
    });

    it("should render box with custom dimensions", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [0, 0, 0];
      world.add(entity, transform);

      const geometry = new BoxGeometry(2, 3, 4);
      world.add(entity, geometry);

      world.add(entity, new Material([0.5, 0.5, 0.5, 1])); // Gray
      world.add(entity, new Visible());

      const retrieved = world.get(entity, BoxGeometry)!;
      expect(retrieved.width).toBe(2);
      expect(retrieved.height).toBe(3);
      expect(retrieved.depth).toBe(4);

      // Verify mesh respects dimensions
      const meshData = generateBoxMesh(2, 3, 4);
      const positions = meshData.positions;

      // Find max/min coordinates
      let maxX = -Infinity,
        minX = Infinity;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        maxX = Math.max(maxX, x);
        minX = Math.min(minX, x);
      }

      expect(maxX - minX).toBeCloseTo(2, 1);
    });

    it("should render transparent box", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new BoxGeometry(1, 1, 1));

      const material = new Material([1, 1, 0, 0.5]); // Yellow with 50% opacity
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.opacity).toBe(1.0);
      expect(retrieved.color[3]).toBe(0.5); // Alpha in color
    });
  });

  describe("Sphere Geometry Visual Validation", () => {
    it("should render sphere with correct properties", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new SphereGeometry(1, 32, 16));

      const material = new Material([0, 0, 1, 1]); // Blue
      world.add(entity, material);

      world.add(entity, new Visible());

      const geometry = world.get(entity, SphereGeometry)!;
      expect(geometry.radius).toBe(1);
      expect(geometry.segments).toBe(32);
      expect(geometry.rings).toBe(16);

      // Verify mesh generation
      const meshData = generateSphereMesh(1, 32, 16);
      const vertexCount = (32 + 1) * (16 + 1);
      expect(meshData.positions.length).toBe(vertexCount * 3);

      // All vertices should be on sphere surface
      for (let i = 0; i < meshData.positions.length; i += 3) {
        const x = meshData.positions[i];
        const y = meshData.positions[i + 1];
        const z = meshData.positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);
        expect(distance).toBeCloseTo(1, 1);
      }
    });

    it("should render large sphere", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [5, 0, 0];
      world.add(entity, transform);

      world.add(entity, new SphereGeometry(5, 64, 32));
      world.add(entity, new Material([1, 0, 1, 1])); // Magenta
      world.add(entity, new Visible());

      const geometry = world.get(entity, SphereGeometry)!;
      expect(geometry.radius).toBe(5);

      // Verify mesh for large sphere
      const meshData = generateSphereMesh(5, 64, 32);
      for (let i = 0; i < Math.min(meshData.positions.length, 300); i += 3) {
        const x = meshData.positions[i];
        const y = meshData.positions[i + 1];
        const z = meshData.positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);
        expect(distance).toBeCloseTo(5, 0);
      }
    });

    it("should render metallic sphere", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new SphereGeometry(1, 32, 16));

      const material = new Material([0.8, 0.8, 0.8, 1], 1.0, 0.1);
      material.shaderId = "metallic";
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.metallic).toBe(1.0);
      expect(retrieved.roughness).toBe(0.1);
      expect(retrieved.shaderId).toBe("metallic");
    });
  });

  describe("Cylinder Geometry Visual Validation", () => {
    it("should render cylinder with correct proportions", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new CylinderGeometry(1, 1, 2, 32));

      world.add(entity, new Material([0, 1, 0, 1])); // Green
      world.add(entity, new Visible());

      const geometry = world.get(entity, CylinderGeometry)!;
      expect(geometry.radiusTop).toBe(1);
      expect(geometry.radiusBottom).toBe(1);
      expect(geometry.height).toBe(2);
      expect(geometry.segments).toBe(32);

      // Verify mesh
      const meshData = generateCylinderMesh(1, 1, 2, 32);
      expect(meshData.positions.length).toBeGreaterThan(0);
      expect(meshData.indices.length % 3).toBe(0);
    });

    it("should render tapered cylinder (cone-like)", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new CylinderGeometry(1, 0.1, 2, 32));

      world.add(entity, new Material([1, 1, 0, 1])); // Yellow
      world.add(entity, new Visible());

      const geometry = world.get(entity, CylinderGeometry)!;
      expect(geometry.radiusTop).toBe(1);
      expect(geometry.radiusBottom).toBe(0.1);
    });

    it("should render tall cylinder", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [-5, 0, 0];
      world.add(entity, transform);

      world.add(entity, new CylinderGeometry(0.5, 0.5, 5, 16));
      world.add(entity, new Material([1, 0.5, 0, 1])); // Orange
      world.add(entity, new Visible());

      const geometry = world.get(entity, CylinderGeometry)!;
      expect(geometry.height).toBe(5);
    });
  });

  describe("Plane Geometry Visual Validation", () => {
    it("should render plane with correct dimensions", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new PlaneGeometry(2, 3, 2, 2));

      world.add(entity, new Material([0.5, 0.5, 1, 1])); // Light blue
      world.add(entity, new Visible());

      const geometry = world.get(entity, PlaneGeometry)!;
      expect(geometry.width).toBe(2);
      expect(geometry.height).toBe(3);

      // Verify mesh
      const meshData = generatePlaneMesh(2, 3, 2, 2);
      const vertexCount = (2 + 1) * (2 + 1); // (widthSegments + 1) * (heightSegments + 1)
      expect(meshData.positions.length).toBe(vertexCount * 3);
    });

    it("should render grid plane", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [0, -1, 0];
      world.add(entity, transform);

      world.add(entity, new PlaneGeometry(10, 10, 10, 10));
      world.add(entity, new Material([0.8, 0.8, 0.8, 1]));
      world.add(entity, new Visible());

      const meshData = generatePlaneMesh(10, 10, 10, 10);
      const expectedVertices = (10 + 1) * (10 + 1);
      expect(meshData.positions.length / 3).toBe(expectedVertices);

      // All vertices should have Z = 0
      for (let i = 2; i < meshData.positions.length; i += 3) {
        expect(meshData.positions[i]).toBeCloseTo(0, 2);
      }
    });

    it("should render textured plane", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new PlaneGeometry(1, 1, 1, 1));

      const material = new Material([1, 1, 1, 1]);
      material.textureId = "stone_texture";
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.textureId).toBe("stone_texture");
    });
  });

  describe("Cone Geometry Visual Validation", () => {
    it("should render cone with correct geometry", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new ConeGeometry(1, 2, 32));

      world.add(entity, new Material([1, 0, 0, 1])); // Red
      world.add(entity, new Visible());

      const geometry = world.get(entity, ConeGeometry)!;
      expect(geometry.radius).toBe(1);
      expect(geometry.height).toBe(2);
      expect(geometry.segments).toBe(32);

      // Verify mesh
      const meshData = generateConeMesh(1, 2, 32);
      expect(meshData.positions.length).toBeGreaterThan(0);
      expect(meshData.indices.length % 3).toBe(0);
    });

    it("should render tall cone", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new ConeGeometry(1, 5, 32));

      world.add(entity, new Material([0, 1, 0, 1]));
      world.add(entity, new Visible());

      const geometry = world.get(entity, ConeGeometry)!;
      expect(geometry.height).toBe(5);
    });

    it("should render wide cone", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new ConeGeometry(3, 1, 32));

      world.add(entity, new Material([0, 0, 1, 1]));
      world.add(entity, new Visible());

      const geometry = world.get(entity, ConeGeometry)!;
      expect(geometry.radius).toBe(3);
    });
  });

  describe("Combined Material Properties", () => {
    it("should render wireframe geometry", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new BoxGeometry(1, 1, 1));

      const material = new Material([1, 1, 1, 1], 0, 0.5, 1.0, true); // wireframe = true
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.wireframe).toBe(true);
    });

    it("should render rough surface", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new SphereGeometry(1, 32, 16));

      const material = new Material([1, 1, 1, 1], 0.0, 1.0); // Highly rough
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.roughness).toBe(1.0);
    });

    it("should render smooth surface", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new SphereGeometry(1, 32, 16));

      const material = new Material([1, 1, 1, 1], 0.0, 0.0); // Perfectly smooth
      world.add(entity, material);

      world.add(entity, new Visible());

      const retrieved = world.get(entity, Material)!;
      expect(retrieved.roughness).toBe(0.0);
    });
  });

  describe("Scene Composition", () => {
    it("should render multi-shape scene", () => {
      // Create a simple scene with multiple shapes
      const shapes = [
        { entity: world.createEntity(), type: "box", pos: [-2, 0, 0] },
        { entity: world.createEntity(), type: "sphere", pos: [0, 0, 0] },
        { entity: world.createEntity(), type: "cylinder", pos: [2, 0, 0] },
      ];

      for (const shape of shapes) {
        const t = new Transform();
        t.position = shape.pos as [number, number, number];
        world.add(shape.entity, t);

        if (shape.type === "box") {
          world.add(shape.entity, new BoxGeometry(1, 1, 1));
        } else if (shape.type === "sphere") {
          world.add(shape.entity, new SphereGeometry(1, 32, 16));
        } else if (shape.type === "cylinder") {
          world.add(shape.entity, new CylinderGeometry(1, 1, 2, 32));
        }

        world.add(shape.entity, new Material([Math.random(), Math.random(), Math.random(), 1]));
        world.add(shape.entity, new Visible());
      }

      expect(world.getAllEntities().length).toBe(3);
    });

    it("should handle visibility toggling", () => {
      const entity = world.createEntity();

      world.add(entity, new Transform());
      world.add(entity, new BoxGeometry(1, 1, 1));
      world.add(entity, new Material([1, 0, 0, 1]));
      world.add(entity, new Visible());

      expect(world.has(entity, Visible)).toBe(true);

      // Remove visibility
      world.remove(entity, Visible);
      expect(world.has(entity, Visible)).toBe(false);

      // Add it back
      world.add(entity, new Visible());
      expect(world.has(entity, Visible)).toBe(true);
    });
  });

  describe("Transform and Rendering", () => {
    it("should apply transform to rendered entity", () => {
      const entity = world.createEntity();

      const transform = new Transform();
      transform.position = [5, 10, -15];
      transform.rotation = [Math.PI / 4, Math.PI / 6, 0];
      transform.scale = [2, 3, 1];

      world.add(entity, transform);
      world.add(entity, new BoxGeometry(1, 1, 1));
      world.add(entity, new Material());
      world.add(entity, new Visible());

      const retrieved = world.get(entity, Transform)!;
      expect(retrieved.position).toEqual([5, 10, -15]);
      expect(retrieved.scale).toEqual([2, 3, 1]);
    });

    it("should handle multiple entities with different transforms", () => {
      for (let i = 0; i < 5; i++) {
        const entity = world.createEntity();

        const transform = new Transform();
        transform.position = [i * 2, 0, 0];
        world.add(entity, transform);

        world.add(entity, new BoxGeometry(1, 1, 1));
        world.add(entity, new Material([Math.random(), Math.random(), Math.random(), 1]));
        world.add(entity, new Visible());
      }

      const entities = world.getAllEntities();
      expect(entities.length).toBe(5);

      for (const ent of entities) {
        expect(world.has(ent, Transform)).toBe(true);
        expect(world.has(ent, Visible)).toBe(true);
      }
    });
  });
});
