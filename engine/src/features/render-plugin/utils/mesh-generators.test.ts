import { describe, it, expect } from "vitest";
import {
  generateBoxMesh,
  generateSphereMesh,
  generateCylinderMesh,
  generatePlaneMesh,
  generateConeMesh,
  MeshData,
} from "./mesh-generators.ts";

describe("Mesh Generators", () => {
  describe("generateBoxMesh", () => {
    it("should generate a box mesh with correct vertex count", () => {
      const mesh = generateBoxMesh(1, 1, 1);

      // A cube has 6 faces, each with 4 vertices = 24 vertices
      expect(mesh.positions.length).toBe(24 * 3);
      expect(mesh.normals.length).toBe(24 * 3);
      expect(mesh.uvs.length).toBe(24 * 2);
    });

    it("should have correct indices for a box", () => {
      const mesh = generateBoxMesh(1, 1, 1);

      // 6 faces * 2 triangles per face * 3 indices = 36 indices
      expect(mesh.indices.length).toBe(36);
    });

    it("should generate normals pointing outward", () => {
      const mesh = generateBoxMesh(2, 2, 2);

      // Check that some normals are pointing in expected directions
      // Front face normals should point in +Z direction
      const frontNormals = mesh.normals.slice(0, 12);
      expect(frontNormals[2]).toBeCloseTo(1, 2); // First normal Z component
      expect(frontNormals[5]).toBeCloseTo(1, 2); // Second normal Z component
    });

    it("should generate box with correct dimensions", () => {
      const width = 2;
      const height = 3;
      const depth = 4;
      const mesh = generateBoxMesh(width, height, depth);

      const positions = mesh.positions;

      // Check that vertices are within expected bounds
      const minX = Math.min(
        ...Array.from({ length: positions.length / 3 }, (_, i) => positions[i * 3])
      );
      const maxX = Math.max(
        ...Array.from({ length: positions.length / 3 }, (_, i) => positions[i * 3])
      );

      expect(maxX - minX).toBeCloseTo(width, 1);
    });

    it("should generate valid UV coordinates", () => {
      const mesh = generateBoxMesh(1, 1, 1);

      // All UV coordinates should be between 0 and 1
      for (let i = 0; i < mesh.uvs.length; i++) {
        expect(mesh.uvs[i]).toBeGreaterThanOrEqual(0);
        expect(mesh.uvs[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("generateSphereMesh", () => {
    it("should generate a sphere with correct vertex structure", () => {
      const segments = 32;
      const rings = 16;
      const mesh = generateSphereMesh(1, segments, rings);

      // A UV sphere has (segments + 1) * (rings + 1) vertices
      const expectedVertexCount = (segments + 1) * (rings + 1);
      expect(mesh.positions.length).toBe(expectedVertexCount * 3);
      expect(mesh.normals.length).toBe(expectedVertexCount * 3);
    });

    it("should have all vertices on sphere surface", () => {
      const radius = 2;
      const mesh = generateSphereMesh(radius, 16, 8);

      const tolerance = 0.01;
      for (let i = 0; i < mesh.positions.length; i += 3) {
        const x = mesh.positions[i];
        const y = mesh.positions[i + 1];
        const z = mesh.positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);

        expect(distance).toBeCloseTo(radius, 1);
      }
    });

    it("should have normals equal to normalized positions for a unit sphere", () => {
      const mesh = generateSphereMesh(1, 8, 4);

      for (let i = 0; i < mesh.positions.length; i += 3) {
        const px = mesh.positions[i];
        const py = mesh.positions[i + 1];
        const pz = mesh.positions[i + 2];

        const nx = mesh.normals[i];
        const ny = mesh.normals[i + 1];
        const nz = mesh.normals[i + 2];

        // Normals should be normalized
        const nLength = Math.sqrt(nx * nx + ny * ny + nz * nz);
        expect(nLength).toBeCloseTo(1, 2);

        // For unit sphere, normal should equal position
        expect(nx).toBeCloseTo(px, 1);
        expect(ny).toBeCloseTo(py, 1);
        expect(nz).toBeCloseTo(pz, 1);
      }
    });

    it("should generate valid indices", () => {
      const mesh = generateSphereMesh(1, 16, 8);

      // Indices should reference valid vertex positions
      const maxIndex = (mesh.positions.length / 3) - 1;
      for (const index of mesh.indices) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(maxIndex);
      }
    });
  });

  describe("generateCylinderMesh", () => {
    it("should generate a cylinder with correct structure", () => {
      const segments = 32;
      const mesh = generateCylinderMesh(1, 1, 2, segments);

      // Should have vertices for sides, caps, and their centers
      expect(mesh.positions.length).toBeGreaterThan(0);
      expect(mesh.normals.length).toBe(mesh.positions.length);
      expect(mesh.indices.length).toBeGreaterThan(0);
    });

    it("should have correct height", () => {
      const height = 3;
      const mesh = generateCylinderMesh(1, 1, height, 16);

      const positions = mesh.positions;
      const yValues = [];
      for (let i = 1; i < positions.length; i += 3) {
        yValues.push(positions[i]);
      }

      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      expect(maxY - minY).toBeCloseTo(height, 1);
    });

    it("should have correct radius", () => {
      const radius = 2;
      const mesh = generateCylinderMesh(radius, radius, 1, 32);

      const positions = mesh.positions;
      const distances: number[] = [];

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const distance = Math.sqrt(x * x + z * z);

        // Collect distances from side vertices (not caps)
        if (distance > 0.1) {
          distances.push(distance);
        }
      }

      // Average distance should be close to radius
      if (distances.length > 0) {
        const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
        expect(avgDistance).toBeCloseTo(radius, 0);
      }
    });
  });

  describe("generatePlaneMesh", () => {
    it("should generate a plane with correct dimensions", () => {
      const width = 2;
      const height = 3;
      const mesh = generatePlaneMesh(width, height, 1, 1);

      const positions = mesh.positions;
      const xs = [];
      const ys = [];

      for (let i = 0; i < positions.length; i += 3) {
        xs.push(positions[i]);
        ys.push(positions[i + 1]);
      }

      const widthSpan = Math.max(...xs) - Math.min(...xs);
      const heightSpan = Math.max(...ys) - Math.min(...ys);

      expect(widthSpan).toBeCloseTo(width, 1);
      expect(heightSpan).toBeCloseTo(height, 1);
    });

    it("should generate plane on Z=0", () => {
      const mesh = generatePlaneMesh(1, 1, 1, 1);

      const positions = mesh.positions;
      for (let i = 2; i < positions.length; i += 3) {
        expect(positions[i]).toBeCloseTo(0, 2); // Z should be 0
      }
    });

    it("should have normals pointing in +Z", () => {
      const mesh = generatePlaneMesh(1, 1, 1, 1);

      for (let i = 0; i < mesh.normals.length; i += 3) {
        const nx = mesh.normals[i];
        const ny = mesh.normals[i + 1];
        const nz = mesh.normals[i + 2];

        expect(nx).toBeCloseTo(0, 2);
        expect(ny).toBeCloseTo(0, 2);
        expect(nz).toBeCloseTo(1, 2);
      }
    });

    it("should respect segment divisions", () => {
      const widthSegments = 5;
      const heightSegments = 3;
      const mesh = generatePlaneMesh(1, 1, widthSegments, heightSegments);

      // Grid has (widthSegments + 1) * (heightSegments + 1) vertices
      const expectedVertexCount = (widthSegments + 1) * (heightSegments + 1);
      expect(mesh.positions.length / 3).toBe(expectedVertexCount);
    });
  });

  describe("generateConeMesh", () => {
    it("should generate a cone with apex at top", () => {
      const height = 2;
      const mesh = generateConeMesh(1, height, 16);

      const positions = mesh.positions;
      let maxY = -Infinity;

      for (let i = 1; i < positions.length; i += 3) {
        maxY = Math.max(maxY, positions[i]);
      }

      expect(maxY).toBeCloseTo(height / 2, 1);
    });

    it("should have correct base radius", () => {
      const radius = 1.5;
      const mesh = generateConeMesh(radius, 1, 32);

      const positions = mesh.positions;
      let foundBaseVertex = false;

      for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];

        // Look for base vertices (Y close to -height/2)
        if (Math.abs(y - (-0.5)) < 0.1) {
          const x = positions[i];
          const z = positions[i + 2];
          const distance = Math.sqrt(x * x + z * z);

          if (distance > 0.1) {
            // Skip center point
            expect(distance).toBeCloseTo(radius, 0);
            foundBaseVertex = true;
          }
        }
      }

      expect(foundBaseVertex).toBe(true);
    });

    it("should generate valid mesh data", () => {
      const mesh = generateConeMesh(1, 2, 16);

      expect(mesh.positions.length).toBeGreaterThan(0);
      expect(mesh.positions.length % 3).toBe(0);
      expect(mesh.normals.length).toBe(mesh.positions.length);
      expect(mesh.indices.length % 3).toBe(0); // Should be divisible by 3 (triangles)
    });

    it("should have valid indices", () => {
      const mesh = generateConeMesh(1, 1, 16);

      const maxIndex = (mesh.positions.length / 3) - 1;
      for (const index of mesh.indices) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(maxIndex);
      }
    });
  });

  describe("Mesh data integrity", () => {
    const meshGenerators: Array<{ name: string; fn: () => MeshData }> = [
      { name: "Box", fn: () => generateBoxMesh(1, 1, 1) },
      { name: "Sphere", fn: () => generateSphereMesh(1, 16, 8) },
      { name: "Cylinder", fn: () => generateCylinderMesh(1, 1, 2, 16) },
      { name: "Plane", fn: () => generatePlaneMesh(1, 1, 2, 2) },
      { name: "Cone", fn: () => generateConeMesh(1, 2, 16) },
    ];

    meshGenerators.forEach(({ name, fn }) => {
      it(`${name} should have indices within bounds`, () => {
        const mesh = fn();

        const maxIndex = (mesh.positions.length / 3) - 1;
        for (const index of mesh.indices) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThanOrEqual(maxIndex);
        }
      });

      it(`${name} should have matching data array lengths`, () => {
        const mesh = fn();

        // All data should have consistent vertex counts
        const vertexCount = mesh.positions.length / 3;
        expect(mesh.normals.length).toBe(vertexCount * 3);
        expect(mesh.uvs.length).toBe(vertexCount * 2);
      });

      it(`${name} should have normalized normals`, () => {
        const mesh = fn();

        for (let i = 0; i < mesh.normals.length; i += 3) {
          const nx = mesh.normals[i];
          const ny = mesh.normals[i + 1];
          const nz = mesh.normals[i + 2];
          const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

          // Normals should be normalized (length ~= 1)
          expect(length).toBeCloseTo(1, 1);
        }
      });

      it(`${name} should have valid UV coordinates`, () => {
        const mesh = fn();

        for (let i = 0; i < mesh.uvs.length; i++) {
          expect(mesh.uvs[i]).toBeGreaterThanOrEqual(0);
          expect(mesh.uvs[i]).toBeLessThanOrEqual(1);
        }
      });
    });
  });
});
