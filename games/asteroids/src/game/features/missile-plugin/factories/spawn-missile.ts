import type { World } from "@engine/core/world.ts";
import type { GUID } from "@engine/utils/guid.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { BasicMaterial, Visible } from "@engine/features/render-plugin/mod.ts";
import { Name } from "@engine/components/mod.ts";
import { MissileComponent } from "../components/missile.ts";
import { MissileGeometry } from "../components/missile-geometry.ts";
import { MissileManager } from "../resources/mod.ts";
import { Velocity } from "../../ship-plugin/components/velocity.ts";
import { AudioSystem } from "../../../systems/audio-system.ts";

/**
 * Spawn Interface for Missiles
 *
 * Provides a standardized interface for spawning missiles in the game world.
 * Missiles are rendered as small white dots that travel in a direction.
 *
 * This function handles:
 * - Creating a new missile entity
 * - Attaching necessary components (Transform, Missile, MissileGeometry)
 * - Enforcing missile spawn limits per spawner
 * - Registering the missile with the MissileManager
 *
 * Parameters:
 * - world: The ECS world
 * - position: Initial position [x, y, z]
 * - direction: Normalized direction vector [x, y, z]
 * - spawnerId: The entity ID that is spawning this missile
 * - speed: Velocity magnitude (default: 100)
 * - lifetime: Time before auto-destruction in milliseconds (default: 3000)
 * - maxMissiles: Maximum missiles per spawner (default: 10)
 *
 * Returns:
 * - GUID if successful
 * - null if missile limit reached or spawn fails
 *
 * Notes:
 * - Requires Transform and Render plugins to be installed
 * - Assumes direction vector is normalized
 * - Returns null without error if limit is reached (graceful limit handling)
 * - Missiles are rendered as small white dots on screen
 */
export function spawnMissile(
  world: World,
  position: [number, number, number],
  direction: [number, number, number],
  spawnerId: GUID,
  speed: number = 100,
  lifetime: number = 3000,
  maxMissiles: number = 10,
  spawnerVelocity: [number, number, number] = [0, 0, 0]
): GUID | null {
  // Convert lifetime from milliseconds to seconds for internal use
  const lifetimeSeconds = lifetime / 1000;
  
  const manager = world.getResource<MissileManager>("MissileManager");
  if (!manager) {
    console.warn("MissileManager not found in world. Is MissilePlugin installed?");
    return null;
  }

  // Check missile spawn limit
  if (!manager.canSpawnMissile(spawnerId, maxMissiles)) {
    // Silently fail - missile limit reached
    return null;
  }

  // Create new entity
  const entity = world.createEntity();

  // Offset the spawn position forward in the direction the ship is facing
  // Move about 1.5 units in front of the ship (ship scale is 0.08, so this is clearly in front)
  const spawnOffset = 1.5;
  const spawnPosition: [number, number, number] = [
    position[0] + direction[0] * spawnOffset,
    position[1] + direction[1] * spawnOffset,
    position[2] + direction[2] * spawnOffset,
  ];

  // Transform component - position and scale small for dot rendering
  world.add(entity, new Transform(spawnPosition, [0, 0, 0], [0.02, 0.02, 0.02]));

  // Calculate missile velocity: direction vector at specified speed + spawner's velocity
  const missileVelocityX = direction[0] * speed + spawnerVelocity[0];
  const missileVelocityY = direction[1] * speed + spawnerVelocity[1];
  const missileVelocityZ = direction[2] * speed + spawnerVelocity[2];

  // Velocity component - move in the direction at specified speed, plus inherit spawner velocity
  const velocity = new Velocity(missileVelocityX, missileVelocityY, missileVelocityZ);
  world.add(entity, velocity);

  // Missile component with lifetime and speed
  const missile = new MissileComponent(lifetimeSeconds, speed, spawnerId);
  world.add(entity, missile);

  // Rendering - simple point geometry (dot)
  world.add(entity, new MissileGeometry());

  // Material - small white dot
  world.add(entity, new BasicMaterial([1.0, 1.0, 1.0, 1.0])); // white

  world.add(entity, new Visible(true));

  // Debug name
  world.add(entity, new Name("Missile"));

  // Register missile with manager
  manager.addMissile(spawnerId, entity);

  // Play missile fire sound
  AudioSystem.playSound(world, 'missile', 0.75);

  return entity;
}
