export class Query {
  constructor(private world, private components: Function[]) {}

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
