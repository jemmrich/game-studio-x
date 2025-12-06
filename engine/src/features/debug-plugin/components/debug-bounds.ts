import type { Color } from "../types.ts";

/**
 * Component that marks an entity for bounds visualization.
 * When attached to an entity with a Transform, renders debug geometry
 * showing the entity's bounding box or collision bounds.
 */
export class DebugBounds {
  /** Color of the bounds visualization */
  color: Color;

  /** Width of the bounds lines */
  lineWidth: number;

  /** Whether to render filled bounds or just outline */
  filled: boolean;

  constructor(
    color: Color = { r: 1, g: 0, b: 0, a: 1 },
    lineWidth: number = 2,
    filled: boolean = false
  ) {
    this.color = color;
    this.lineWidth = lineWidth;
    this.filled = filled;
  }
}