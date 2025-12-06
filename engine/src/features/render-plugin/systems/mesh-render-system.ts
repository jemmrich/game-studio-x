import type { World } from "../../../core/world.ts";
import type { WebGL2RenderingContext, WebGLProgram, WebGLUniformLocation, WebGLBuffer, WebGLVertexArrayObject } from "../types.ts";
import { RenderContext } from "../resources/render-context.ts";
import { GeometryBufferCache } from "../resources/geometry-buffer-cache.ts";
import { ShaderLibrary } from "../resources/shader-library.ts";
import { LightingState } from "../resources/lighting-state.ts";
import { Material, BasicMaterial, PhongMaterial } from "../components/material.ts";
import { Visible } from "../components/visible.ts";
import { BoxGeometry } from "../components/box-geometry.ts";
import { SphereGeometry } from "../components/sphere-geometry.ts";
import { CylinderGeometry } from "../components/cylinder-geometry.ts";
import { PlaneGeometry } from "../components/plane-geometry.ts";
import { ConeGeometry } from "../components/cone-geometry.ts";
import { Transform } from "../../transform-plugin/components/transform.ts";
import * as math from "../../../utils/math.ts";

/**
 * Main render system that draws all visible entities with geometry
 * Runs every frame as the final render pass
 */
export class MeshRenderSystem {
  enabled: boolean = true;
  private shaderLocations: Map<
    WebGLProgram,
    {
      attributes: { [key: string]: number };
      uniforms: { [key: string]: WebGLUniformLocation | null };
    }
  > = new Map();

  private getShaderLocations(
    gl: WebGL2RenderingContext,
    program: WebGLProgram
  ): {
    attributes: { [key: string]: number };
    uniforms: { [key: string]: WebGLUniformLocation | null };
  } {
    // Return cached locations if available
    if (this.shaderLocations.has(program)) {
      return this.shaderLocations.get(program)!;
    }

    // Otherwise, cache new locations for this program
    const locations = {
      attributes: {
        aPosition: gl.getAttribLocation(program, "aPosition"),
        aNormal: gl.getAttribLocation(program, "aNormal"),
        aUV: gl.getAttribLocation(program, "aUV"),
      },
      uniforms: {
        uView: gl.getUniformLocation(program, "uView"),
        uProjection: gl.getUniformLocation(program, "uProjection"),
        uModel: gl.getUniformLocation(program, "uModel"),
        uNormalMatrix: gl.getUniformLocation(program, "uNormalMatrix"),
        uAmbientColor: gl.getUniformLocation(program, "uAmbientColor"),
        uAmbientIntensity: gl.getUniformLocation(program, "uAmbientIntensity"),
        uDirectionalLightDir: gl.getUniformLocation(program, "uDirectionalLightDir"),
        uDirectionalLightColor: gl.getUniformLocation(program, "uDirectionalLightColor"),
        uDirectionalLightIntensity: gl.getUniformLocation(
          program,
          "uDirectionalLightIntensity"
        ),
        uBaseColor: gl.getUniformLocation(program, "uBaseColor"),
        uMetallic: gl.getUniformLocation(program, "uMetallic"),
        uRoughness: gl.getUniformLocation(program, "uRoughness"),
        uOpacity: gl.getUniformLocation(program, "uOpacity"),
        uWireframe: gl.getUniformLocation(program, "uWireframe"),
        // Phong material uniforms
        uSpecularColor: gl.getUniformLocation(program, "uSpecularColor"),
        uShininess: gl.getUniformLocation(program, "uShininess"),
      },
    };

    this.shaderLocations.set(program, locations);
    return locations;
  }

  update(world: World, _dt: number): void {
    const renderContext = world.getResource<RenderContext>("RenderContext");
    const bufferCache = world.getResource<GeometryBufferCache>("GeometryBufferCache");
    const shaderLibrary = world.getResource<ShaderLibrary>("ShaderLibrary");
    const lightingState = world.getResource<LightingState>("LightingState");

    if (!renderContext.gl) return;

    const gl = renderContext.gl as any;

    // Clear framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Store reference to shader library and lighting state for per-entity rendering
    this.renderAllGeometry(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext
    );
  }

  private renderAllGeometry(
    world: World,
    gl: WebGL2RenderingContext,
    bufferCache: GeometryBufferCache,
    shaderLibrary: any,
    lightingState: any,
    renderContext: any
  ): void {
    // Query and render all entities with geometry and visibility
    this.renderGeometryType(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext,
      BoxGeometry,
      (geo: BoxGeometry) => `box_${geo.width}_${geo.height}_${geo.depth}`
    );

    this.renderGeometryType(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext,
      SphereGeometry,
      (geo: SphereGeometry) => `sphere_${geo.radius}_${geo.segments}_${geo.rings}`
    );

    this.renderGeometryType(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext,
      CylinderGeometry,
      (geo: CylinderGeometry) =>
        `cylinder_${geo.radiusTop}_${geo.radiusBottom}_${geo.height}_${geo.segments}`
    );

    this.renderGeometryType(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext,
      PlaneGeometry,
      (geo: PlaneGeometry) =>
        `plane_${geo.width}_${geo.height}_${geo.widthSegments}_${geo.heightSegments}`
    );

    this.renderGeometryType(
      world,
      gl,
      bufferCache,
      shaderLibrary,
      lightingState,
      renderContext,
      ConeGeometry,
      (geo: ConeGeometry) => `cone_${geo.radius}_${geo.height}_${geo.segments}`
    );
  }

  private renderGeometryType(
    world: World,
    gl: WebGL2RenderingContext,
    bufferCache: GeometryBufferCache,
    shaderLibrary: any,
    lightingState: any,
    renderContext: any,
    geometryClass: any,
    getCacheKey: (geo: any) => string
  ): void {
    // Get all entities with this geometry type, transform, and visibility
    const entities = world.query(geometryClass, Transform).entities();

    for (const entity of entities) {
      // Skip if not visible
      if (!world.has(entity, Visible)) continue;
      const visible = world.get<Visible>(entity, Visible);
      if (!visible || !visible.enabled) continue;

      const geometry = world.get(entity, geometryClass);
      const transform = world.get<Transform>(entity, Transform);

      if (!geometry || !transform) continue;

      // Get material (check for BasicMaterial or PhongMaterial)
      let material = world.get<BasicMaterial>(entity, BasicMaterial) || 
                     world.get<PhongMaterial>(entity, PhongMaterial);
      if (!material) {
        material = new BasicMaterial();
      }

      // Get shader program based on material's shaderId
      const program = shaderLibrary.get(material.shaderId);
      if (!program) {
        console.warn(`Shader "${material.shaderId}" not found, skipping entity`);
        continue;
      }

      // Activate shader program
      gl.useProgram(program);

      // Get shader locations for this program
      const locations = this.getShaderLocations(gl, program);

      // Set per-frame uniforms (view/projection matrices)
      gl.uniformMatrix4fv(locations.uniforms.uView, false, renderContext.viewMatrix);
      gl.uniformMatrix4fv(
        locations.uniforms.uProjection,
        false,
        renderContext.projectionMatrix
      );

      // Set lighting uniforms
      gl.uniform3f(
        locations.uniforms.uAmbientColor,
        lightingState.ambientColor[0],
        lightingState.ambientColor[1],
        lightingState.ambientColor[2]
      );
      gl.uniform1f(locations.uniforms.uAmbientIntensity, lightingState.ambientIntensity);
      gl.uniform3f(
        locations.uniforms.uDirectionalLightDir,
        lightingState.directionalLightDir[0],
        lightingState.directionalLightDir[1],
        lightingState.directionalLightDir[2]
      );
      gl.uniform3f(
        locations.uniforms.uDirectionalLightColor,
        lightingState.directionalLightColor[0],
        lightingState.directionalLightColor[1],
        lightingState.directionalLightColor[2]
      );
      gl.uniform1f(
        locations.uniforms.uDirectionalLightIntensity,
        lightingState.directionalLightIntensity
      );

      // Get cached buffers
      const cacheKey = getCacheKey(geometry);
      const bufferData = bufferCache.get(cacheKey);

      if (!bufferData) continue;

      // Set per-object uniforms
      const modelMatrix = math.modelMatrix(transform.position, transform.rotation, transform.scale);
      const normalMat = math.normalMatrix(modelMatrix);

      gl.uniformMatrix4fv(
        locations.uniforms.uModel,
        false,
        modelMatrix
      );
      gl.uniformMatrix3fv(locations.uniforms.uNormalMatrix, false, normalMat);

      // Set material uniforms based on material type
      if (material instanceof BasicMaterial) {
        if (locations.uniforms.uBaseColor) {
          gl.uniform4f(
            locations.uniforms.uBaseColor,
            material.color[0],
            material.color[1],
            material.color[2],
            material.color[3]
          );
        }
        if (locations.uniforms.uMetallic) {
          gl.uniform1f(locations.uniforms.uMetallic, material.metallic);
        }
        if (locations.uniforms.uRoughness) {
          gl.uniform1f(locations.uniforms.uRoughness, material.roughness);
        }
        if (locations.uniforms.uOpacity) {
          gl.uniform1f(locations.uniforms.uOpacity, material.opacity);
        }
      } else if (material instanceof PhongMaterial) {
        if (locations.uniforms.uBaseColor) {
          gl.uniform4f(
            locations.uniforms.uBaseColor,
            material.color[0],
            material.color[1],
            material.color[2],
            material.color[3]
          );
        }
        if (locations.uniforms.uSpecularColor) {
          gl.uniform3f(
            locations.uniforms.uSpecularColor,
            material.specularColor[0],
            material.specularColor[1],
            material.specularColor[2]
          );
        }
        if (locations.uniforms.uShininess) {
          gl.uniform1f(locations.uniforms.uShininess, material.shininess);
        }
        if (locations.uniforms.uOpacity) {
          gl.uniform1f(locations.uniforms.uOpacity, material.opacity);
        }
      }

      if (locations.uniforms.uWireframe) {
        gl.uniform1i(locations.uniforms.uWireframe, material.wireframe ? 1 : 0);
      }

      // Bind VAO and draw
      gl.bindVertexArray(bufferData.vao);
      gl.drawElements(gl.TRIANGLES, bufferData.indexCount, gl.UNSIGNED_INT, 0);
    }
  }
}
