import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { Velocity } from "../components/velocity.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { ShipMovementSystem } from "./ship-movement-system.ts";
import { spawnPlayerShip } from "../factories/mod.ts";

describe("ShipMovementSystem Integration", () => {
  let world: World;
  let system: ShipMovementSystem;
  let shipEntityId: any;

  beforeEach(() => {
    world = new World();
    system = new ShipMovementSystem();

    // Register render context
    world.addResource("render_context", { width: 800, height: 600 });

    // Spawn a player ship
    shipEntityId = spawnPlayerShip(world);
  });

  it("should apply thrust correctly when isThrusting is true", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);
    const transform = world.get<Transform>(shipEntityId, Transform);

    if (!ship || !velocity || !transform) {
      throw new Error("Ship components not found");
    }

    const initialVelX = velocity.x;
    const initialVelY = velocity.y;

    ship.isThrusting = true;
    transform.rotation[2] = 0; // facing right
    const dt = 1 / 60; // 60 FPS

    system.update(world, dt);

    // Velocity should increase in the direction of rotation
    expect(velocity.x).toBeGreaterThan(initialVelX);
  });

  it("should apply friction to velocity when not thrusting", () => {
    const velocity = world.get<Velocity>(shipEntityId, Velocity);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!velocity || !ship) {
      throw new Error("Ship components not found");
    }

    // Set initial velocity
    velocity.x = 100;
    velocity.y = 50;

    ship.isThrusting = false;
    const dt = 1 / 60;

    system.update(world, dt);

    // Velocity should decrease due to friction
    expect(velocity.x).toBeLessThan(100);
    expect(velocity.y).toBeLessThan(50);
  });

  it("should clamp velocity to maxVelocity", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);

    if (!ship || !velocity) {
      throw new Error("Ship components not found");
    }

    // Set velocity above max
    velocity.x = 200;
    velocity.y = 200;
    ship.isThrusting = false;

    const dt = 1 / 60;
    system.update(world, dt);

    // Velocity magnitude should be clamped to maxVelocity
    const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    expect(velocityMagnitude).toBeLessThanOrEqual(ship.maxVelocity);
  });

  it("should update position based on velocity", () => {
    const transform = world.get<Transform>(shipEntityId, Transform);
    const velocity = world.get<Velocity>(shipEntityId, Velocity);

    if (!transform || !velocity) {
      throw new Error("Ship components not found");
    }

    const initialX = transform.position[0];
    const initialY = transform.position[1];

    velocity.x = 50;
    velocity.y = 30;

    const dt = 1 / 60;
    system.update(world, dt);

    expect(transform.position[0]).toBeGreaterThan(initialX);
    expect(transform.position[1]).toBeGreaterThan(initialY);
  });

  it("should rotate ship when rotationDirection is non-zero", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const transform = world.get<Transform>(shipEntityId, Transform);

    if (!ship || !transform) {
      throw new Error("Ship components not found");
    }

    const initialRotation = transform.rotation[2];

    ship.rotationDirection = 1; // rotate counterclockwise
    const dt = 1 / 60;

    system.update(world, dt);

    expect(transform.rotation[2]).toBeGreaterThan(initialRotation);
  });

  it("should apply screen wrapping when entity goes past bounds", () => {
    const transform = world.get<Transform>(shipEntityId, Transform);

    if (!transform) {
      throw new Error("Transform component not found");
    }

    // Move ship far to the right
    transform.position[0] = 500;
    transform.position[1] = 0;

    const dt = 1 / 60;
    system.update(world, dt);

    // Ship should wrap around to the left side
    expect(transform.position[0]).toBeLessThan(400);
  });

  it("should not apply thrust when isThrusting is false", () => {
    const velocity = world.get<Velocity>(shipEntityId, Velocity);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!velocity || !ship) {
      throw new Error("Ship components not found");
    }

    const initialVelX = velocity.x;
    const initialVelY = velocity.y;

    ship.isThrusting = false;
    const dt = 1 / 60;

    system.update(world, dt);

    // Only friction should be applied, not thrust
    expect(velocity.x).toBeLessThanOrEqual(initialVelX);
    expect(velocity.y).toBeLessThanOrEqual(initialVelY);
  });
});
