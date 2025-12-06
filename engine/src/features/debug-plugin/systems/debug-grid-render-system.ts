import type { World } from "../../../core/world.ts";
import { DebugGridOverlay } from "../components/debug-grid-overlay.ts";
import { DebugContext } from "../resources/debug-context.ts";
import type { HTMLCanvasElement, CanvasRenderingContext2D, Document, Window } from "../types.ts";

/**
 * System that renders debug grid overlay.
 * Renders a grid pattern over the entire screen.
 */
export class DebugGridRenderSystem {
  enabled: boolean = true;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  update(world: World, _dt: number): void {
    const debugContext = world.getResource<DebugContext>("DebugContext");
    if (!debugContext || !debugContext.isEnabled("grid")) return;

    // Find the DebugGridOverlay component (should be on a global entity)
    const entities = world.query(DebugGridOverlay).entities();
    if (entities.length === 0) return;

    const gridOverlay = world.get(entities[0], DebugGridOverlay) as DebugGridOverlay;
    if (!gridOverlay.enabled) return;

    // Initialize overlay canvas if needed
    if (!this.overlayCanvas) {
      this.initializeOverlay();
    }

    if (!this.ctx || !this.overlayCanvas) return;

    // Clear previous frame
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.renderGrid(gridOverlay);
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
    this.overlayCanvas.style.zIndex = "998"; // Below bounds but above game
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

  private renderGrid(gridOverlay: DebugGridOverlay): void {
    if (!this.ctx || !this.overlayCanvas) return;

    const canvas = this.overlayCanvas;
    const ctx = this.ctx;

    // Grid size in pixels (fixed for screen space grid)
    const gridPixelSize = gridOverlay.gridSize * 50; // 50 pixels per world unit

    ctx.strokeStyle = `rgba(${gridOverlay.color.r * 255}, ${gridOverlay.color.g * 255}, ${gridOverlay.color.b * 255}, ${gridOverlay.color.a * gridOverlay.opacity})`;
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridPixelSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += gridPixelSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  dispose(): void {
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
    }
    this.ctx = null;
  }
}