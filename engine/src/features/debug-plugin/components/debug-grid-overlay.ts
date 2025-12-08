import type { Color } from "../types.ts";

/**
 * Component that renders a debug 2D grid overlay.
 * This is typically a global component managed by the scene/world.
 */
export class Debug2dGridOverlay {
  /** Size of each grid cell */
  gridSize: number;

  /** Color of the grid lines */
  color: Color;

  /** Opacity of the grid (0-1) */
  opacity: number;

  /** Whether the grid is enabled */
  enabled: boolean;

  constructor(
    gridSize: number = 1,
    color: Color = { r: 0.5, g: 0.5, b: 0.5, a: 0.5 },
    opacity: number = 0.5,
    enabled: boolean = true
  ) {
    this.gridSize = gridSize;
    this.color = color;
    this.opacity = opacity;
    this.enabled = enabled;
  }
}