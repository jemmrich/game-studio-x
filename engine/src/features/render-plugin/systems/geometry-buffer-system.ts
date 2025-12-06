import type { World } from "../../../core/world.ts";
import type { WebGL2RenderingContext, WebGLVertexArrayObject, WebGLBuffer } from "../types.ts";
import { RenderContext } from "../resources/render-context.ts";
import { type BufferData, GeometryBufferCache } from "../resources/geometry-buffer-cache.ts";
import { BoxGeometry } from "../components/box-geometry.ts";
import { SphereGeometry } from "../components/sphere-geometry.ts";
import { CylinderGeometry } from "../components/cylinder-geometry.ts";
import { PlaneGeometry } from "../components/plane-geometry.ts";
import { ConeGeometry } from "../components/cone-geometry.ts";
import {
  generateBoxMesh,
  generateConeMesh,
  generateCylinderMesh,
  generatePlaneMesh,
  generateSphereMesh,
  type MeshData,
} from "../utils/mesh-generators.ts";
import { WebGL2RenderingContext } from "../types.ts";

/**
 * System that generates and caches GPU buffers for geometry components
 * Runs every frame to generate buffers for new geometries
 */
export class GeometryBufferSystem {
  enabled: boolean = true;

  update(world: World, _dt: number): void {
    const renderContext = world.getResource<RenderContext>("RenderContext");
    const bufferCache = world.getResource<GeometryBufferCache>("GeometryBufferCache");

    if (!renderContext.gl) return;

    const gl = renderContext.gl;

    // Query entities with any geometry component
    const boxEntities = world.query(BoxGeometry).entities();
    const sphereEntities = world.query(SphereGeometry).entities();
    const cylinderEntities = world.query(CylinderGeometry).entities();
    const planeEntities = world.query(PlaneGeometry).entities();
    const coneEntities = world.query(ConeGeometry).entities();

    // Process box geometries
    for (const entity of boxEntities) {
      const geometry = world.get<BoxGeometry>(entity, BoxGeometry);
      if (!geometry) continue;

      const cacheKey = `box_${geometry.width}_${geometry.height}_${geometry.depth}`;
      if (!bufferCache.has(cacheKey)) {
        const meshData = generateBoxMesh(geometry.width, geometry.height, geometry.depth);
        this.createBuffers(gl, bufferCache, cacheKey, meshData);
      }
    }

    // Process sphere geometries
    for (const entity of sphereEntities) {
      const geometry = world.get<SphereGeometry>(entity, SphereGeometry);
      if (!geometry) continue;

      const cacheKey = `sphere_${geometry.radius}_${geometry.segments}_${geometry.rings}`;
      if (!bufferCache.has(cacheKey)) {
        const meshData = generateSphereMesh(geometry.radius, geometry.segments, geometry.rings);
        this.createBuffers(gl, bufferCache, cacheKey, meshData);
      }
    }

    // Process cylinder geometries
    for (const entity of cylinderEntities) {
      const geometry = world.get<CylinderGeometry>(entity, CylinderGeometry);
      if (!geometry) continue;

      const cacheKey =
        `cylinder_${geometry.radiusTop}_${geometry.radiusBottom}_${geometry.height}_${geometry.segments}`;
      if (!bufferCache.has(cacheKey)) {
        const meshData = generateCylinderMesh(
          geometry.radiusTop,
          geometry.radiusBottom,
          geometry.height,
          geometry.segments,
        );
        this.createBuffers(gl, bufferCache, cacheKey, meshData);
      }
    }

    // Process plane geometries
    for (const entity of planeEntities) {
      const geometry = world.get<PlaneGeometry>(entity, PlaneGeometry);
      if (!geometry) continue;

      const cacheKey =
        `plane_${geometry.width}_${geometry.height}_${geometry.widthSegments}_${geometry.heightSegments}`;
      if (!bufferCache.has(cacheKey)) {
        const meshData = generatePlaneMesh(
          geometry.width,
          geometry.height,
          geometry.widthSegments,
          geometry.heightSegments,
        );
        this.createBuffers(gl, bufferCache, cacheKey, meshData);
      }
    }

    // Process cone geometries
    for (const entity of coneEntities) {
      const geometry = world.get<ConeGeometry>(entity, ConeGeometry);
      if (!geometry) continue;

      const cacheKey = `cone_${geometry.radius}_${geometry.height}_${geometry.segments}`;
      if (!bufferCache.has(cacheKey)) {
        const meshData = generateConeMesh(geometry.radius, geometry.height, geometry.segments);
        this.createBuffers(gl, bufferCache, cacheKey, meshData);
      }
    }
  }

  private createBuffers(
    gl: WebGL2RenderingContext,
    cache: GeometryBufferCache,
    cacheKey: string,
    meshData: MeshData,
  ): void {
    // Create VAO
    const vao = gl.createVertexArray();
    if (!vao) return;
    gl.bindVertexArray(vao);

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

    // Create and bind normal buffer
    const normalBuffer = gl.createBuffer();
    if (!normalBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 12, 0);

    // Create and bind UV buffer
    const uvBuffer = gl.createBuffer();
    if (!uvBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8, 0);

    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) return;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(meshData.indices), gl.STATIC_DRAW);

    // Unbind
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Store in cache
    const bufferData: BufferData = {
      vertexBuffer: positionBuffer,
      normalBuffer: normalBuffer,
      uvBuffer: uvBuffer,
      indexBuffer: indexBuffer,
      vao: vao,
      indexCount: meshData.indices.length,
    };

    cache.set(cacheKey, bufferData);
  }
}
