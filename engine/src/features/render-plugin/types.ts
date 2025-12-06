/**
 * Type definitions for WebGL objects
 * Since Deno doesn't have WebGL types in its standard lib,
 * we define minimal interfaces to satisfy TypeScript's strict mode
 */

// WebGL objects - represented as opaque types
export type WebGLBuffer = object;
export type WebGLVertexArrayObject = object;
export type WebGLProgram = object;
export type WebGLShader = object;
export type WebGLUniformLocation = object;
export type HTMLCanvasElement = {
  getContext(contextId: string, ...args: unknown[]): unknown;
  width: number;
  height: number;
  clientWidth: number;
  clientHeight: number;
};

// WebGL2RenderingContext - a minimal interface for type checking
// In practice, this will accept any WebGL2 context object
export interface WebGL2RenderingContext {
  readonly ARRAY_BUFFER: number;
  readonly ELEMENT_ARRAY_BUFFER: number;
  readonly STATIC_DRAW: number;
  readonly FLOAT: number;
  readonly UNSIGNED_INT: number;
  readonly TRIANGLES: number;
  readonly COLOR_BUFFER_BIT: number;
  readonly DEPTH_BUFFER_BIT: number;
  readonly DEPTH_TEST: number;
  readonly LEQUAL: number;
  readonly CULL_FACE: number;
  readonly BACK: number;
  readonly BLEND: number;
  readonly SRC_ALPHA: number;
  readonly ONE_MINUS_SRC_ALPHA: number;
  readonly COMPILE_STATUS: number;
  readonly LINK_STATUS: number;
  readonly VERTEX_SHADER: number;
  readonly FRAGMENT_SHADER: number;

  // Buffer operations
  createBuffer(): WebGLBuffer | null;
  bindBuffer(target: number, buffer: WebGLBuffer | null): void;
  bufferData(target: number, data: BufferSource, usage: number): void;
  deleteBuffer(buffer: WebGLBuffer | null): void;

  // Vertex Array operations
  createVertexArray(): WebGLVertexArrayObject | null;
  bindVertexArray(vao: WebGLVertexArrayObject | null): void;
  deleteVertexArray(vao: WebGLVertexArrayObject | null): void;
  enableVertexAttribArray(index: number): void;
  vertexAttribPointer(
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number,
  ): void;

  // Program/Shader operations
  createProgram(): WebGLProgram | null;
  createShader(type: number): WebGLShader | null;
  shaderSource(shader: WebGLShader, source: string): void;
  compileShader(shader: WebGLShader): void;
  attachShader(program: WebGLProgram, shader: WebGLShader): void;
  linkProgram(program: WebGLProgram): void;
  useProgram(program: WebGLProgram | null): void;
  deleteProgram(program: WebGLProgram | null): void;
  deleteShader(shader: WebGLShader | null): void;
  getShaderParameter(shader: WebGLShader, pname: number): unknown;
  getProgramParameter(program: WebGLProgram, pname: number): unknown;
  getShaderInfoLog(shader: WebGLShader): string | null;
  getProgramInfoLog(program: WebGLProgram): string | null;

  // Uniform/Attribute operations
  getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null;
  getAttribLocation(program: WebGLProgram, name: string): number;
  uniform1f(location: WebGLUniformLocation | null, x: number): void;
  uniform1i(location: WebGLUniformLocation | null, x: number): void;
  uniform3f(location: WebGLUniformLocation | null, x: number, y: number, z: number): void;
  uniform4f(
    location: WebGLUniformLocation | null,
    x: number,
    y: number,
    z: number,
    w: number,
  ): void;
  uniformMatrix3fv(
    location: WebGLUniformLocation | null,
    transpose: boolean,
    data: Float32Array,
  ): void;
  uniformMatrix4fv(
    location: WebGLUniformLocation | null,
    transpose: boolean,
    data: Float32Array,
  ): void;

  // Rendering operations
  clear(mask: number): void;
  drawElements(mode: number, count: number, type: number, offset: number): void;
  viewport(x: number, y: number, width: number, height: number): void;
  clearColor(red: number, green: number, blue: number, alpha: number): void;

  // State operations
  enable(cap: number): void;
  disable(cap: number): void;
  cullFace(mode: number): void;
  blendFunc(sfactor: number, dfactor: number): number;
  depthFunc(func: number): void;
  getExtension(name: string): unknown;
}
