#version 300 es
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
