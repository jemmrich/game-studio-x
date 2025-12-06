/**
 * Base material class for all material types.
 * Materials define how surfaces respond to light and what shader they use.
 */
export class Material {
  /** The color of the material (RGBA) */
  color: [number, number, number, number] = [1, 1, 1, 1];
  
  /** Metallic value (0-1) */
  metallic: number = 0.0;
  
  /** Roughness value (0-1) */
  roughness: number = 0.5;
  
  /** Opacity value (0-1) */
  opacity: number = 1.0;
  
  /** The shader program to use for this material */
  shaderId: string;
  
  /** Optional texture resource ID */
  textureId?: string;
  
  /** Whether to render in wireframe mode */
  wireframe: boolean = false;

  constructor(
    color: [number, number, number, number] = [1, 1, 1, 1],
    metallic: number = 0.0,
    roughness: number = 0.5,
    opacity: number = 1.0,
    wireframe: boolean = false,
    shaderId: string = "basic"
  ) {
    this.color = color;
    this.metallic = metallic;
    this.roughness = roughness;
    this.opacity = opacity;
    this.wireframe = wireframe;
    this.shaderId = shaderId;
  }
}

/**
 * Basic material with simple diffuse lighting.
 * No specular highlights - suitable for simple objects and diffuse surfaces.
 */
export class BasicMaterial extends Material {
  constructor(
    color: [number, number, number, number] = [1, 1, 1, 1],
    metallic: number = 0.0,
    roughness: number = 0.5,
    opacity: number = 1.0,
    wireframe: boolean = false
  ) {
    super(color, metallic, roughness, opacity, wireframe, "basic");
  }
}

/**
 * Phong material with specular highlights.
 * Includes ambient, diffuse, and specular components for realistic lighting.
 */
export class PhongMaterial extends Material {
  specularColor: [number, number, number] = [1, 1, 1]; // RGB
  shininess: number = 32.0; // Higher = sharper highlights

  constructor(
    color: [number, number, number, number] = [1, 1, 1, 1],
    specularColor: [number, number, number] = [1, 1, 1],
    shininess: number = 32.0,
    opacity: number = 1.0,
    wireframe: boolean = false
  ) {
    super(color, 0.0, 0.5, opacity, wireframe, "phong");
    this.specularColor = specularColor;
    this.shininess = shininess;
  }
}
