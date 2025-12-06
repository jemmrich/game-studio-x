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
out vec3 vColor;        // Vertex color (will interpolate across triangle)

void main() {
  // Transform vertex position to world space
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vPosition = worldPos.xyz;
  
  // Transform normal to world space (accounting for non-uniform scaling)
  vNormal = normalize(uNormalMatrix * aNormal);
  
  // Pass through UV coordinates
  vUV = aUV;
  
  // Assign RGB colors based on vertex position in local space
  // This creates the classic rainbow effect where corners are R, G, B
  // Normalize position and use components as color channels
  vec3 normalizedPos = normalize(aPosition);
  vColor = abs(normalizedPos);  // Use absolute values to ensure positive colors
  
  // Alternative approach: assign fixed colors to specific vertices
  // Uncomment to use fixed assignment instead:
  // vColor = vec3(1.0, 0.0, 0.0);  // Will differ per vertex in actual mesh
  
  // Transform to clip space for rasterization
  gl_Position = uProjection * uView * worldPos;
}
