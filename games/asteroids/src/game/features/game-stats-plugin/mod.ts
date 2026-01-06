import type { World } from "@engine/core/world.ts";

// Resources
export { GameStats, type GameStatsOptions } from "./resources/mod.ts";

import { GameStats, type GameStatsOptions } from "./resources/mod.ts";

/**
 * Install the Game Stats Plugin
 * Registers the GameStats resource in the world
 */
export function installGameStatsPlugin(
  world: World,
  options?: GameStatsOptions,
): void {
  // Create and add GameStats resource
  const gameStats = new GameStats(options);
  world.addResource("gameStats", gameStats);
}
