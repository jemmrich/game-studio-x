import type { Scene } from "./scene.ts";
import type { World } from "./world.ts";
import { Tag } from "../components/tag.ts";

/**
 * Base class for production game scenes with common functionality.
 * Provides default implementations for lifecycle methods and utility helpers.
 *
 * Extend this class for your game scenes:
 * ```typescript
 * export class GameplayScene extends BaseScene {
 *   constructor() {
 *     super('gameplay');
 *   }
 *
 *   init(world: World): void {
 *     const player = this.createEntity(world);
 *     player.addComponent(new Transform());
 *     player.addComponent(new Player());
 *   }
 * }
 * ```
 */
export abstract class BaseScene implements Scene {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Called once when scene is created.
   * Override to perform one-time setup (load assets, etc).
   */
  create(): void {
    // Override in subclass if needed
  }

  /**
   * Called when scene becomes active.
   * Implement this to spawn entities and initialize your scene.
   */
  abstract init(world: World): void;

  /**
   * Called when scene is deactivated (e.g., pause menu pushed on top).
   * Override to pause animations, systems, etc.
   */
  pause(_world: World): void {
    // Override in subclass if needed
  }

  /**
   * Called when scene is reactivated after pause.
   * Override to resume animations, systems, etc.
   */
  resume(_world: World): void {
    // Override in subclass if needed
  }

  /**
   * Reset scene to initial state without full reload.
   * Default implementation: clean up and re-init.
   */
  reset(world: World): void {
    this.cleanup(world);
    this.init(world);
  }

  /**
   * Called every frame while scene is active.
   * Override to implement per-frame scene logic.
   */
  update(_world: World, _dt: number): void {
    // Override in subclass if needed
  }

  /**
   * Called when scene is being permanently removed.
   * Override to release resources beyond entity cleanup.
   */
  dispose(world: World): void {
    this.cleanup(world);
  }

  /**
   * Helper: Remove all entities owned by this scene (tagged with scene ID).
   */
  protected cleanup(world: World): void {
    const allEntities = world.getAllEntities();

    for (const entity of allEntities) {
      const tag = world.get(entity, Tag) as Tag | undefined;
      if (tag && tag.value === this.id) {
        world.destroyEntity(entity);
      }
    }
  }

  /**
   * Helper: Create an entity and automatically tag it with this scene's ID.
   * All entities created with this helper will be automatically cleaned up
   * when the scene unloads, resets, or disposes.
   */
  protected createEntity(world: World): ReturnType<typeof world.createEntity> {
    const entity = world.createEntity();
    world.add(entity, new Tag(this.id));
    return entity;
  }
}
