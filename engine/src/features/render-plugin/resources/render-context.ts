import type { HTMLCanvasElement, WebGL2RenderingContext, WebGLProgram } from "../types.ts";

export class RenderContext {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null = null;
  currentShaderProgram: WebGLProgram | null = null;
  viewMatrix: Float32Array = new Float32Array(16);
  projectionMatrix: Float32Array = new Float32Array(16);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  dispose(): void {
    if (this.gl) {
      const loseContext = (this.gl as any).getExtension("WEBGL_lose_context");
      if (loseContext) {
        loseContext.loseContext();
      }
    }
    this.gl = null;
  }
}
