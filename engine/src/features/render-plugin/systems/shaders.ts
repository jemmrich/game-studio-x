/**
 * Shader source code embedded as strings
 */

export const BASIC_VERTEX_SHADER = `#version 300 es
precision highp float;

// Vertex attributes (from geometry buffers)
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUV;

// Per-frame uniforms (camera transforms)
uniform mat4 uView;
uniform mat4 uProjection;

// Per-object uniforms
uniform mat4 uModel;
uniform mat3 uNormalMatrix;

// Output to fragment shader (interpolated)
out vec3 vPosition;      // World-space position
out vec3 vNormal;        // World-space normal
out vec2 vUV;           // Texture coordinates

void main() {
  // Transform vertex position to world space
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vPosition = worldPos.xyz;
  
  // Transform normal to world space (accounting for non-uniform scaling)
  vNormal = normalize(uNormalMatrix * aNormal);
  
  // Pass through UV coordinates
  vUV = aUV;
  
  // Transform to clip space for rasterization
  gl_Position = uProjection * uView * worldPos;
}
`;

export const BASIC_FRAGMENT_SHADER = `#version 300 es
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
`;

export const RAINBOW_VERTEX_SHADER = `#version 300 es
precision highp float;

// Vertex attributes (from geometry buffers)
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUV;

// Per-frame uniforms (camera transforms)
uniform mat4 uView;
uniform mat4 uProjection;

// Per-object uniforms
uniform mat4 uModel;
uniform mat3 uNormalMatrix;

// Output to fragment shader (interpolated)
out vec3 vPosition;      // World-space position
out vec3 vNormal;        // World-space normal
out vec2 vUV;           // Texture coordinates
out vec3 vColor;        // Vertex color (will interpolate across triangle)

void main() {
  // Transform vertex position to world space
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vPosition = worldPos.xyz;
  
  // Transform normal to world space (accounting for non-uniform scaling)
  vNormal = normalize(uNormalMatrix * aNormal);
  
  // Pass through UV coordinates
  vUV = aUV;
  
  // Assign colors based on vertex position in local space
  // This creates a rainbow effect by mapping position components to RGB
  // Remap from [-0.5, 0.5] to [0, 1] then blend with position
  vec3 localPos = aPosition;
  vColor = vec3(
    max(0.0, localPos.x + 0.5),  // R: X position mapped to 0-1
    max(0.0, localPos.y + 0.5),  // G: Y position mapped to 0-1
    max(0.0, localPos.z + 0.5)   // B: Z position mapped to 0-1
  );
  
  // Transform to clip space for rasterization
  gl_Position = uProjection * uView * worldPos;
}
`;

export const RAINBOW_FRAGMENT_SHADER = `#version 300 es
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
`;

// Export shader loader for future file-based shaders
export { loadShaderFile };
