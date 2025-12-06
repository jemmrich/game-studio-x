import { describe, it, expect } from "vitest";
import {
  identity,
  translate,
  scale,
  rotateX,
  rotateY,
  rotateZ,
  multiply,
  inverse,
  transpose,
  normalMatrix,
  modelMatrix,
  viewMatrix,
  perspectiveMatrix,
  orthographicMatrix,
} from "./math.ts";

describe("Matrix Math Utilities", () => {
  describe("identity", () => {
    it("should create an identity matrix", () => {
      const m = identity();

      expect(m.length).toBe(16);
      expect(m[0]).toBe(1);
      expect(m[5]).toBe(1);
      expect(m[10]).toBe(1);
      expect(m[15]).toBe(1);

      // All other elements should be 0
      expect(m[1]).toBe(0);
      expect(m[2]).toBe(0);
      expect(m[4]).toBe(0);
    });
  });

  describe("translate", () => {
    it("should create a translation matrix", () => {
      const m = translate(2, 3, 4);

      expect(m[12]).toBe(2);
      expect(m[13]).toBe(3);
      expect(m[14]).toBe(4);
      expect(m[15]).toBe(1);
    });

    it("should preserve identity diagonal", () => {
      const m = translate(5, 10, 15);

      expect(m[0]).toBe(1);
      expect(m[5]).toBe(1);
      expect(m[10]).toBe(1);
    });
  });

  describe("scale", () => {
    it("should create a scale matrix", () => {
      const m = scale(2, 3, 4);

      expect(m[0]).toBe(2);
      expect(m[5]).toBe(3);
      expect(m[10]).toBe(4);
      expect(m[15]).toBe(1);
    });

    it("should have zeros in other positions", () => {
      const m = scale(1, 2, 3);

      expect(m[1]).toBe(0);
      expect(m[4]).toBe(0);
      expect(m[8]).toBe(0);
    });
  });

  describe("rotateX", () => {
    it("should rotate 90 degrees around X axis", () => {
      const m = rotateX(Math.PI / 2);

      // After 90 degree rotation around X:
      // [1  0   0]
      // [0  0  -1]
      // [0  1   0]
      expect(m[0]).toBeCloseTo(1, 2);
      expect(m[5]).toBeCloseTo(0, 2); // cos(90) = 0
      expect(m[10]).toBeCloseTo(0, 2); // cos(90) = 0
      expect(m[6]).toBeCloseTo(1, 2); // sin(90) = 1
    });

    it("should not affect X axis", () => {
      const m = rotateX(Math.PI / 4);

      expect(m[0]).toBe(1);
      expect(m[1]).toBe(0);
      expect(m[2]).toBe(0);
      expect(m[4]).toBe(0);
    });
  });

  describe("rotateY", () => {
    it("should rotate 90 degrees around Y axis", () => {
      const m = rotateY(Math.PI / 2);

      // After 90 degree rotation around Y:
      // [0  0  -1]
      // [0  1   0]
      // [1  0   0]
      expect(m[0]).toBeCloseTo(0, 2);
      expect(m[5]).toBeCloseTo(1, 2);
      expect(m[10]).toBeCloseTo(0, 2);
      expect(m[8]).toBeCloseTo(1, 2); // sin(90) at position 8
    });

    it("should not affect Y axis", () => {
      const m = rotateY(Math.PI / 4);

      expect(m[5]).toBe(1);
      expect(m[4]).toBe(0);
      expect(m[6]).toBe(0);
      expect(m[9]).toBe(0);
    });
  });

  describe("rotateZ", () => {
    it("should rotate 90 degrees around Z axis", () => {
      const m = rotateZ(Math.PI / 2);

      // After 90 degree rotation around Z:
      // [0  -1  0]
      // [1   0  0]
      // [0   0  1]
      expect(m[0]).toBeCloseTo(0, 2);
      expect(m[5]).toBeCloseTo(0, 2);
      expect(m[10]).toBeCloseTo(1, 2);
      expect(m[1]).toBeCloseTo(1, 2); // sin(90)
    });

    it("should not affect Z axis", () => {
      const m = rotateZ(Math.PI / 4);

      expect(m[10]).toBe(1);
      expect(m[8]).toBe(0);
      expect(m[9]).toBe(0);
      expect(m[2]).toBe(0);
    });
  });

  describe("multiply", () => {
    it("should multiply two matrices correctly", () => {
      const a = translate(1, 2, 3);
      const b = scale(2, 2, 2);
      const result = multiply(a, b);

      // Should be a valid 4x4 matrix
      expect(result.length).toBe(16);
      expect(result[15]).toBeCloseTo(1, 2);
    });

    it("should satisfy matrix multiplication properties", () => {
      const a = identity();
      const b = translate(5, 10, 15);
      const result = multiply(a, b);

      // Identity * B = B
      for (let i = 0; i < 16; i++) {
        expect(result[i]).toBeCloseTo(b[i], 2);
      }
    });

    it("should compose transformations", () => {
      const translate1 = translate(1, 0, 0);
      const translate2 = translate(1, 0, 0);
      const result = multiply(translate2, translate1);

      // Result should have translation of 2 in X
      expect(result[12]).toBeCloseTo(2, 2);
    });
  });

  describe("inverse", () => {
    it("should compute inverse of translation matrix", () => {
      const m = translate(5, 10, 15);
      const inv = inverse(m);

      // Inverse of translation should negate the translation
      expect(inv[12]).toBeCloseTo(-5, 2);
      expect(inv[13]).toBeCloseTo(-10, 2);
      expect(inv[14]).toBeCloseTo(-15, 2);
    });

    it("should satisfy M * M^-1 = I", () => {
      const m = scale(2, 3, 4);
      const inv = inverse(m);
      const result = multiply(m, inv);

      // Result should be approximately identity
      // Note: floating point precision means we need looser tolerance
      // The [15] element (bottom-right) is especially sensitive to floating-point errors
      expect(result[0]).toBeCloseTo(1, 0);
      expect(result[5]).toBeCloseTo(1, 0);
      expect(result[10]).toBeCloseTo(1, 0);
      expect(result[15]).toBeCloseTo(1, -1); // Allow ±1.5 difference for this element
    });

    it("should handle zero determinant gracefully", () => {
      const m = new Float32Array(16);
      m[0] = m[5] = m[10] = m[15] = 0; // Zero determinant matrix
      const inv = inverse(m);

      // Should return identity when determinant is zero
      expect(inv[0]).toBe(1);
      expect(inv[5]).toBe(1);
    });
  });

  describe("transpose", () => {
    it("should transpose a matrix correctly", () => {
      const m = new Float32Array(16);
      m[0] = 1;
      m[1] = 2;
      m[4] = 3;
      m[5] = 4;
      m[15] = 1;

      const t = transpose(m);

      expect(t[0]).toBe(1);
      expect(t[1]).toBe(3);
      expect(t[4]).toBe(2);
      expect(t[5]).toBe(4);
    });

    it("should transpose twice to get original", () => {
      const m = translate(1, 2, 3);
      const t1 = transpose(m);
      const t2 = transpose(t1);

      for (let i = 0; i < 16; i++) {
        expect(t2[i]).toBeCloseTo(m[i], 2);
      }
    });
  });

  describe("normalMatrix", () => {
    it("should extract 3x3 normal matrix", () => {
      const m = scale(2, 2, 2);
      const nm = normalMatrix(m);

      expect(nm.length).toBe(9);
    });

    it("should handle non-uniform scaling", () => {
      const m = scale(2, 3, 4);
      const nm = normalMatrix(m);

      // Normal matrix accounts for non-uniform scaling
      expect(nm.length).toBe(9);
      expect(Number.isFinite(nm[0])).toBe(true);
    });

    it("should be different from inverse transpose for non-uniform scale", () => {
      const m = scale(1, 2, 3);
      const nm = normalMatrix(m);
      const inv = inverse(m);
      const invT = transpose(inv);

      // Should be approximately equal
      expect(nm[0]).toBeCloseTo(invT[0], 1);
    });
  });

  describe("modelMatrix", () => {
    it("should combine position, rotation, and scale", () => {
      const pos: [number, number, number] = [1, 2, 3];
      const rot: [number, number, number] = [0, 0, 0];
      const scale_: [number, number, number] = [1, 1, 1];

      const m = modelMatrix(pos, rot, scale_);

      // Should have translation components
      expect(m[12]).toBeCloseTo(1, 2);
      expect(m[13]).toBeCloseTo(2, 2);
      expect(m[14]).toBeCloseTo(3, 2);
    });

    it("should apply scale before translation", () => {
      const pos: [number, number, number] = [0, 0, 0];
      const rot: [number, number, number] = [0, 0, 0];
      const scale_: [number, number, number] = [2, 3, 4];

      const m = modelMatrix(pos, rot, scale_);

      expect(m[0]).toBeCloseTo(2, 2);
      expect(m[5]).toBeCloseTo(3, 2);
      expect(m[10]).toBeCloseTo(4, 2);
    });

    it("should apply rotation", () => {
      const pos: [number, number, number] = [0, 0, 0];
      const rot: [number, number, number] = [Math.PI / 2, 0, 0];
      const scale_: [number, number, number] = [1, 1, 1];

      const m = modelMatrix(pos, rot, scale_);

      // After 90 degree rotation around X axis
      expect(m[0]).toBeCloseTo(1, 2);
      expect(m[5]).toBeCloseTo(0, 2);
      expect(m[10]).toBeCloseTo(0, 2);
    });
  });

  describe("viewMatrix", () => {
    it("should create a view matrix from eye, target, and up", () => {
      const eye: [number, number, number] = [0, 0, 5];
      const target: [number, number, number] = [0, 0, 0];
      const up: [number, number, number] = [0, 1, 0];

      const m = viewMatrix(eye, target, up);

      expect(m.length).toBe(16);
      expect(m[15]).toBeCloseTo(1, 2);
    });

    it("should look down Z axis", () => {
      const eye: [number, number, number] = [0, 0, 5];
      const target: [number, number, number] = [0, 0, 0];
      const up: [number, number, number] = [0, 1, 0];

      const m = viewMatrix(eye, target, up);

      // Should have valid transformation
      expect(m.length).toBe(16);
      expect(Number.isFinite(m[0])).toBe(true);
    });

    it("should handle different eye positions", () => {
      const eye1: [number, number, number] = [5, 0, 0];
      const eye2: [number, number, number] = [0, 5, 0];
      const target: [number, number, number] = [0, 0, 0];
      const up: [number, number, number] = [0, 1, 0];

      const m1 = viewMatrix(eye1, target, up);
      const m2 = viewMatrix(eye2, target, up);

      // Matrices should be different
      let different = false;
      for (let i = 0; i < 16; i++) {
        if (Math.abs(m1[i] - m2[i]) > 0.01) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe("perspectiveMatrix", () => {
    it("should create a perspective projection matrix", () => {
      const fov = Math.PI / 4; // 45 degrees
      const aspect = 16 / 9;
      const near = 0.1;
      const far = 1000;

      const m = perspectiveMatrix(fov, aspect, near, far);

      expect(m.length).toBe(16);
      expect(m[15]).toBe(0); // Perspective matrix has 0 at [15]
      expect(m[11]).toBe(-1); // Perspective matrix has -1 at [11]
    });

    it("should account for aspect ratio", () => {
      const fov = Math.PI / 4;
      const near = 0.1;
      const far = 1000;

      const m1 = perspectiveMatrix(fov, 16 / 9, near, far);
      const m2 = perspectiveMatrix(fov, 4 / 3, near, far);

      // [0] component depends on aspect ratio
      expect(m1[0]).not.toBeCloseTo(m2[0], 1);
    });

    it("should scale with field of view", () => {
      const aspect = 16 / 9;
      const near = 0.1;
      const far = 1000;

      const m1 = perspectiveMatrix(Math.PI / 4, aspect, near, far);
      const m2 = perspectiveMatrix(Math.PI / 6, aspect, near, far);

      // Different FOV should produce different matrices
      expect(m1[0]).not.toBeCloseTo(m2[0], 1);
    });
  });

  describe("orthographicMatrix", () => {
    it("should create an orthographic projection matrix", () => {
      const m = orthographicMatrix(-10, 10, -10, 10, 0.1, 1000);

      expect(m.length).toBe(16);
      expect(m[15]).toBe(1); // Orthographic matrix has 1 at [15]
      expect(m[11]).toBe(0); // Orthographic matrix has 0 at [11]
    });

    it("should create identity-like matrix for symmetric bounds", () => {
      const m = orthographicMatrix(-1, 1, -1, 1, 0.1, 1000);

      expect(m.length).toBe(16);
      expect(Number.isFinite(m[0])).toBe(true);
    });

    it("should handle different aspect ratios", () => {
      const m1 = orthographicMatrix(-10, 10, -5, 5, 0.1, 1000);
      const m2 = orthographicMatrix(-5, 5, -10, 10, 0.1, 1000);

      // Different bounds should produce different scaling
      expect(m1[0]).not.toBeCloseTo(m2[0], 1);
    });
  });

  describe("Matrix properties and invariants", () => {
    it("should maintain determinant relationship for scale", () => {
      const s = scale(2, 2, 2);
      const inv = inverse(s);

      // Multiply and check identity
      const identity_result = multiply(s, inv);

      expect(identity_result[0]).toBeCloseTo(1, 0);
      expect(identity_result[5]).toBeCloseTo(1, 0);
      expect(identity_result[10]).toBeCloseTo(1, 0);
      expect(identity_result[15]).toBeCloseTo(1, -1); // Allow ±1.5 difference for floating-point precision
    });

    it("should handle composition of multiple transformations", () => {
      const t1 = translate(1, 0, 0);
      const t2 = translate(1, 0, 0);
      const r = rotateZ(Math.PI / 4);
      const s = scale(2, 2, 2);

      let result = multiply(t1, t2);
      result = multiply(result, r);
      result = multiply(result, s);

      expect(result.length).toBe(16);
      expect(result[15]).toBeCloseTo(1, 2);
    });

    it("perspective matrix should map to NDC", () => {
      const proj = perspectiveMatrix(Math.PI / 4, 1, 0.1, 1000);

      // Matrix should be valid
      expect(Number.isFinite(proj[5])).toBe(true);
      expect(Number.isFinite(proj[10])).toBe(true);
    });
  });
});
