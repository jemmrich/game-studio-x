import type { World } from "../core/world.ts";
import type { GUID } from "./guid.ts";
import { Name } from "../components/name.ts";

/**
 * cloneEntity(entity)
 * Deep clone an entity: all components copied (but not parent/child hierarchy by default).
 * Note: This is a simplified version. For full cloning, implement a proper clone method.
 */
export function cloneEntity(world: World, _entity: GUID): GUID {
  const newEntity = world.createEntity();
  // TODO: Implement proper cloning without accessing private stores
  // This would require adding a public API to World for iterating components
  console.warn("cloneEntity is not fully implemented yet");
  return newEntity;
}

/**
 * spawnPrefab(prefab, options)
 * Prefabs define a set of components. Each call returns a new entity.
 * Example:
 *   const player = spawnPrefab(world, PlayerPrefab);
 */
export function spawnPrefab(
  world: World,
  prefab: (
    world: World,
    entity: GUID,
    options: Record<string, unknown>,
  ) => void,
  options?: Record<string, unknown>,
): GUID {
  const entity = world.createEntity();
  prefab(world, entity, options || {});
  return entity;
}

/**
 * renameEntity(entity, name)
 * Useful for debugging: add Name component dynamically.
 */
export function renameEntity(world: World, entity: GUID, name: string) {
  world.add(entity, new Name(name));
}
