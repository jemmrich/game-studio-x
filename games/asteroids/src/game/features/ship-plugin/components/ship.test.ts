import { describe, it, expect } from "vitest";
import { ShipComponent } from "./ship.ts";

describe("ShipComponent", () => {
  it("should create a ship with default options", () => {
    const ship = new ShipComponent();

    expect(ship.lives).toBe(3);
    expect(ship.acceleration).toBe(80);
    expect(ship.maxVelocity).toBe(120);
    expect(ship.rotationSpeed).toBe(4.71);
    expect(ship.rotationDirection).toBe(0);
    expect(ship.isThrusting).toBe(false);
    expect(ship.isInvincible).toBe(true);
    expect(ship.boundingBoxEnabled).toBe(false);
    expect(ship.velocityFriction).toBe(0.98);
  });

  it("should create a ship with custom options", () => {
    const options = {
      lives: 5,
      acceleration: 100,
      maxVelocity: 150,
      rotationSpeed: 6.0,
      boundingBoxEnabled: true,
      velocityFriction: 0.95,
    };

    const ship = new ShipComponent(options);

    expect(ship.lives).toBe(5);
    expect(ship.acceleration).toBe(100);
    expect(ship.maxVelocity).toBe(150);
    expect(ship.rotationSpeed).toBe(6.0);
    expect(ship.boundingBoxEnabled).toBe(true);
    expect(ship.velocityFriction).toBe(0.95);
  });

  it("should allow lives to be decremented", () => {
    const ship = new ShipComponent({ lives: 3 });
    ship.lives -= 1;
    expect(ship.lives).toBe(2);

    ship.lives -= 1;
    expect(ship.lives).toBe(1);

    ship.lives -= 1;
    expect(ship.lives).toBe(0);
  });

  it("should allow rotation direction to be set", () => {
    const ship = new ShipComponent();

    ship.rotationDirection = 1;
    expect(ship.rotationDirection).toBe(1);

    ship.rotationDirection = -1;
    expect(ship.rotationDirection).toBe(-1);

    ship.rotationDirection = 0;
    expect(ship.rotationDirection).toBe(0);
  });

  it("should allow thrust state to be toggled", () => {
    const ship = new ShipComponent();
    expect(ship.isThrusting).toBe(false);

    ship.isThrusting = true;
    expect(ship.isThrusting).toBe(true);

    ship.isThrusting = false;
    expect(ship.isThrusting).toBe(false);
  });

  it("should allow invincibility to be toggled", () => {
    const ship = new ShipComponent();
    expect(ship.isInvincible).toBe(true);

    ship.isInvincible = false;
    expect(ship.isInvincible).toBe(false);

    ship.isInvincible = true;
    expect(ship.isInvincible).toBe(true);
  });

  it("should support partial option overrides", () => {
    const ship = new ShipComponent({ lives: 2 });

    expect(ship.lives).toBe(2);
    expect(ship.acceleration).toBe(80); // default
    expect(ship.maxVelocity).toBe(120); // default
  });
});
