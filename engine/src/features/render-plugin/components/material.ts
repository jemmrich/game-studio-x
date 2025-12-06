/**
 * Abstract base class for all material types.
 * Materials define how surfaces respond to light and what shader they use.
 */
export abstract class Material {
  /** The shader program to use for this material */
  shaderId: string;
  
  /** Optional texture resource ID */
  textureId?: string;
  
  /** Whether to render in wireframe mode */
  wireframe: boolean = false;

  constructor(shaderId: string) {
    this.shaderId = shaderId;
  }
}

/**
 * Basic material with simple diffuse lighting.
 * No specular highlights - suitable for simple objects and diffuse surfaces.
 */
export class BasicMaterial extends Material {
  color: [number, number, number, number] = [1, 1, 1, 1]; // RGBA
  metallic: number = 0.0;
  roughness: number = 0.5;
  opacity: number = 1.0;

  constructor(
    color: [number, number, number, number] = [1, 1, 1, 1],
    metallic: number = 0.0,
    roughness: number = 0.5,
    opacity: number = 1.0,
    wireframe: boolean = false
  ) {
    super("basic");
    this.color = color;
    this.metallic = metallic;
    this.roughness = roughness;
    this.opacity = opacity;
    this.wireframe = wireframe;
  }
}

/**
 * Phong material with specular highlights.
 * Includes ambient, diffuse, and specular components for realistic lighting.
 */
export class PhongMaterial extends Material {
  color: [number, number, number, number] = [1, 1, 1, 1]; // RGBA - diffuse color
  specularColor: [number, number, number] = [1, 1, 1]; // RGB
  shininess: number = 32.0; // Higher = sharper highlights
  opacity: number = 1.0;

  constructor(
    color: [number, number, number, number] = [1, 1, 1, 1],
    specularColor: [number, number, number] = [1, 1, 1],
    shininess: number = 32.0,
    opacity: number = 1.0,
    wireframe: boolean = false
  ) {
    super("basic"); // Using basic shader for now until phong shader is implemented
    this.color = color;
    this.specularColor = specularColor;
    this.shininess = shininess;
    this.opacity = opacity;
    this.wireframe = wireframe;
  }
}
