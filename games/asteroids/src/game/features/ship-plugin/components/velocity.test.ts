import { describe, it, expect } from "vitest";
import { Velocity } from "./velocity.ts";

describe("Velocity", () => {
  it("should create a velocity with default values (0, 0, 0)", () => {
    const velocity = new Velocity();

    expect(velocity.x).toBe(0);
    expect(velocity.y).toBe(0);
    expect(velocity.z).toBe(0);
  });

  it("should create a velocity with custom x, y values", () => {
    const velocity = new Velocity(10, 20);

    expect(velocity.x).toBe(10);
    expect(velocity.y).toBe(20);
    expect(velocity.z).toBe(0);
  });

  it("should create a velocity with custom x, y, z values", () => {
    const velocity = new Velocity(10, 20, 30);

    expect(velocity.x).toBe(10);
    expect(velocity.y).toBe(20);
    expect(velocity.z).toBe(30);
  });

  it("should allow velocity components to be modified", () => {
    const velocity = new Velocity(5, 10, 15);

    velocity.x = 20;
    velocity.y = 25;
    velocity.z = 30;

    expect(velocity.x).toBe(20);
    expect(velocity.y).toBe(25);
    expect(velocity.z).toBe(30);
  });

  it("should support negative velocities", () => {
    const velocity = new Velocity(-10, -20, -30);

    expect(velocity.x).toBe(-10);
    expect(velocity.y).toBe(-20);
    expect(velocity.z).toBe(-30);
  });

  it("should support fractional velocities", () => {
    const velocity = new Velocity(1.5, 2.75, -3.25);

    expect(velocity.x).toBe(1.5);
    expect(velocity.y).toBe(2.75);
    expect(velocity.z).toBe(-3.25);
  });

  it("should calculate magnitude correctly", () => {
    const velocity = new Velocity(3, 4, 0);
    const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    expect(magnitude).toBe(5);
  });

  it("should apply friction to velocity", () => {
    const velocity = new Velocity(100, 100, 100);
    const friction = 0.98;

    velocity.x *= friction;
    velocity.y *= friction;
    velocity.z *= friction;

    expect(velocity.x).toBeCloseTo(98);
    expect(velocity.y).toBeCloseTo(98);
    expect(velocity.z).toBeCloseTo(98);
  });
});
