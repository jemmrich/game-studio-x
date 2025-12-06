# 3D Shapes Rendering Feature

Feature Name: 3D Shapes & Materials System
Filename: `2025-12-05-3d-shapes-rendering.md`
Date: 2025-12-05
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Enable developers to easily create and render basic 3D geometric shapes (boxes, spheres, cylinders, planes, etc.) with customizable materials in the game engine, following strict ECS architectural principles.

Goal / Expected Outcome:
- Developers can spawn entities with 3D shapes using simple component composition
- Materials can be configured per-entity with properties like color, texture, opacity
- Rendering system efficiently processes and renders all visible geometry
- Clean separation between geometry data, material properties, and rendering logic

### Background / Context:
Currently, the engine has an ECS foundation but lacks any 3D rendering capabilities. This feature will establish the core rendering pipeline that other visual features will build upon. This follows standard ECS patterns where geometry and materials are components, and rendering is handled by systems that query entities with the necessary component combinations.

## Feature Description

### Summary:
This feature introduces a `RenderPlugin` that provides:
- **Components** for geometry primitives (box, sphere, cylinder, plane) and materials
- **Resources** for managing WebGL/WebGPU rendering context, shader programs, and shared geometry buffers
- **Systems** that process renderable entities and submit draw calls to the GPU

The design follows ECS principles strictly: components hold data only, systems contain all logic, and resources manage global rendering state.

### Key Requirements:
- Support basic 3D primitive shapes: Box, Sphere, Cylinder, Plane, Cone
- Material component with properties: color, metallic, roughness, opacity, texture reference
- Transform component integration for positioning, rotation, and scaling shapes
- Camera component/resource for view and projection matrices
- Efficient rendering system that batches draw calls where possible
- Support for basic lighting (ambient + directional)
- Clean plugin architecture following the `feature-plugin.md` spec

### Non-Goals:
- Advanced materials (PBR shading, normal maps, etc.) - future enhancement
- Custom mesh loading from external files (e.g., .obj, .gltf) - separate feature
- Skeletal animation or morphing
- Post-processing effects
- Shadow mapping
- Advanced lighting models (point lights, spotlights)

## Technical Design

### Plugin Architecture

This will be implemented as a **RenderPlugin** - a core engine plugin (not game-specific) following the structure from `feature-plugin.md`.

**File Structure:**
```
engine/src/features/render-plugin/
  mod.ts                    # Public API and installer function
  components/
    box-geometry.ts
    sphere-geometry.ts
    cylinder-geometry.ts
    plane-geometry.ts
    cone-geometry.ts
    material.ts
    visible.ts
  resources/
    render-context.ts
    geometry-buffer-cache.ts
    shader-library.ts
    lighting-state.ts
  systems/
    render-initialization-system.ts
    geometry-buffer-system.ts
    camera-update-system.ts
    mesh-render-system.ts
  utils/
    mesh-generators.ts      # Geometry generation algorithms
  tests/
    geometry-buffer-system.test.ts
    mesh-render-system.test.ts
  README.md
```

The plugin bundles:
- **Components** for geometry primitives and materials
- **Resources** for WebGL/WebGPU context, shaders, and buffers
- **Systems** that process rendering logic
- **Installer function** `installRenderPlugin(world, config?)`

### Components

#### 1. Geometry Components (Shape Primitives)

```typescript
// engine/src/features/render-plugin/components/box-geometry.ts
export class BoxGeometry {
  width: number = 1;
  height: number = 1;
  depth: number = 1;
}

// engine/src/features/render-plugin/components/sphere-geometry.ts
export class SphereGeometry {
  radius: number = 1;
  segments: number = 32;
  rings: number = 16;
}

// engine/src/features/render-plugin/components/cylinder-geometry.ts
export class CylinderGeometry {
  radiusTop: number = 1;
  radiusBottom: number = 1;
  height: number = 2;
  segments: number = 32;
}

// engine/src/features/render-plugin/components/plane-geometry.ts
export class PlaneGeometry {
  width: number = 1;
  height: number = 1;
  widthSegments: number = 1;
  heightSegments: number = 1;
}

// engine/src/features/render-plugin/components/cone-geometry.ts
export class ConeGeometry {
  radius: number = 1;
  height: number = 2;
  segments: number = 32;
}
```

**Design Rationale**: Each geometry type is its own component class. This allows:
- Entities to have exactly one geometry type
- Systems to query for specific geometry types if needed
- Clean data structure - each component only holds parameters relevant to that shape
- Easy extension with new geometry types in the future

#### 2. Material Component

```typescript
// engine/src/features/render-plugin/components/material.ts
export class Material {
  color: [number, number, number, number] = [1, 1, 1, 1]; // RGBA
  metallic: number = 0.0;
  roughness: number = 0.5;
  opacity: number = 1.0;
  textureId?: string; // Reference to texture resource
  wireframe: boolean = false;
}
```

**Design Rationale**: Material is separate from geometry to enable:
- Material reuse across different shapes
- Systems that only care about materials (e.g., texture loading system)
- Entities to optionally have materials (default material if missing)

#### 3. Transform Component (Dependency)

**Note:** The `Transform` component is provided by the `transform-plugin` (a core plugin). The RenderPlugin depends on this being installed first.

```typescript
// engine/src/features/transform-plugin/components/transform.ts
export class Transform {
  position: [number, number, number] = [0, 0, 0];
  rotation: [number, number, number] = [0, 0, 0]; // Euler angles or quaternion
  scale: [number, number, number] = [1, 1, 1];
}
```

#### 4. Visible Component (Rendering Marker)

```typescript
// engine/src/features/render-plugin/components/visible.ts
export class Visible {
  enabled: boolean = true;
}
```

**Design Rationale**: Entities with geometry/material but without `Visible` won't be rendered. This allows toggling visibility without removing components.

### Resources

#### 1. RenderContext Resource

```typescript
// engine/src/features/render-plugin/resources/render-context.ts
export class RenderContext {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null = null;
  currentShaderProgram: WebGLProgram | null = null;
  viewMatrix: Float32Array = new Float32Array(16);
  projectionMatrix: Float32Array = new Float32Array(16);
}
```

**Purpose**: Holds the global rendering context and state shared across all rendering operations.

#### 2. GeometryBufferCache Resource

```typescript
// engine/src/features/render-plugin/resources/geometry-buffer-cache.ts
export interface BufferData {
  vertexBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer;
  indexCount: number;
}

export class GeometryBufferCache {
  private cache: Map<string, BufferData> = new Map();
  
  // Methods to get/set cached geometry buffers
  // Data only - actual generation logic lives in systems
}
```

**Purpose**: Cache GPU buffers for geometry to avoid regenerating them every frame. Key format: `"box_1_1_1"`, `"sphere_1_32_16"`, etc.

#### 3. ShaderLibrary Resource

```typescript
// engine/src/features/render-plugin/resources/shader-library.ts
export class ShaderLibrary {
  programs: Map<string, WebGLProgram> = new Map();
  defaultProgramId: string = "basic";
}
```

**Purpose**: Store compiled shader programs accessible by ID.

#### 4. LightingState Resource

```typescript
// engine/src/features/render-plugin/resources/lighting-state.ts
export class LightingState {
  ambientColor: [number, number, number] = [0.2, 0.2, 0.2];
  ambientIntensity: number = 1.0;
  directionalLightDir: [number, number, number] = [0, -1, 0];
  directionalLightColor: [number, number, number] = [1, 1, 1];
  directionalLightIntensity: number = 1.0;
}
```

**Purpose**: Global lighting parameters used by shaders.

### Systems

#### 1. RenderInitializationSystem

**Purpose**: Run once at startup to initialize WebGL context, compile shaders, set up default state.

**Execution**: Startup phase

**Logic**:
- Get canvas from DOM
- Initialize WebGL2 context
- Compile and link shader programs
- Store in RenderContext and ShaderLibrary resources
- Set up default GL state (depth test, culling, etc.)

#### 2. GeometryBufferSystem

**Purpose**: Generate and cache GPU buffers for geometry components that don't have cached buffers yet.

**Execution**: Every frame (early in render pipeline)

**Query**: All entities with any geometry component (BoxGeometry, SphereGeometry, etc.) that don't have cached buffers

**Logic**:
- For each entity with geometry:
  - Generate cache key from geometry type and parameters
  - If not in GeometryBufferCache:
    - Generate vertex, index, normal, UV data
    - Create WebGL buffers and upload data
    - Store in cache
- This system populates the cache on-demand

#### 3. CameraUpdateSystem

**Purpose**: Update view and projection matrices based on camera entity.

**Execution**: Every frame (before rendering)

**Query**: Entities with Camera component and Transform component

**Logic**:
- Find active camera (can have priority/active flag)
- Calculate view matrix from camera's Transform
- Calculate projection matrix from camera's FOV, aspect ratio, near/far planes
- Update RenderContext resource with matrices

#### 4. MeshRenderSystem

**Purpose**: Render all visible entities with geometry and materials.

**Execution**: Every frame (main render pass)

**Query**: Entities with [any Geometry component, Material (optional), Transform, Visible]

**Logic**:
- Clear framebuffer
- Bind shader program
- Set global uniforms (view matrix, projection matrix, lighting)
- For each entity:
  - Get geometry buffer from cache
  - Bind vertex/index/normal buffers
  - Set per-object uniforms (model matrix from Transform, material properties)
  - Issue draw call
- Potentially batch entities with same geometry/material for efficiency

### Plugin Installer Function

```typescript
// engine/src/features/render-plugin/mod.ts
import type { World } from "../../core/world.ts";

// Export all components
export { BoxGeometry } from "./components/box-geometry.ts";
export { SphereGeometry } from "./components/sphere-geometry.ts";
export { CylinderGeometry } from "./components/cylinder-geometry.ts";
export { PlaneGeometry } from "./components/plane-geometry.ts";
export { ConeGeometry } from "./components/cone-geometry.ts";
export { Material } from "./components/material.ts";
export { Visible } from "./components/visible.ts";

// Export resources
export { RenderContext } from "./resources/render-context.ts";
export { GeometryBufferCache } from "./resources/geometry-buffer-cache.ts";
export { ShaderLibrary } from "./resources/shader-library.ts";
export { LightingState } from "./resources/lighting-state.ts";

// Export systems (if needed externally)
export { RenderInitializationSystem } from "./systems/render-initialization-system.ts";
export { GeometryBufferSystem } from "./systems/geometry-buffer-system.ts";
export { CameraUpdateSystem } from "./systems/camera-update-system.ts";
export { MeshRenderSystem } from "./systems/mesh-render-system.ts";

// Configuration interface
export interface RenderPluginConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  shadowsEnabled?: boolean;
  rendererType?: "webgl2" | "webgpu";
  clearColor?: [number, number, number, number];
}

// Main installer function
export function installRenderPlugin(
  world: World,
  config: RenderPluginConfig = {}
) {
  // Verify dependencies
  if (!world.hasResource("Transform")) {
    throw new Error(
      "RenderPlugin requires transform-plugin to be installed first. " +
      "Install it with: installTransformPlugin(world)"
    );
  }

  // Initialize resources
  const renderContext = new RenderContext();
  renderContext.canvas = config.canvas ?? document.querySelector("canvas")!;
  
  world.addResource("RenderContext", renderContext);
  world.addResource("GeometryBufferCache", new GeometryBufferCache());
  world.addResource("ShaderLibrary", new ShaderLibrary());
  world.addResource("LightingState", new LightingState());

  // Register systems in execution order
  world.addSystem(new RenderInitializationSystem(config));
  world.addSystem(new GeometryBufferSystem());
  world.addSystem(new CameraUpdateSystem());
  world.addSystem(new MeshRenderSystem());
}
```

**Key Points:**
- Follows the installer function pattern from `feature-plugin.md`
- Checks for required dependencies (transform-plugin)
- Uses consistent resource naming (matches class names)
- Registers systems in proper execution order
- Supports optional configuration
- Exports all public API through `mod.ts`

### Data Flow Example

Creating and rendering a red box:

```typescript
// Game code
import { World } from "@engine";
import { installTransformPlugin } from "@engine/features/transform-plugin";
import { installRenderPlugin } from "@engine/features/render-plugin";
import { Transform } from "@engine/features/transform-plugin";
import { BoxGeometry, Material, Visible } from "@engine/features/render-plugin";

const world = new World();

// Install dependencies first
installTransformPlugin(world);
installRenderPlugin(world, {
  canvas: document.querySelector('canvas')!,
  antialias: true
});

const box = world.createEntity();
world.add(box, new Transform());
world.add(box, new BoxGeometry()); // 1x1x1 default
world.add(box, new Material());
world.get(box, Material).color = [1, 0, 0, 1]; // Red
world.add(box, new Visible());

// Frame loop:
// 1. GeometryBufferSystem sees BoxGeometry, generates key "box_1_1_1"
//    Cache miss -> generates cube mesh data, creates GPU buffers, caches
// 2. CameraUpdateSystem updates view/projection matrices in RenderContext
// 3. MeshRenderSystem queries entities with geometry+visible
//    - Gets box entity
//    - Retrieves cached buffers for "box_1_1_1"
//    - Binds buffers, sets material uniforms (red color)
//    - Draws indexed geometry
```

### Shader Specification

The rendering pipeline uses a single "basic" shader program that handles all geometry types with different materials and lighting.

#### Vertex Shader

```glsl
// engine/src/features/render-plugin/shaders/basic.vert
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
```

#### Fragment Shader

```glsl
// engine/src/features/render-plugin/shaders/basic.frag
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
```

**Shader Features:**
- Per-fragment Lambertian diffuse lighting
- Ambient + directional light model (no specular highlights initially)
- Support for per-object material properties
- Wireframe mode support
- Proper normal transformation accounting for non-uniform scaling

**Future Enhancements:**
- Add Phong/Blinn-Phong specular highlights
- Support metallic and roughness properties for PBR
- Add texture sampling (requires texture resources)
- Implement normal mapping

### Vertex Attribute Layout

Geometry buffers are organized with the following vertex attribute layout:

```typescript
// Vertex format definition
interface Vertex {
  position: [number, number, number];    // 3 floats, 12 bytes
  normal: [number, number, number];      // 3 floats, 12 bytes
  uv: [number, number];                 // 2 floats, 8 bytes
}

// Total: 32 bytes per vertex
// Stride: 32 bytes
```

**Buffer Organization (GPU-side):**
```
Position buffer layout (interleaved):
[x, y, z, x, y, z, x, y, z, ...]

Normal buffer layout (interleaved):
[nx, ny, nz, nx, ny, nz, ...]

UV buffer layout (interleaved):
[u, v, u, v, ...]

Index buffer:
[0, 1, 2, 0, 2, 3, ...]  // Triangle indices
```

**Vertex Array Object (VAO) Setup:**
The geometry buffer system creates VAOs with these attribute bindings:

| Attribute | Location | Type | Size | Offset | Stride | Buffer |
|-----------|----------|------|------|--------|--------|--------|
| aPosition | 0 | vec3 | 3 | 0 | 32 | Vertex |
| aNormal | 1 | vec3 | 3 | 12 | 32 | Vertex |
| aUV | 2 | vec2 | 2 | 24 | 32 | Vertex |

### Uniform Specification

Uniforms are organized into groups that are set at different frequencies:

#### Per-Frame Uniforms (set once per frame)
```typescript
// Updated by CameraUpdateSystem
uView: mat4                // Camera view matrix
uProjection: mat4          // Camera projection matrix

// Updated by lighting system
uAmbientColor: vec3        // RGB ambient light color
uAmbientIntensity: float   // Ambient light intensity (0.0-1.0)
uDirectionalLightDir: vec3 // Direction TO light source (normalized)
uDirectionalLightColor: vec3 // RGB color of directional light
uDirectionalLightIntensity: float // Intensity multiplier (1.0 = full)
```

#### Per-Object Uniforms (set per entity before draw call)
```typescript
// Updated by MeshRenderSystem for each entity
uModel: mat4               // Entity transform (position, rotation, scale)
uNormalMatrix: mat3        // Inverse transpose of 3x3 model matrix
                           // Used for proper normal transformation

// From Material component
uBaseColor: vec4           // RGBA color (premultiplied by opacity)
uMetallic: float           // Metallic value (0.0 = non-metal, 1.0 = metal)
uRoughness: float          // Roughness value (0.0 = smooth, 1.0 = rough)
uOpacity: float            // Opacity multiplier (0.0-1.0)
uWireframe: int            // Wireframe mode flag
```

**Uniform Update Pattern:**
```typescript
// Pseudocode for uniform setting in MeshRenderSystem
for each entity with [Geometry, Material, Transform, Visible] {
  const material = world.get(entity, Material);
  const transform = world.get(entity, Transform);
  
  // Set per-object uniforms
  gl.uniformMatrix4fv(uModelLoc, false, calculateModelMatrix(transform));
  gl.uniformMatrix3fv(uNormalMatrixLoc, false, calculateNormalMatrix(transform));
  gl.uniform4f(uBaseColorLoc, material.color[0], material.color[1], 
               material.color[2], material.color[3]);
  gl.uniform1f(uMetallicLoc, material.metallic);
  gl.uniform1f(uRoughnessLoc, material.roughness);
  gl.uniform1f(uOpacityLoc, material.opacity);
  gl.uniform1i(uWireframeLoc, material.wireframe ? 1 : 0);
  
  // Draw entity
  drawEntity(entity);
}
```

### Component Composition Patterns

```typescript
// Minimal renderable entity
entity + Transform + BoxGeometry + Visible
// Uses default material

// Styled entity
entity + Transform + SphereGeometry + Material + Visible
// Custom material properties

// Hidden entity (still has geometry, just not rendered)
entity + Transform + BoxGeometry + Material
// No Visible component

// Multiple shapes (not supported - one geometry per entity)
// To create complex objects, use parent-child entity hierarchy
```

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed (WebGL2 widely supported)
- [x] Dependencies identified (Transform component, Canvas element)
- [ ] Review similar implementations in other ECS engines

### Phase 2 — Design
- [x] API / interface draft (components, resources, systems defined)
- [x] Data structures defined
- [x] Naming conventions approved (follows ECS specs)
- [x] Architecture reviewed (RenderPlugin pattern)
- [x] Shader code design (vertex/fragment shaders)
- [x] Buffer layout specification (vertex attributes)
- [x] Uniform specification (per-frame and per-object uniforms)

### Plugin Dependencies

**Required Plugins:**
- `transform-plugin` - Provides `Transform` component for positioning entities

**Optional Plugins:**
- `camera-plugin` - If using dedicated camera entities (otherwise uses default camera)
- `time-plugin` - For animation-related rendering features

**Installation Order:**
```typescript
// Correct order
installTransformPlugin(world);
installRenderPlugin(world, config);

// ❌ Wrong - will throw error
installRenderPlugin(world, config);
installTransformPlugin(world);
```

### System Execution Order

Systems within RenderPlugin execute in this order each frame:

1. **RenderInitializationSystem** - Runs once at startup only
2. **GeometryBufferSystem** - Generates/caches geometry buffers (early in pipeline)
3. **CameraUpdateSystem** - Updates view/projection matrices (before rendering)
4. **MeshRenderSystem** - Renders all visible entities (main render pass)

When combined with other plugins:
```typescript
// Typical plugin installation order for a game
installTimePlugin(world);           // 1. Time tracking
installInputPlugin(world);          // 2. Input collection
installTransformPlugin(world);      // 3. Transform system
installPhysicsPlugin(world);        // 4. Physics simulation
installAnimationPlugin(world);      // 5. Animation updates
installRenderPlugin(world, config); // 6. Rendering (last)
```

### Phase 3 — Implementation
- [x] Create plugin folder structure
- [x] Create component classes (BoxGeometry, SphereGeometry, etc.)
- [x] Create Material component
- [x] Create Transform component (if not exists)
- [x] Create Visible component
- [x] Implement RenderContext resource
- [x] Implement GeometryBufferCache resource
- [x] Implement ShaderLibrary resource
- [x] Implement LightingState resource
- [x] Write basic vertex/fragment shaders (GLSL)
- [x] Implement RenderInitializationSystem
- [x] Implement GeometryBufferSystem
  - Mesh generation algorithms for each primitive
- [x] Implement CameraUpdateSystem
- [x] Implement MeshRenderSystem
- [x] Implement installer function with dependency checks
- [x] Create mod.ts with proper exports
- [x] Bundle into RenderPlugin
- [x] Implement cleanup/disposal for WebGL resources
- [x] Edge cases handled (missing components, WebGL context loss)
- [x] Performance considerations (batching, frustum culling - future)
- [x] Write plugin README.md following documentation template

### Phase 4 — Testing
- [x] Unit tests for geometry generation algorithms
- [x] Unit tests for matrix calculations
- [x] Integration tests (create entity, verify rendering)
- [x] Visual tests (verify shapes look correct)
- [x] Performance profiling (draw calls, buffer uploads)
- [x] Test with multiple entities (100+)
- [x] Test material property changes at runtime

### Phase 5 — Documentation & Release
- [ ] User-facing documentation (how to create 3D shapes)
- [ ] API documentation for all components/resources
- [ ] Example game demonstrating feature
- [ ] Demo examples (rotating cube, material gallery)

### Risks & Concerns

**Technical Risks**:
- **WebGL browser compatibility**: Some older browsers may not support WebGL2
  - *Mitigation*: Fallback to WebGL1 or graceful degradation message
  
- **Performance with many entities**: Thousands of entities could cause FPS drops
  - *Mitigation*: Implement instancing for identical geometries, frustum culling (future phase)
  
- **Geometry generation complexity**: Spheres and cylinders require non-trivial mesh generation
  - *Mitigation*: Use established algorithms (UV sphere, procedural cylinder), reference external libraries

- **Buffer cache invalidation**: If geometry parameters change, cache needs updating
  - *Mitigation*: Implement cache key hashing, detect component changes

**Design Risks**:
- **One geometry per entity limitation**: Complex objects require entity hierarchies
  - *Mitigation*: Document pattern, consider future "Mesh" component for multi-geometry

- **Material system extensibility**: Current design may not support advanced features
  - *Mitigation*: Design Material component to be extensible, version carefully

**Scheduling Risks**:
- **Shader development time**: GLSL shaders can be time-consuming to debug
  - *Mitigation*: Start with simplest possible shaders, iterate

Mitigation Strategies:
- Incremental development: Start with single geometry type (box), expand
- Early visual testing: Get something rendering ASAP to validate approach
- Reference implementations: Study Three.js, Babylon.js geometry generation
- Performance budget: Target 60 FPS with 1000 entities minimum

## Future Enhancements

- **Instanced Rendering**: Draw many identical objects in one draw call
- **Frustum Culling**: Don't render objects outside camera view
- **Custom Mesh Component**: Load arbitrary geometry from files
- **Advanced Materials**: PBR shading, normal maps, emission
- **Texture Management**: Texture loading, filtering, mipmaps
- **Multiple Light Sources**: Point lights, spotlights, area lights
- **Shadow Mapping**: Real-time shadows
- **LOD System**: Level-of-detail for distant objects

## Example Usage

```typescript
// Create a scene with multiple shapes
import { World } from "@engine";
import { installTransformPlugin, Transform } from "@engine/features/transform-plugin";
import { 
  installRenderPlugin, 
  BoxGeometry, 
  SphereGeometry, 
  Material, 
  Visible 
} from "@engine/features/render-plugin";

const world = new World();

// Install required plugins
installTransformPlugin(world);
installRenderPlugin(world, {
  canvas: document.querySelector('canvas')!,
  antialias: true
});

// Red box
const box = world.createEntity();
world.add(box, new Transform());
world.get(box, Transform).position = [-2, 0, 0];
world.add(box, new BoxGeometry());
world.add(box, new Material());
world.get(box, Material).color = [1, 0, 0, 1];
world.add(box, new Visible());

// Blue sphere
const sphere = world.createEntity();
world.add(sphere, new Transform());
world.get(sphere, Transform).position = [2, 0, 0];
world.add(sphere, new SphereGeometry());
world.add(sphere, new Material());
world.get(sphere, Material).color = [0, 0, 1, 1];
world.add(sphere, new Visible());

// Game loop
function gameLoop(timestamp: number) {
  const dt = calculateDeltaTime(timestamp);
  world.updateSystems(dt);
  requestAnimationFrame(gameLoop);
}
gameLoop(0);
```

## Plugin Cleanup

The RenderPlugin manages WebGL resources that need proper cleanup:

```typescript
// Add dispose method to RenderContext resource
export class RenderContext {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null = null;
  // ...

  dispose() {
    // Clean up WebGL context
    const loseContext = this.gl?.getExtension('WEBGL_lose_context');
    loseContext?.loseContext();
    this.gl = null;
  }
}

// Add dispose method to GeometryBufferCache
export class GeometryBufferCache {
  private cache: Map<string, BufferData> = new Map();

  dispose(gl: WebGL2RenderingContext) {
    // Delete all GPU buffers
    for (const bufferData of this.cache.values()) {
      gl.deleteBuffer(bufferData.vertexBuffer);
      gl.deleteBuffer(bufferData.indexBuffer);
      gl.deleteBuffer(bufferData.normalBuffer);
      gl.deleteBuffer(bufferData.uvBuffer);
    }
    this.cache.clear();
  }
}

// Usage when shutting down the game
function shutdownGame(world: World) {
  const renderContext = world.getResource<RenderContext>("RenderContext");
  const bufferCache = world.getResource<GeometryBufferCache>("GeometryBufferCache");
  const shaderLibrary = world.getResource<ShaderLibrary>("ShaderLibrary");

  bufferCache.dispose(renderContext.gl!);
  shaderLibrary.dispose(renderContext.gl!);
  renderContext.dispose();
}
```

## References

- ECS Component Spec: `docs/specs/ecs-components.md`
- ECS System Spec: `docs/specs/ecs-systems.md`
- ECS Resource Spec: `docs/specs/ecs-resources.md`
- Feature Plugin Spec: `docs/specs/feature-plugin.md`
- WebGL2 Specification: https://www.khronos.org/webgl/
- Three.js Geometry Reference: https://threejs.org/docs/#api/en/geometries/BoxGeometry
