/**
 * Component that tracks and displays performance metrics.
 * This is typically a global component managed by the scene/world.
 */
export class DebugPerformance {
  /** Whether to show FPS counter */
  showFPS: boolean;

  /** Whether to show entity count */
  showEntityCount: boolean;

  /** Whether to show frame time */
  showFrameTime: boolean;

  /** How often to sample metrics (in frames) */
  sampleRate: number;

  constructor(
    showFPS: boolean = true,
    showEntityCount: boolean = true,
    showFrameTime: boolean = true,
    sampleRate: number = 60
  ) {
    this.showFPS = showFPS;
    this.showEntityCount = showEntityCount;
    this.showFrameTime = showFrameTime;
    this.sampleRate = sampleRate;
  }
}