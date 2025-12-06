import type { Color } from "../types.ts";
import type { Vec3 } from "../types.ts";

/**
 * Component that attaches debug text to an entity.
 * The text follows the entity's position in world space.
 */
export class DebugLabel {
  /** The text to display */
  text: string;

  /** Offset from the entity's position (in world units) */
  offset: Vec3;

  /** Color of the text */
  color: Color;

  /** Font size in pixels */
  fontSize: number;

  constructor(
    text: string = "",
    offset: Vec3 = { x: 0, y: 0, z: 0 },
    color: Color = { r: 1, g: 1, b: 1, a: 1 },
    fontSize: number = 12
  ) {
    this.text = text;
    this.offset = offset;
    this.color = color;
    this.fontSize = fontSize;
  }
}