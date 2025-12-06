export class Material {
  color: [number, number, number, number] = [1, 1, 1, 1]; // RGBA
  metallic: number = 0.0;
  roughness: number = 0.5;
  opacity: number = 1.0;
  textureId?: string; // Reference to texture resource
  wireframe: boolean = false;
  shaderId: string = "basic"

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
