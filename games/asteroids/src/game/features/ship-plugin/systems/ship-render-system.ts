import type { World } from "@engine/core/world.ts";
import type { WebGL2RenderingContext } from "@engine/features/render-plugin/types.ts";
import { ShipGeometry } from "../components/ship-geometry.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { BasicMaterial } from "@engine/features/render-plugin/mod.ts";
import { BoundingBox } from "../components/bounding-box.ts";
import type { RenderContext } from "@engine/features/render-plugin/resources/render-context.ts";
import type { ShaderLibrary } from "@engine/features/render-plugin/resources/shader-library.ts";

/**
 * ShipRenderSystem
 * Renders the player ship as a line strip using the ship's point geometry
 */
export class ShipRenderSystem {
  private lineBuffers: Map<string, any> = new Map();

  update(world: World, _dt: number): void {
    if (!world.hasResource("RenderContext")) return;
    
    const renderContext = world.getResource<RenderContext>("RenderContext");
    const shaderLibrary = world.getResource<ShaderLibrary>("ShaderLibrary");

    if (!renderContext.gl) return;
    const gl = renderContext.gl as any;

    // Query for entities with triangle geometry (ship)
    const query = world.query(ShipGeometry, Transform);
    const entities = query.entities();

    for (const entity of entities) {
      const geometry = world.get<ShipGeometry>(entity, ShipGeometry);
      const transform = world.get<Transform>(entity, Transform);
      
      if (!geometry || !transform) continue;
      
      const material = world.get<BasicMaterial>(entity, BasicMaterial);
      if (!material) continue;

      this.renderShipLines(gl, geometry, transform, material, shaderLibrary, renderContext);

      // Render bounding box if present
      const bbox = world.get<BoundingBox>(entity, BoundingBox);
      if (bbox) {
        this.renderBoundingBox(gl, bbox, transform, shaderLibrary, renderContext);
      }
    }
  }

  private renderShipLines(
    gl: WebGL2RenderingContext,
    geometry: ShipGeometry,
    transform: Transform,
    material: BasicMaterial,
    shaderLibrary: ShaderLibrary,
    renderContext: RenderContext
  ): void {
    if (geometry.points.length < 2) return;

    const program = shaderLibrary.get("basic");
    if (!program) return;

    gl.useProgram(program);

    // Get or create VAO for this geometry
    const cacheKey = "ship_lines";
    let vao = this.lineBuffers.get(cacheKey);

    if (!vao) {
      vao = this.createLineVAO(gl, geometry, program);
      this.lineBuffers.set(cacheKey, vao);
    }

    gl.bindVertexArray(vao.vao);

    // Set up matrices
    const viewMatrix = renderContext.viewMatrix || this.identityMatrix();
    const projMatrix = renderContext.projectionMatrix || this.identityMatrix();
    const modelMatrix = this.buildModelMatrix(transform);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModel"), false, modelMatrix);

    // Set material color
    const color = material.color || [1, 1, 1, 1];
    gl.uniform4f(
      gl.getUniformLocation(program, "uBaseColor"),
      color[0],
      color[1],
      color[2],
      color[3]
    );

    gl.lineWidth(2);
    // Draw as line strip
    gl.drawArrays(gl.LINE_STRIP, 0, vao.vertexCount);
    gl.bindVertexArray(null);
  }

  private createLineVAO(
    gl: WebGL2RenderingContext,
    geometry: ShipGeometry,
    program: any
  ): any {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vertexCount = geometry.points.length;

    // Convert 2D points to 3D vertices
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (const point of geometry.points) {
      vertices.push(point.x, point.y, 0);
      normals.push(0, 0, 1); // Dummy normals (pointing up)
      uvs.push(0, 0); // Dummy UVs
    }

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const posAttrib = gl.getAttribLocation(program, "aPosition");
    if (posAttrib >= 0) {
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);
    }

    // Normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const normalAttrib = gl.getAttribLocation(program, "aNormal");
    if (normalAttrib >= 0) {
      gl.enableVertexAttribArray(normalAttrib);
      gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
    }

    // UV buffer
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    const uvAttrib = gl.getAttribLocation(program, "aUV");
    if (uvAttrib >= 0) {
      gl.enableVertexAttribArray(uvAttrib);
      gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindVertexArray(null);

    return {
      vao,
      positionBuffer,
      normalBuffer,
      uvBuffer,
      vertexCount,
    };
  }

  private renderBoundingBox(
    gl: WebGL2RenderingContext,
    bbox: BoundingBox,
    transform: Transform,
    shaderLibrary: ShaderLibrary,
    renderContext: RenderContext
  ): void {
    const program = shaderLibrary.get("basic");
    if (!program) return;

    gl.useProgram(program);

    // Get or create bounding box VAO
    const cacheKey = "ship_bbox";
    let vao = this.lineBuffers.get(cacheKey);

    if (!vao) {
      vao = this.createBBoxVAO(gl, bbox, program);
      this.lineBuffers.set(cacheKey, vao);
    }

    gl.bindVertexArray(vao.vao);

    // Set up matrices
    const viewMatrix = renderContext.viewMatrix || this.identityMatrix();
    const projMatrix = renderContext.projectionMatrix || this.identityMatrix();
    const modelMatrix = this.buildModelMatrix(transform);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModel"), false, modelMatrix);

    // Yellow color for bounding box
    gl.uniform4f(gl.getUniformLocation(program, "uBaseColor"), 1, 1, 0, 1);

    gl.lineWidth(2);
    // Draw as line loop
    gl.drawArrays(gl.LINE_LOOP, 0, vao.vertexCount);
    gl.bindVertexArray(null);
  }

  private createBBoxVAO(
    gl: WebGL2RenderingContext,
    bbox: BoundingBox,
    program: any
  ): any {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create 4 corners of the bounding box
    const vertices = [
      bbox.minX, bbox.minY, 0,
      bbox.maxX, bbox.minY, 0,
      bbox.maxX, bbox.maxY, 0,
      bbox.minX, bbox.maxY, 0,
    ];

    const normals = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];

    const uvs = [
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ];

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const posAttrib = gl.getAttribLocation(program, "aPosition");
    if (posAttrib >= 0) {
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);
    }

    // Normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const normalAttrib = gl.getAttribLocation(program, "aNormal");
    if (normalAttrib >= 0) {
      gl.enableVertexAttribArray(normalAttrib);
      gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
    }

    // UV buffer
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    const uvAttrib = gl.getAttribLocation(program, "aUV");
    if (uvAttrib >= 0) {
      gl.enableVertexAttribArray(uvAttrib);
      gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindVertexArray(null);

    return {
      vao,
      positionBuffer,
      normalBuffer,
      uvBuffer,
      vertexCount: 4,
    };
  }

  private buildModelMatrix(transform: Transform): Float32Array {
    const mat = new Float32Array(16);
    mat[0] = mat[5] = mat[10] = mat[15] = 1;

    const pos = transform.position;
    const rot = transform.rotation[2];
    const scl = transform.scale;

    // Translation
    const tx = new Float32Array(16);
    tx[0] = tx[5] = tx[10] = tx[15] = 1;
    tx[12] = pos[0];
    tx[13] = pos[1];
    tx[14] = pos[2];

    // Rotation (Z axis)
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const rx = new Float32Array(16);
    rx[0] = c;
    rx[1] = s;
    rx[4] = -s;
    rx[5] = c;
    rx[10] = 1;
    rx[15] = 1;

    // Scale
    const sx = new Float32Array(16);
    sx[0] = scl[0];
    sx[5] = scl[1];
    sx[10] = scl[2];
    sx[15] = 1;

    // Multiply: translation * rotation * scale
    const temp = this.mulMat4(tx, rx);
    return this.mulMat4(temp, sx);
  }

  private mulMat4(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] =
          a[i * 4] * b[j] +
          a[i * 4 + 1] * b[4 + j] +
          a[i * 4 + 2] * b[8 + j] +
          a[i * 4 + 3] * b[12 + j];
      }
    }
    return result;
  }

  private identityMatrix(): Float32Array {
    const mat = new Float32Array(16);
    mat[0] = mat[5] = mat[10] = mat[15] = 1;
    return mat;
  }
}
