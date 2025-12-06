#version 300 es
precision highp float;

// Interpolated from vertex shader
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

// Lighting uniforms (global scene lighting)
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uDirectionalLightDir;    // Direction TO the light
uniform vec3 uDirectionalLightColor;
uniform float uDirectionalLightIntensity;

// Material uniforms
uniform vec4 uBaseColor;              // RGBA
uniform float uMetallic;
uniform float uRoughness;
uniform float uOpacity;
uniform int uWireframe;              // 0 = off, 1 = on

out vec4 outColor;

void main() {
  // Normalize interpolated normal
  vec3 normal = normalize(vNormal);
  
  // Ambient lighting component
  vec3 ambient = uAmbientColor * uAmbientIntensity;
  
  // Directional lighting component (simple Lambertian diffuse)
  // Light direction is normalized and points towards the light source
  float diffuseStrength = max(dot(normal, -uDirectionalLightDir), 0.0);
  vec3 diffuse = uDirectionalLightColor * diffuseStrength * uDirectionalLightIntensity;
  
  // Combine ambient and directional lighting
  vec3 lighting = ambient + diffuse;
  
  // Apply material color and lighting
  vec3 finalColor = uBaseColor.rgb * lighting;
  
  // Handle wireframe mode
  if (uWireframe == 1) {
    finalColor = vec3(1.0);  // White wireframe
  }
  
  // Output final color with opacity
  outColor = vec4(finalColor, uBaseColor.a * uOpacity);
}
