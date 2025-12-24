import { describe, it, expect } from "vitest";
import { BoundingBox } from "./bounding-box.ts";

describe("BoundingBox", () => {
  it("should create a bounding box with correct dimensions", () => {
    const bbox = new BoundingBox(0, 100, 0, 50);

    expect(bbox.minX).toBe(0);
    expect(bbox.maxX).toBe(100);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxY).toBe(50);
  });

  it("should calculate width correctly", () => {
    const bbox = new BoundingBox(0, 100, 0, 50);
    expect(bbox.width).toBe(100);

    const bbox2 = new BoundingBox(10, 60, 0, 50);
    expect(bbox2.width).toBe(50);
  });

  it("should calculate height correctly", () => {
    const bbox = new BoundingBox(0, 100, 0, 50);
    expect(bbox.height).toBe(50);

    const bbox2 = new BoundingBox(0, 100, 20, 80);
    expect(bbox2.height).toBe(60);
  });

  it("should calculate center correctly", () => {
    const bbox = new BoundingBox(0, 100, 0, 50);

    expect(bbox.centerX).toBe(50);
    expect(bbox.centerY).toBe(25);
  });

  it("should calculate center with negative coordinates", () => {
    const bbox = new BoundingBox(-50, 50, -25, 25);

    expect(bbox.centerX).toBe(0);
    expect(bbox.centerY).toBe(0);
  });

  it("should create bounding box from points", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 25 },
    ];

    const bbox = BoundingBox.fromPoints(points);

    expect(bbox.minX).toBe(0);
    expect(bbox.maxX).toBe(100);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxY).toBe(50);
  });

  it("should handle empty points array", () => {
    const bbox = BoundingBox.fromPoints([]);

    expect(bbox.minX).toBe(0);
    expect(bbox.maxX).toBe(0);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxY).toBe(0);
  });

  it("should handle single point", () => {
    const bbox = BoundingBox.fromPoints([{ x: 25, y: 10 }]);

    expect(bbox.minX).toBe(25);
    expect(bbox.maxX).toBe(25);
    expect(bbox.minY).toBe(10);
    expect(bbox.maxY).toBe(10);
  });

  it("should handle negative coordinates in fromPoints", () => {
    const points = [
      { x: -50, y: -25 },
      { x: 50, y: 25 },
    ];

    const bbox = BoundingBox.fromPoints(points);

    expect(bbox.minX).toBe(-50);
    expect(bbox.maxX).toBe(50);
    expect(bbox.minY).toBe(-25);
    expect(bbox.maxY).toBe(25);
    expect(bbox.centerX).toBe(0);
    expect(bbox.centerY).toBe(0);
  });

  it("should detect overlap with another bounding box", () => {
    const bbox1 = new BoundingBox(0, 100, 0, 100);
    const bbox2 = new BoundingBox(50, 150, 50, 150);

    // Manual overlap check
    const overlaps =
      bbox1.minX < bbox2.maxX &&
      bbox1.maxX > bbox2.minX &&
      bbox1.minY < bbox2.maxY &&
      bbox1.maxY > bbox2.minY;

    expect(overlaps).toBe(true);
  });

  it("should not detect overlap when boxes are separated", () => {
    const bbox1 = new BoundingBox(0, 50, 0, 50);
    const bbox2 = new BoundingBox(100, 150, 100, 150);

    const overlaps =
      bbox1.minX < bbox2.maxX &&
      bbox1.maxX > bbox2.minX &&
      bbox1.minY < bbox2.maxY &&
      bbox1.maxY > bbox2.minY;

    expect(overlaps).toBe(false);
  });
});
