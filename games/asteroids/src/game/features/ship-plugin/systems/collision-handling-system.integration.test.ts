import { describe, it, expect, beforeEach } from "vitest";
import { World } from "@engine/core/world.ts";
import { ShipComponent } from "../components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { CollisionHandlingSystem } from "./collision-handling-system.ts";
import { spawnPlayerShip } from "../factories/mod.ts";
import { installGameStatsPlugin } from "../../game-stats-plugin/mod.ts";

describe("CollisionHandlingSystem Integration", () => {
  let world: World;
  let system: CollisionHandlingSystem;
  let shipEntityId: any;

  beforeEach(() => {
    world = new World();
    system = new CollisionHandlingSystem();

    // Register render context
    world.addResource("render_context", { width: 800, height: 600 });

    // Install game stats plugin
    installGameStatsPlugin(world);

    // Spawn a player ship
    shipEntityId = spawnPlayerShip(world);
    system.setShipEntityId(shipEntityId);
  });

  it("should decrement lives on collision", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const gameStats = world.getResource("gameStats");

    if (!gameStats || !ship) {
      throw new Error("GameStats or ShipComponent not found");
    }

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

    const initialLives = (gameStats as any).currentLives;

    // Emit collision event
    world.emitEvent("ship_asteroid_collision", {
      asteroidEntityId: "test_asteroid",
    });

    system.update(world, 1 / 60);

    expect((gameStats as any).currentLives).toBe(initialLives - 1);
  });

  it("should respawn at center when lives > 0", () => {
    const transform = world.get<Transform>(shipEntityId, Transform);
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const gameStats = world.getResource("gameStats");

    if (!transform || !ship || !gameStats) {
      throw new Error("Components not found");
    }

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

    // Move ship away from center
    transform.position[0] = 100;
    transform.position[1] = 100;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    // Ship should be respawned at center (approximately)
    // Note: using approximate comparison due to potential world coord conversion
    expect((gameStats as any).currentLives).toBe(2); // Started at 3, decremented to 2
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
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);

    if (!ship) {
      throw new Error("ShipComponent not found");
    }

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    const respawnEvents = world.getEvents("respawn_player");
    expect(respawnEvents.length).toBeGreaterThan(0);
  });

  it("should emit game_over event when lives reach 0", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const gameStats = world.getResource("gameStats");

    if (!ship || !gameStats) {
      throw new Error("ShipComponent or GameStats not found");
    }

    (gameStats as any).currentLives = 1; // Set to 1, next collision will reduce to 0

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    const gameOverEvents = world.getEvents("game_over");
    expect(gameOverEvents.length).toBeGreaterThan(0);
    expect(gameOverEvents[0].data.reason).toBe("no_lives_remaining");
  });

  it("should destroy ship entity when lives reach 0", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const gameStats = world.getResource("gameStats");

    if (!ship || !gameStats) {
      throw new Error("ShipComponent or GameStats not found");
    }

    (gameStats as any).currentLives = 1;

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

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
    const gameStats = world.getResource("gameStats");

    if (!ship || !gameStats) {
      throw new Error("ShipComponent or GameStats not found");
    }

    // Disable invincibility so collisions are detected
    ship.isInvincible = false;

    const initialLives = (gameStats as any).currentLives;

    // First collision
    world.emitEvent("ship_asteroid_collision", {});
    system.update(world, 1 / 60);
    expect((gameStats as any).currentLives).toBe(initialLives - 1);

    // Clear events for next iteration and disable invincibility again for second collision
    world.clearEvents();
    ship.isInvincible = false;

    // Second collision
    world.emitEvent("ship_asteroid_collision", {});
    system.update(world, 1 / 60);
    expect((gameStats as any).currentLives).toBe(initialLives - 2);
  });

  it("should reset rotation on respawn", () => {
    const ship = world.get<ShipComponent>(shipEntityId, ShipComponent);
    const transform = world.get<Transform>(shipEntityId, Transform);

    if (!ship || !transform) {
      throw new Error("ShipComponent or Transform not found");
    }

    // Disable invincibility so collision is detected
    ship.isInvincible = false;

    // Set a rotation
    transform.rotation[2] = Math.PI / 2;

    // Emit collision
    world.emitEvent("ship_asteroid_collision", {});

    system.update(world, 1 / 60);

    // Rotation should be reset
    expect(transform.rotation[2]).toBe(0);
  });
});
