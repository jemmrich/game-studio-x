import type { World } from "../../../core/world.ts";
import { DebugLabel } from "../components/debug-label.ts";
import { DebugContext } from "../resources/debug-context.ts";
import { Transform } from "../../transform-plugin/components/mod.ts";
import { RenderContext } from "../../render-plugin/resources/render-context.ts";
import { CameraState } from "../../render-plugin/resources/camera-state.ts";
import * as math from "../../../utils/math.ts";
import type { HTMLCanvasElement, CanvasRenderingContext2D, Document, Window } from "../types.ts";

/**
 * System that renders debug labels for entities with DebugLabel + Transform components.
 * Renders text overlays at entity positions.
 */
export class DebugLabelRenderSystem {
  enabled: boolean = true;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private world: World | null = null;

  update(world: World, _dt: number): void {
    this.world = world;
    const debugContext = world.getResource<DebugContext>("DebugContext");
    if (!debugContext || !debugContext.isEnabled("labels")) return;

    // Initialize overlay canvas if needed
    if (!this.overlayCanvas) {
      this.initializeOverlay();
    }

    if (!this.ctx || !this.overlayCanvas) return;

    // Clear previous frame
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Get all entities with DebugLabel and Transform
    const entities = world.query(Transform, DebugLabel).entities();

    for (const entity of entities) {
      const transform = world.get(entity, Transform) as Transform;
      const label = world.get(entity, DebugLabel) as DebugLabel;

      this.renderLabel(transform, label);
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
    this.overlayCanvas.style.zIndex = "997"; // Below grid but above game
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

  private renderLabel(transform: Transform, label: DebugLabel): void {
    if (!this.ctx || !this.overlayCanvas || !label.text) return;

    // For now, use simple 2D projection - camera perspective makes 3D projection tricky
    const screenX = this.worldToScreen(transform.position[0] + label.offset.x, this.overlayCanvas.width);
    const screenY = this.worldToScreen(transform.position[1] + label.offset.y, this.overlayCanvas.height);

    this.drawLabel(label, screenX, screenY);
  }

  private drawLabel(label: DebugLabel, screenX: number, screenY: number): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = `rgba(${label.color.r * 255}, ${label.color.g * 255}, ${label.color.b * 255}, ${label.color.a})`;
    this.ctx.font = `${label.fontSize}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.ctx.fillText(label.text, screenX, screenY);
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