#version 300 es
precision highp float;

// Interpolated from vertex shader
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
in vec3 vColor;  // Interpolated vertex color

// Lighting uniforms (global scene lighting)
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uDirectionalLightDir;    // Direction TO the light
uniform vec3 uDirectionalLightColor;
uniform float uDirectionalLightIntensity;

out vec4 outColor;

void main() {
  // Normalize interpolated normal
  vec3 normal = normalize(vNormal);
  
  // Ambient lighting component
  vec3 ambient = uAmbientColor * uAmbientIntensity;
  
  // Directional lighting component (simple Lambertian diffuse)
  float diffuseStrength = max(dot(normal, -uDirectionalLightDir), 0.0);
  vec3 diffuse = uDirectionalLightColor * diffuseStrength * uDirectionalLightIntensity;
  
  // Combine ambient and directional lighting
  vec3 lighting = ambient + diffuse;
  
  // Apply interpolated vertex color with lighting
  vec3 finalColor = vColor * lighting;
  
  // Output final color
  outColor = vec4(finalColor, 1.0);
}
