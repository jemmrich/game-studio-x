import type { World } from "../../../core/world.ts";
import type { WebGL2RenderingContext } from "../types.ts";
import { RenderContext } from "../resources/render-context.ts";
import { ShaderLibrary } from "../resources/shader-library.ts";
import { createShaderProgram } from "../utils/shader.ts";
import { BASIC_FRAGMENT_SHADER, BASIC_VERTEX_SHADER, RAINBOW_FRAGMENT_SHADER, RAINBOW_VERTEX_SHADER } from "./shaders.ts";

export interface RenderInitConfig {
  antialias?: boolean;
  shadowsEnabled?: boolean;
  clearColor?: [number, number, number, number];
}

/**
 * System that initializes WebGL rendering context and compiles shader programs
 * Runs once at startup
 */
export class RenderInitializationSystem {
  enabled: boolean = true;
  hasInitialized: boolean = false;

  constructor(private config: RenderInitConfig = {}) {}

  update(world: World, _dt: number): void {
    if (this.hasInitialized) return;

    const renderContext = world.getResource<RenderContext>("RenderContext");
    const shaderLibrary = world.getResource<ShaderLibrary>("ShaderLibrary");

    // Set up canvas resolution to match display size with device pixel ratio
    const dpr = (globalThis as any).devicePixelRatio || 1;
    const displayWidth = renderContext.canvas.clientWidth;
    const displayHeight = renderContext.canvas.clientHeight;
    
    renderContext.canvas.width = displayWidth * dpr;
    renderContext.canvas.height = displayHeight * dpr;

    // Initialize WebGL context
    const gl = (renderContext.canvas.getContext("webgl2", {
      antialias: this.config.antialias ?? true,
      preserveDrawingBuffer: false,
    })) as WebGL2RenderingContext | null;

    if (!gl) {
      console.error("Failed to initialize WebGL2 context");
      return;
    }

    renderContext.gl = gl;

    // Compile basic shader program
    const basicProgram = createShaderProgram(
      gl,
      BASIC_VERTEX_SHADER,
      BASIC_FRAGMENT_SHADER,
    );

    if (!basicProgram) {
      console.error("Failed to create basic shader program");
      return;
    }

    // Compile rainbow shader program
    const rainbowProgram = createShaderProgram(
        gl,
        RAINBOW_VERTEX_SHADER,
        RAINBOW_FRAGMENT_SHADER,
    );

    if (!rainbowProgram) {
      console.error("Failed to create rainbow shader program");
      return;
    }
    
    shaderLibrary.add("basic", basicProgram);
    shaderLibrary.add("rainbow", rainbowProgram);

    // Set up WebGL state
    gl?.clearColor(
      this.config.clearColor?.[0] ?? 0.0,
      this.config.clearColor?.[1] ?? 0.0,
      this.config.clearColor?.[2] ?? 0.0,
      this.config.clearColor?.[3] ?? 1.0,
    );

    gl?.enable(gl.DEPTH_TEST);
    gl?.depthFunc(gl.LEQUAL);

    gl?.enable(gl.CULL_FACE);
    gl?.cullFace(gl.BACK);

    gl?.enable(gl.BLEND);
    gl?.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set viewport to match the canvas drawing buffer size
    gl?.viewport(0, 0, renderContext.canvas.width, renderContext.canvas.height);

    // Handle window resize
    const resizeHandler = () => {
      const newDisplayWidth = renderContext.canvas.clientWidth;
      const newDisplayHeight = renderContext.canvas.clientHeight;
      
      if (renderContext.canvas.width !== newDisplayWidth * dpr || 
          renderContext.canvas.height !== newDisplayHeight * dpr) {
        renderContext.canvas.width = newDisplayWidth * dpr;
        renderContext.canvas.height = newDisplayHeight * dpr;
        gl?.viewport(0, 0, renderContext.canvas.width, renderContext.canvas.height);
      }
    };

    (globalThis as any).addEventListener?.("resize", resizeHandler);

    this.hasInitialized = true;
    console.log("RenderInitializationSystem initialized successfully");
  }
}
