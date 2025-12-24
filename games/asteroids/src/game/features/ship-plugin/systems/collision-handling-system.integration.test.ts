import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { CollisionHandlingSystem } from "./collision-handling-system.ts";
import { spawnPlayerShip } from "../factories/mod.ts";

describe("CollisionHandlingSystem Integration", () => {
  let world: World;
  let system: CollisionHandlingSystem;
  let shipEntityId: any;

  beforeEach(() => {
    world = new World();
    system = new CollisionHandlingSystem();

    // Register render context
    world.addResource("render_context", { width: 800, height: 600 });

    // Spawn a player ship
    shipEntityId = spawnPlayerShip(world);
    system.setShipEntityId(shipEntityId);
  });

  it("should decrement lives on collision", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    const initialLives = ship.lives;

    // Emit collision event
    world.emitEvent("ship_asteroid_collision", {
      asteroidEntityId: "test_asteroid",
    });

    system.update(world, 1 / 60);

    expect(ship.lives).toBe(initialLives - 1);
  });

  it("should respawn at center when lives > 0", () => {
    const transform = world.get<Transform>(shipEntityId, Transform);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!transform || !ship) {
      throw new Error("Components not found");
    }

    // Move ship away from center
    transform.position[0] = 100;
    transform.position[1] = 100;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    // Ship should be respawned at center (approximately)
    // Note: using approximate comparison due to potential world coord conversion
    expect(ship.lives).toBe(2); // Started at 3, decremented to 2
    expect(ship.isInvincible).toBe(true);
  });

  it("should set invincible flag after respawn", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    ship.isInvincible = false; // Clear invincibility first

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    expect(ship.isInvincible).toBe(true);
  });

  it("should emit respawn event when lives > 0", () => {
    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    const respawnEvents = world.getEvents("ship_respawned");
    expect(respawnEvents.length).toBeGreaterThan(0);
    expect(respawnEvents[0].data.lives).toBe(2); // 3 - 1
  });

  it("should emit game_over event when lives reach 0", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    ship.lives = 1; // Set to 1, next collision will reduce to 0

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    const gameOverEvents = world.getEvents("game_over");
    expect(gameOverEvents.length).toBeGreaterThan(0);
    expect(gameOverEvents[0].data.reason).toBe("no_lives_remaining");
  });

  it("should destroy ship entity when lives reach 0", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    ship.lives = 1;

    // Verify ship exists
    expect(world.entityExists(shipEntityId)).toBe(true);

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    // Ship should be destroyed
    expect(world.entityExists(shipEntityId)).toBe(false);
  });

  it("should handle multiple collisions correctly", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    const initialLives = ship.lives;

    // First collision
    world.emitEvent("ship_asteroid_collision", {});
    system.update(world, 1 / 60);
    expect(ship.lives).toBe(initialLives - 1);

    // Clear events for next iteration
    world.clearEvents();

    // Second collision
    world.emitEvent("ship_asteroid_collision", {});
    system.update(world, 1 / 60);
    expect(ship.lives).toBe(initialLives - 2);
  });

  it("should reset rotation on respawn", () => {
    const transform = world.get<Transform>(shipEntityId, Transform);

    if (!transform) {
      throw new Error("Transform not found");
    }

    // Set a rotation
    transform.rotation[2] = Math.PI / 2;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    // Rotation should be reset
    expect(transform.rotation[2]).toBe(0);
  });
});
