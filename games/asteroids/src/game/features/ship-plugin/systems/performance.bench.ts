import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { ShipMovementSystem } from "./ship-movement-system.ts";
import { spawnPlayerShip } from "../factories/mod.ts";

/**
 * Performance Benchmarking Tests
 * These tests measure performance characteristics of ship systems
 * Run with: vitest run --reporter=verbose src/game/features/ship-plugin/systems/performance.bench.ts
 */
describe("Ship System Performance Benchmarks", () => {
  let world: World;
  let system: ShipMovementSystem;

  beforeEach(() => {
    world = new World();
    system = new ShipMovementSystem();
    world.addResource("render_context", { width: 800, height: 600 });
  });

  it("should handle single ship update efficiently", () => {
    const shipEntityId = spawnPlayerShip(world);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (ship) {
      ship.isThrusting = true;
    }

    const startTime = performance.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`Single ship update: ${avgTime.toFixed(3)}ms per frame`);

    // Should be able to update at least 60 FPS (< 16.67ms per frame)
    expect(avgTime).toBeLessThan(16.67);
  });

  it("should handle multiple ships efficiently", () => {
    const shipCount = 10;
    const shipIds = [];

    for (let i = 0; i < shipCount; i++) {
      const shipId = spawnPlayerShip(world);
      const ship = world.get<ShipComponent>(shipId, ShipComponent);
      if (ship) {
        ship.isThrusting = true;
      }
      shipIds.push(shipId);
    }

    const startTime = performance.now();
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(
      `${shipCount} ships update: ${avgTime.toFixed(3)}ms per frame`,
    );

    // Should still maintain reasonable performance
    expect(avgTime).toBeLessThan(50);
  });

  it("should handle velocity clamping efficiently", () => {
    const shipEntityId = spawnPlayerShip(world);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);

    if (velocity) {
      velocity.x = 500;
      velocity.y = 500;
    }

    const startTime = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(
      `Velocity clamping: ${avgTime.toFixed(4)}ms per iteration`,
    );

    // Clamping should be very fast
    expect(avgTime).toBeLessThan(1);
  });

  it("should handle screen wrapping efficiently", () => {
    const shipEntityId = spawnPlayerShip(world);
    const transform = world.get<Transform>(shipEntityId, Transform);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);

    if (velocity) {
      velocity.x = 100;
      velocity.y = 100;
    }

    const startTime = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(
      `Screen wrapping: ${avgTime.toFixed(4)}ms per iteration`,
    );

    // Wrapping should be very fast
    expect(avgTime).toBeLessThan(1);
  });

  it("should measure component memory overhead", () => {
    const ship = new ShipComponent();
    const velocity = new Velocity(0, 0, 0);
    const transform = new Transform();

    // Rough estimation of object sizes
    const shipSize = Object.keys(ship).length;
    const velocitySize = Object.keys(velocity).length;
    const transformSize = Object.keys(transform).length;

    console.log(`Ship component properties: ${shipSize}`);
    console.log(`Velocity component properties: ${velocitySize}`);
    console.log(`Transform component properties: ${transformSize}`);

    // Verify components are reasonably lightweight
    expect(shipSize).toBeLessThan(20);
    expect(velocitySize).toBeLessThan(10);
  });

  it("should handle rotation calculation efficiently", () => {
    const shipEntityId = spawnPlayerShip(world);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (ship) {
      ship.rotationDirection = 1;
    }

    const startTime = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(
      `Rotation calculation: ${avgTime.toFixed(4)}ms per iteration`,
    );

    expect(avgTime).toBeLessThan(1);
  });

  it("should measure friction application performance", () => {
    const shipEntityId = spawnPlayerShip(world);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (velocity && ship) {
      velocity.x = 100;
      velocity.y = 100;
      ship.isThrusting = false;
    }

    const startTime = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      system.update(world, 1 / 60);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(
      `Friction application: ${avgTime.toFixed(4)}ms per iteration`,
    );

    expect(avgTime).toBeLessThan(1);
  });
});
