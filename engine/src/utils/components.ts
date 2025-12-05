import type { World } from "../core/world.ts";
import type { GUID } from "./guid.ts";

/**
 * addTag(entity, TagComponent)
 * Tag components are classes with no fields (marker components).
 */
export function addTag<T extends new () => unknown>(
  world: World,
  entity: GUID,
  TagComponent: T,
) {
  world.add(entity, new TagComponent());
}

/**
 * removeTag(entity, TagComponent)
 */
export function removeTag<T extends new () => unknown>(
  world: World,
  entity: GUID,
  TagComponent: T,
) {
  world.remove(entity, TagComponent);
}

/**
 * hasTag(entity, TagComponent)
 */
export function hasTag<T extends new () => unknown>(
  world: World,
  entity: GUID,
  TagComponent: T,
) {
  return world.has(entity, TagComponent);
}

/**
 * getOrAddComponent(entity, ComponentClass)
 * Returns existing component, or adds a new one if missing.
 */
export function getOrAddComponent<T extends new () => InstanceType<T>>(
  world: World,
  entity: GUID,
  ComponentClass: T,
): InstanceType<T> {
  let instance = world.get<InstanceType<T>>(entity, ComponentClass);
  if (!instance) {
    instance = new ComponentClass();
    world.add(entity, instance);
  }
  return instance;
}

/**
 * addComponentIfMissing(entity, component)
 */
export function addComponentIfMissing(
  world: World,
  entity: GUID,
  component: object,
) {
  const ComponentClass = component.constructor;
  if (!world.has(entity, ComponentClass)) {
    world.add(entity, component);
  }
}

/**
 * withComponents(entity, ...components)
 * Utility for quickly attaching multiple components to a new entity.
 */
export function withComponents(world: World, ...components: object[]): GUID {
  const entity = world.createEntity();
  for (const c of components) {
    world.add(entity, c);
  }
  return entity;
}
