/**
 * RenderContext resource
 * Provides access to canvas dimensions for ECS systems.
 * Uses getters to ensure dimensions are always current if canvas is resized.
 */
export class RenderContext {
  constructor(private canvas: HTMLCanvasElement) {}

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }
}
