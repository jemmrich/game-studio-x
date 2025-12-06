export class LightingState {
  ambientColor: [number, number, number] = [0.2, 0.2, 0.2];
  ambientIntensity: number = 1.0;
  directionalLightDir: [number, number, number] = [0, -1, 0];
  directionalLightColor: [number, number, number] = [1, 1, 1];
  directionalLightIntensity: number = 1.0;

  constructor(
    ambientColor: [number, number, number] = [0.2, 0.2, 0.2],
    ambientIntensity: number = 1.0,
    directionalLightDir: [number, number, number] = [0, -1, 0],
    directionalLightColor: [number, number, number] = [1, 1, 1],
    directionalLightIntensity: number = 1.0
  ) {
    this.ambientColor = ambientColor;
    this.ambientIntensity = ambientIntensity;
    this.directionalLightDir = directionalLightDir;
    this.directionalLightColor = directionalLightColor;
    this.directionalLightIntensity = directionalLightIntensity;
  }
}
