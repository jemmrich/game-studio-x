import { generateGUID, type GUID } from "../utils/guid.ts";

export class EntityManager {
  private recycled: GUID[] = [];
  private activeEntities = new Set<GUID>();

  create(): GUID {
    const entity = this.recycled.pop() ?? generateGUID();
    this.activeEntities.add(entity);
    return entity;
  }

  destroy(entity: GUID): void {
    this.activeEntities.delete(entity);
    this.recycled.push(entity);
  }

  exists(entity: GUID): boolean {
    return this.activeEntities.has(entity);
  }

  getAllEntities(): GUID[] {
    return Array.from(this.activeEntities);
  }

  /**
   * Clear the recycled entity pool to prevent ID reuse.
   * Useful when you want to ensure fresh entity IDs (e.g., after major cleanup).
   */
  clearRecycledPool(): void {
    this.recycled = [];
  }
}
