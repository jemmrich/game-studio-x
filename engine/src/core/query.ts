import type { GUID } from "../utils/guid.ts";
import type { World } from "./world.ts";

export class Query {
  constructor(private world: World, private components: Function[]) {}

  entities(): GUID[] {
    const result: GUID[] = [];
    for (const [entity] of this) {
      result.push(entity);
    }
    return result;
  }

  *[Symbol.iterator]() {
    const compMgr = this.world._components();
    const first = this.components[0];
    const map = compMgr.getStore(first);
    if (!map) return;

    for (const [entity] of map) {
      let matches = true;
      const result = [];

      for (const compClass of this.components) {
        const comp = compMgr.get(entity, compClass);
        if (!comp) {
          matches = false;
          break;
        }
        result.push(comp);
      }

      if (matches) yield [entity, ...result];
    }
  }
}
