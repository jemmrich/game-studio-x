import type { WebGLProgram, WebGL2RenderingContext } from "../types.ts";

export class ShaderLibrary {
  private programs: Map<string, WebGLProgram> = new Map();
  defaultProgramId: string = "basic";

  add(id: string, program: WebGLProgram): void {
    this.programs.set(id, program);
  }

  get(id: string): WebGLProgram | undefined {
    return this.programs.get(id);
  }

  has(id: string): boolean {
    return this.programs.has(id);
  }

  dispose(gl: WebGL2RenderingContext): void {
    for (const program of this.programs.values()) {
      gl.deleteProgram(program);
    }
    this.programs.clear();
  }
}
