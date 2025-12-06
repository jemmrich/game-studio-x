import type { World } from "../../../core/world.ts";
import { DebugPerformance } from "../components/debug-performance.ts";
import { DebugContext } from "../resources/debug-context.ts";
import { DemoUIText } from "../../../components/demo-ui-text.ts";

/**
 * System that tracks and displays performance metrics.
 * Updates the DebugContext with current FPS, frame time, and entity count.
 */
export class DebugPerformanceSystem {
  enabled: boolean = true;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private frameTimeAccum: number = 0;

  update(world: World, dt: number): void {
    const debugContext = world.getResource<DebugContext>("DebugContext");
    if (!debugContext) return;

    // Find the DebugPerformance component (should be on a global entity)
    const entities = world.query(DebugPerformance).entities();
    if (entities.length === 0) return;

    const perfComponent = world.get(entities[0], DebugPerformance) as DebugPerformance;

    // Update metrics
    this.frameCount++;
    this.frameTimeAccum += dt;

    const currentTime = performance.now();
    const timeDiff = currentTime - this.lastTime;

    // Update metrics every sampleRate frames
    if (this.frameCount >= perfComponent.sampleRate) {
      const avgFrameTime = this.frameTimeAccum / this.frameCount;
      const fps = 1000 / avgFrameTime;

      debugContext.metrics.fps = Math.round(fps);
      debugContext.metrics.frameTime = Math.round(avgFrameTime * 1000) / 1000; // ms
      debugContext.metrics.entityCount = world.getAllEntities().length;
      debugContext.metrics.lastUpdate = currentTime;

      // Reset counters
      this.frameCount = 0;
      this.frameTimeAccum = 0;
    }

    this.lastTime = currentTime;

    // If performance display is enabled, render it
    if (debugContext.isEnabled("performance")) {
      this.renderPerformanceOverlay(world, debugContext, perfComponent);
    } else {
      // Remove DemoUIText if it exists
      const entities = world.query(DebugPerformance).entities();
      if (entities.length > 0) {
        const entity = entities[0];
        const uiText = world.get(entity, DemoUIText);
        if (uiText) {
          world.remove(entity, DemoUIText);
        }
      }
    }
  }

  private renderPerformanceOverlay(world: World, debugContext: DebugContext, perfComponent: DebugPerformance): void {
    // Find the entity with DebugPerformance component
    const entities = world.query(DebugPerformance).entities();
    if (entities.length === 0) return;

    const entity = entities[0];

    // Create performance lines
    const lines: string[] = [];
    if (perfComponent.showFPS) {
      lines.push(`FPS: ${debugContext.metrics.fps}`);
    }
    if (perfComponent.showEntityCount) {
      lines.push(`Entities: ${debugContext.metrics.entityCount}`);
    }
    if (perfComponent.showFrameTime) {
      lines.push(`Frame Time: ${debugContext.metrics.frameTime}ms`);
    }

    // Check if entity already has DemoUIText, update it or add new
    let uiText = world.get(entity, DemoUIText) as DemoUIText | undefined;
    if (uiText) {
      // Update existing
      uiText.config.lines = lines;
    } else {
      // Create new
      uiText = new DemoUIText({
        position: "top-right",
        title: "Performance",
        lines,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#00ff00",
        textColor: "#ffffff",
      });
      world.add(entity, uiText);
    }
  }
}