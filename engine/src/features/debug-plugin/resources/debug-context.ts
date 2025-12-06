/**
 * Global debug state and configuration.
 * Manages debug features and their enable/disable state.
 */
export class DebugContext {
  /** Whether debug features are globally enabled */
  enabled: boolean = true;

  /** Set of enabled debug layers/features */
  visibleLayers: Set<string> = new Set(["bounds", "grid", "labels", "performance"]);

  /** Performance metrics */
  metrics: {
    fps: number;
    frameTime: number;
    entityCount: number;
    lastUpdate: number;
  } = {
    fps: 0,
    frameTime: 0,
    entityCount: 0,
    lastUpdate: 0,
  };

  /**
   * Toggle a specific debug feature
   */
  toggleFeature(name: string): void {
    if (this.visibleLayers.has(name)) {
      this.visibleLayers.delete(name);
    } else {
      this.visibleLayers.add(name);
    }
  }

  /**
   * Check if a debug feature is enabled
   */
  isEnabled(name: string): boolean {
    return this.enabled && this.visibleLayers.has(name);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}