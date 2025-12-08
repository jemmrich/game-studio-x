import { describe, it, expect } from "vitest";
import { World } from "../../../core/world.ts";
import { installTransformPlugin } from "../../transform-plugin/mod.ts";
import { installDebugPlugin, DebugBounds, Debug2dGridOverlay, DebugLabel, DebugPerformance, DebugContext } from "../mod.ts";

describe("DebugPlugin", () => {
  it("Basic Installation", () => {
    const world = new World();

    // Install dependencies
    installTransformPlugin(world);

    // Install debug plugin
    installDebugPlugin(world);

    // Check that DebugContext resource was added
    const debugContext = world.getResource<DebugContext>("DebugContext");
    expect(debugContext).toBeDefined();
    expect(debugContext?.enabled).toBe(true);
    expect(debugContext?.visibleLayers.has("bounds")).toBe(true);
    expect(debugContext?.visibleLayers.has("grid")).toBe(true);
    expect(debugContext?.visibleLayers.has("labels")).toBe(true);
    expect(debugContext?.visibleLayers.has("performance")).toBe(true);
  });

  it("Components Creation", () => {
    const bounds = new DebugBounds();
    expect(bounds.color.r).toBe(1);
    expect(bounds.color.g).toBe(0);
    expect(bounds.color.b).toBe(0);
    expect(bounds.color.a).toBe(1);
    expect(bounds.lineWidth).toBe(2);
    expect(bounds.filled).toBe(false);

    const grid = new Debug2dGridOverlay();
    expect(grid.gridSize).toBe(1);
    expect(grid.enabled).toBe(true);

    const label = new DebugLabel("test");
    expect(label.text).toBe("test");
    expect(label.fontSize).toBe(12);

    const perf = new DebugPerformance();
    expect(perf.showFPS).toBe(true);
    expect(perf.showEntityCount).toBe(true);
    expect(perf.sampleRate).toBe(60);
  });

  it("DebugContext Methods", () => {
    const context = new DebugContext();

    // Test toggleFeature
    expect(context.isEnabled("bounds")).toBe(true);
    context.toggleFeature("bounds");
    expect(context.isEnabled("bounds")).toBe(false);
    context.toggleFeature("bounds");
    expect(context.isEnabled("bounds")).toBe(true);

    // Test getMetrics
    const metrics = context.getMetrics();
    expect(metrics.fps).toBe(0);
    expect(metrics.entityCount).toBe(0);
  });
});