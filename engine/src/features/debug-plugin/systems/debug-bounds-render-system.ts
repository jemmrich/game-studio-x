import type { World } from "../../../core/world.ts";
import { DebugBounds } from "../components/debug-bounds.ts";
import { DebugContext } from "../resources/debug-context.ts";
import { Transform } from "../../transform-plugin/components/mod.ts";
import type { HTMLCanvasElement, CanvasRenderingContext2D, Document, Window } from "../types.ts";

/**
 * System that renders debug bounds for entities with DebugBounds + Transform components.
 * Renders bounding boxes as 2D overlays on the screen.
 */
export class DebugBoundsRenderSystem {
  enabled: boolean = true;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  update(world: World, _dt: number): void {
    const debugContext = world.getResource<DebugContext>("DebugContext");
    if (!debugContext || !debugContext.isEnabled("bounds")) return;

    // Initialize overlay canvas if needed
    if (!this.overlayCanvas) {
      this.initializeOverlay();
    }

    if (!this.ctx || !this.overlayCanvas) return;

    // Clear previous frame
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Get all entities with DebugBounds and Transform
    const entities = world.query(Transform, DebugBounds).entities();

    for (const entity of entities) {
      const transform = world.get(entity, Transform) as Transform;
      const bounds = world.get(entity, DebugBounds) as DebugBounds;

      this.renderBounds(transform, bounds);
    }
  }

  private initializeOverlay(): void {
    const g = globalThis as unknown as {
      document?: Document;
      window?: Window;
    };
    if (!g.document || !g.window) return;

    const renderCanvas = g.document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!renderCanvas) return;

    // Create overlay canvas
    this.overlayCanvas = g.document.createElement("canvas");
    this.overlayCanvas.style.position = "fixed";
    this.overlayCanvas.style.top = "0";
    this.overlayCanvas.style.left = "0";
    this.overlayCanvas.style.pointerEvents = "none";
    this.overlayCanvas.style.zIndex = "999"; // Below UI but above game
    this.overlayCanvas.style.backgroundColor = "transparent";

    g.document.body.appendChild(this.overlayCanvas);
    this.ctx = this.overlayCanvas.getContext("2d");

    // Match canvas size
    this.overlayCanvas.width = g.window.innerWidth;
    this.overlayCanvas.height = g.window.innerHeight;

    // Listen for window resize
    const resizeHandler = () => {
      if (this.overlayCanvas && g.window) {
        this.overlayCanvas.width = g.window.innerWidth;
        this.overlayCanvas.height = g.window.innerHeight;
      }
    };
    g.window.addEventListener("resize", resizeHandler);
  }

  private renderBounds(transform: Transform, bounds: DebugBounds): void {
    if (!this.ctx || !this.overlayCanvas) return;

    // For now, render a simple box at the entity's position
    // In a real implementation, this would calculate actual bounds
    const screenX = this.worldToScreen(transform.position[0], this.overlayCanvas.width);
    const screenY = this.worldToScreen(transform.position[1], this.overlayCanvas.height);

    const size = 20; // Fixed size for demo

    this.ctx.strokeStyle = `rgba(${bounds.color.r * 255}, ${bounds.color.g * 255}, ${bounds.color.b * 255}, ${bounds.color.a})`;
    this.ctx.lineWidth = bounds.lineWidth;

    if (bounds.filled) {
      this.ctx.fillStyle = `rgba(${bounds.color.r * 255}, ${bounds.color.g * 255}, ${bounds.color.b * 255}, ${bounds.color.a * 0.3})`;
      this.ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
    }

    this.ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
  }

  private worldToScreen(worldCoord: number, screenSize: number): number {
    // Simple projection - in a real implementation, this would use camera matrices
    return screenSize / 2 + worldCoord * 50; // 50 pixels per unit
  }

  dispose(): void {
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
    }
    this.ctx = null;
  }
}