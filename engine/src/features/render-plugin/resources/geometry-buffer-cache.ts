import type {
  WebGLBuffer,
  WebGLVertexArrayObject,
  WebGL2RenderingContext,
} from "../types.ts";

export interface BufferData {
  vertexBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  indexCount: number;
}

export class GeometryBufferCache {
  private cache: Map<string, BufferData> = new Map();

  get(key: string): BufferData | undefined {
    return this.cache.get(key);
  }

  set(key: string, bufferData: BufferData): void {
    this.cache.set(key, bufferData);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  dispose(gl: WebGL2RenderingContext): void {
    for (const bufferData of this.cache.values()) {
      gl.deleteBuffer(bufferData.vertexBuffer);
      gl.deleteBuffer(bufferData.indexBuffer);
      gl.deleteBuffer(bufferData.normalBuffer);
      gl.deleteBuffer(bufferData.uvBuffer);
      gl.deleteVertexArray(bufferData.vao);
    }
    this.cache.clear();
  }
}
