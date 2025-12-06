import type { World } from "../core/world.ts";
import { DemoUIText } from "../components/demo-ui-text.ts";

/**
 * System that renders DemoUIText components to a 2D canvas overlay.
 * Runs every frame to update demo UI displays (instructions, descriptions, etc).
 */
export class DemoUIRenderSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;

  update(world: World, _dt: number): void {
    // Get or create overlay canvas on first run
    if (!this.overlayCanvas) {
      const renderCanvas = document.querySelector("canvas") as HTMLCanvasElement | null;
      if (!renderCanvas) return;

      this.canvas = renderCanvas;

      // Create overlay canvas
      this.overlayCanvas = document.createElement("canvas");
      this.overlayCanvas.style.position = "fixed";
      this.overlayCanvas.style.top = "0";
      this.overlayCanvas.style.left = "0";
      this.overlayCanvas.style.pointerEvents = "none";
      this.overlayCanvas.style.zIndex = "1000";
      this.overlayCanvas.style.backgroundColor = "transparent";

      document.body.appendChild(this.overlayCanvas);
      this.ctx = this.overlayCanvas.getContext("2d");

      // Match canvas size
      this.overlayCanvas.width = window.innerWidth;
      this.overlayCanvas.height = window.innerHeight;

      // Listen for window resize
      const resizeHandler = () => {
        if (this.overlayCanvas) {
          this.overlayCanvas.width = window.innerWidth;
          this.overlayCanvas.height = window.innerHeight;
        }
      };
      window.addEventListener("resize", resizeHandler);
    }

    if (!this.ctx || !this.overlayCanvas) return;

    // Clear the overlay
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Get all entities with DemoUIText
    const allEntities = world.getAllEntities();

    for (const entity of allEntities) {
      const uiText = world.get(entity, DemoUIText) as DemoUIText | undefined;
      if (uiText) {
        this.renderUIText(uiText);
      }
    }
  }

  private renderUIText(ui: DemoUIText): void {
    if (!this.ctx || !this.overlayCanvas) return;

    const config = ui.config;
    const canvas = this.overlayCanvas;
    const ctx = this.ctx;

    // Calculate position
    let x = config.marginX;
    let y = config.marginY;

    if (config.position.includes("right")) {
      x = canvas.width - config.marginX;
    }
    if (config.position.includes("bottom")) {
      y = canvas.height - config.marginY;
    }

    // Calculate content dimensions
    ctx.font = `${config.fontSize}px monospace`;
    const lineHeight = config.fontSize + 4;
    const titleHeight = config.title ? lineHeight : 0;
    const contentHeight = config.title ? config.lines.length + 1 : config.lines.length;
    const width = Math.max(
      config.title ? ctx.measureText(config.title).width : 0,
      ...config.lines.map((line) => ctx.measureText(line).width)
    ) + config.padding * 2;
    const height = contentHeight * lineHeight + config.padding * 2;

    // Adjust position for right/bottom alignment
    if (config.position.includes("right")) {
      x -= width;
    }
    if (config.position.includes("bottom")) {
      y -= height;
    }

    // Draw background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(x, y, width, height);

    // Draw text
    let textY = y + config.padding + config.fontSize;

    // Draw title if present
    if (config.title) {
      ctx.fillStyle = config.titleColor;
      ctx.font = `bold ${config.fontSize}px monospace`;
      ctx.fillText(config.title, x + config.padding, textY);
      textY += lineHeight;
      ctx.font = `${config.fontSize}px monospace`;
    }

    // Draw lines
    ctx.fillStyle = config.textColor;
    for (const line of config.lines) {
      ctx.fillText(line, x + config.padding, textY);
      textY += lineHeight;
    }
  }

  dispose(): void {
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
    }
    this.ctx = null;
    this.canvas = null;
  }
}
