import type {
  WebGL2RenderingContext,
  WebGLShader,
  WebGLProgram,
  WebGLUniformLocation,
} from "../types.ts";

/**
 * Shader utilities for compiling and linking GLSL programs
 */

/**
 * Compile a single shader
 */
export function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Link a complete shader program
 */
export function linkProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * Create a complete shader program from vertex and fragment source
 */
export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
  if (!vertexShader) return null;

  const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  const program = linkProgram(gl, vertexShader, fragmentShader);

  // Clean up individual shaders after linking
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Get all attribute and uniform locations for a shader program
 */
export interface ShaderLocations {
  attributes: { [key: string]: number };
  uniforms: { [key: string]: WebGLUniformLocation | null };
}

export function getShaderLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  attributeNames: string[],
  uniformNames: string[]
): ShaderLocations {
  const attributes: { [key: string]: number } = {};
  const uniforms: { [key: string]: WebGLUniformLocation | null } = {};

  for (const name of attributeNames) {
    attributes[name] = gl.getAttribLocation(program, name);
  }

  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { attributes, uniforms };
}
