# RenderPlugin

A WebGL2-based 3D rendering plugin for the Game Studio X engine, providing easy creation and rendering of geometric primitives with customizable materials.

## Overview

The RenderPlugin enables developers to create and render 3D shapes (boxes, spheres, cylinders, planes, cones) with customizable materials following strict ECS architectural principles.

### Features

- **Geometry Primitives**: Box, Sphere, Cylinder, Plane, Cone
- **Material System**: Color, metallic, roughness, opacity, and wireframe properties
- **WebGL2 Rendering**: Efficient GPU-accelerated rendering
- **Automatic Buffer Caching**: GPU buffers are generated once and reused
- **Lighting System**: Ambient + directional lighting
- **Transform Integration**: Full support for position, rotation, and scaling

## Installation

### Prerequisites

- Engine with ECS world system
- Transform plugin (required dependency)

### Basic Setup

```typescript
import { World } from "@engine";
import { installTransformPlugin } from "@engine/features/transform-plugin";
import { installRenderPlugin } from "@engine/features/render-plugin";

const world = new World();

// Install transform plugin first (dependency)
installTransformPlugin(world);

// Install render plugin with canvas
installRenderPlugin(world, {
  canvas: document.querySelector("canvas")!,
  antialias: true,
  clearColor: [0.1, 0.1, 0.1, 1.0]
});

// Start game loop
function gameLoop(timestamp: number) {
  world.updateSystems(1 / 60); // Assume 60 FPS
  requestAnimationFrame(gameLoop);
}

gameLoop(0);
```

## Usage

### Creating a Simple Shape

```typescript
import {
  BoxGeometry,
  Material,
  Visible,
} from "@engine/features/render-plugin";
import { Transform } from "@engine/features/transform-plugin";

// Create a red box
const box = world.createEntity();
world.add(box, new Transform([0, 0, 0], [0, 0, 0], [1, 1, 1]));
world.add(box, new BoxGeometry(1, 1, 1));
world.add(box, new Material([1, 0, 0, 1])); // Red RGBA
world.add(box, new Visible());
```

### Available Geometries

#### BoxGeometry

```typescript
const box = new BoxGeometry(width, height, depth);
// Default: (1, 1, 1)
```

#### SphereGeometry

```typescript
const sphere = new SphereGeometry(radius, segments, rings);
// Default: (1, 32, 16)
// Higher segments/rings = smoother but more vertices
```

#### CylinderGeometry

```typescript
const cylinder = new CylinderGeometry(radiusTop, radiusBottom, height, segments);
// Default: (1, 1, 2, 32)
// Set radiusTop != radiusBottom for cones
```

#### PlaneGeometry

```typescript
const plane = new PlaneGeometry(width, height, widthSegments, heightSegments);
// Default: (1, 1, 1, 1)
// Segments allow for deformation and subdivision
```

#### ConeGeometry

```typescript
const cone = new ConeGeometry(radius, height, segments);
// Default: (1, 2, 32)
// Creates a cone with optional custom radius, height, and segment count
```

### Material System

```typescript
import { Material } from "@engine/features/render-plugin";

const material = new Material(
  [1, 0, 0, 1],  // Color (RGBA)
  0.5,            // Metallic (0.0-1.0)
  0.8,            // Roughness (0.0-1.0)
  1.0,            // Opacity (0.0-1.0)
  false,          // Wireframe
  "basic"         // Shader ID (optional, defaults to "basic")
);

// Modify material at runtime
material.color = [0, 1, 0, 1]; // Change to green
material.wireframe = true;      // Enable wireframe
material.opacity = 0.5;         // Make semi-transparent
```

### Transform Component

Positioning, rotating, and scaling entities:

```typescript
import { Transform } from "@engine/features/transform-plugin";

const transform = new Transform(
  [0, 0, 0],      // position [x, y, z]
  [0, 0, 0],      // rotation [rx, ry, rz] in radians
  [1, 1, 1]       // scale [sx, sy, sz]
);

// Modify at runtime
transform.position = [5, 2, -3];
transform.rotation[1] += 0.1; // Rotate around Y axis
transform.scale = [2, 2, 2];  // Double size
```

### Visibility Control

Show or hide entities without removing components:

```typescript
import { Visible } from "@engine/features/render-plugin";

const entity = world.createEntity();
// ... add geometry and material ...
world.add(entity, new Visible(true)); // Initially visible

// Later, hide without destroying
const visible = world.get(entity, Visible);
visible.enabled = false; // Not rendered, but components remain

visible.enabled = true;  // Show again
```

### Lighting

Adjust global lighting:

```typescript
import { LightingState } from "@engine/features/render-plugin";

const lighting = world.getResource("LightingState");

// Ambient light
lighting.ambientColor = [0.5, 0.5, 0.5];
lighting.ambientIntensity = 0.8;

// Directional light (like sun)
lighting.directionalLightDir = [0, -1, 0];      // Points downward
lighting.directionalLightColor = [1, 1, 1];
lighting.directionalLightIntensity = 1.2;
```

### Camera Control

Adjust camera position and settings:

```typescript
import { CameraState } from "@engine/features/render-plugin";

const camera = world.getResource("CameraState");

// Position and target
camera.position = [0, 5, 10];
camera.target = [0, 0, 0];
camera.up = [0, 1, 0];

// Perspective settings
camera.fov = 75;                    // Field of view in degrees
camera.near = 0.1;                  // Near clipping plane
camera.far = 1000;                  // Far clipping plane
camera.aspectRatio = 16 / 9;        // Width/Height

// To handle window resize
window.addEventListener("resize", () => {
  const canvas = document.querySelector("canvas")!;
  camera.aspectRatio = canvas.width / canvas.height;
});
```

## Architecture

### Plugin Structure

```
src/features/render-plugin/
├── components/           # Data containers
│   ├── box-geometry.ts
│   ├── sphere-geometry.ts
│   ├── cylinder-geometry.ts
│   ├── plane-geometry.ts
│   ├── cone-geometry.ts
│   ├── material.ts
│   ├── visible.ts
│   └── mod.ts
├── resources/            # Global state
│   ├── render-context.ts
│   ├── geometry-buffer-cache.ts
│   ├── shader-library.ts
│   ├── lighting-state.ts
│   ├── camera-state.ts
│   └── mod.ts
├── systems/              # Behavior/logic
│   ├── render-initialization-system.ts
│   ├── geometry-buffer-system.ts
│   ├── camera-update-system.ts
│   ├── mesh-render-system.ts
│   ├── shaders.ts
│   └── mod.ts
├── utils/                # Helper functions
│   ├── mesh-generators.ts
│   ├── math.ts
│   ├── shader.ts
│   └── index.ts
├── shaders/              # GLSL source files
│   ├── basic.vert
│   └── basic.frag
├── tests/                # Unit tests
└── README.md
```

### System Execution Order

Systems run in this order each frame:

1. **RenderInitializationSystem** - Initializes WebGL (runs once)
2. **GeometryBufferSystem** - Generates GPU buffers for geometries
3. **CameraUpdateSystem** - Updates view/projection matrices
4. **MeshRenderSystem** - Renders all visible entities

### Component Composition Patterns

**Minimal Entity** - Uses default material:
```typescript
entity + Transform + BoxGeometry + Visible
```

**Full Entity** - Custom appearance:
```typescript
entity + Transform + SphereGeometry + Material + Visible
```

**Hidden Entity** - Components without visibility:
```typescript
entity + Transform + CylinderGeometry + Material
// (No Visible component = not rendered)
```

## Performance Considerations

### Geometry Caching

GPU buffers are cached by geometry parameters to avoid regeneration:

```
Box with (1, 1, 1) -> Cached as "box_1_1_1"
Box with (2, 1, 1) -> Different cache entry
```

Multiple entities with identical geometry reuse the same GPU buffers.

### Recommendations

- **Keep mesh counts reasonable**: Test performance with your target hardware
- **Use LOD**: Higher segment counts = smoother but more vertices
- **Batch similar objects**: Same geometry/material renders efficiently
- **Visibility optimization**: Hide entities instead of destroying/creating

## Troubleshooting

### Nothing Renders

1. Ensure `canvas` element exists in DOM
2. Verify transform-plugin is installed first
3. Check browser console for shader compilation errors
4. Ensure entities have Visible component

### Distorted Geometry

1. Check camera near/far planes aren't clipping geometry
2. Verify Transform component has reasonable values
3. Check scale isn't zero on any axis

### Performance Issues

1. Reduce segment counts on geometry
2. Check number of entities with renderables
3. Profile GPU time with WebGL debuggers (SpectorJS, etc.)

## Advanced Usage

### Custom Lighting

The basic shader supports one directional light + ambient. For more advanced lighting:

1. Extend the shader in `systems/shaders.ts`
2. Add point lights or spotlights as uniforms
3. Modify lighting calculations in fragment shader

### Extending with Custom Geometry

To add new geometry types:

1. Create a component in `components/`
2. Add mesh generation in `utils/mesh-generators.ts`
3. Handle in `GeometryBufferSystem`
4. Render in `MeshRenderSystem`

## Cleanup & Disposal

When shutting down:

```typescript
import { disposeRenderPlugin } from "@engine/features/render-plugin";

// Clean up WebGL resources
disposeRenderPlugin(world);
```

This ensures all GPU memory is properly released.

## Future Enhancements

- Instanced rendering for many identical objects
- Frustum culling to skip off-screen geometry
- Custom mesh loading (.obj, .gltf)
- Advanced materials (PBR, normal mapping)
- Shadow mapping
- Post-processing effects
- Multiple light types (point, spot, area)

## API Reference

### Components

- `BoxGeometry(width, height, depth)`
- `SphereGeometry(radius, segments, rings)`
- `CylinderGeometry(radiusTop, radiusBottom, height, segments)`
- `PlaneGeometry(width, height, widthSegments, heightSegments)`
- `ConeGeometry(radius, height, segments)`
- `Material(color, metallic, roughness, opacity, wireframe, shaderId)`
- `Visible(enabled)`

### Resources

- `RenderContext` - WebGL context and matrices
- `GeometryBufferCache` - GPU buffer storage
- `ShaderLibrary` - Compiled shader programs
- `LightingState` - Global lighting parameters
- `CameraState` - Camera position and settings

### Systems

- `RenderInitializationSystem` - WebGL setup
- `GeometryBufferSystem` - Buffer generation
- `CameraUpdateSystem` - Camera matrix updates
- `MeshRenderSystem` - Entity rendering

### Functions

- `installRenderPlugin(world, config)` - Initialize plugin
- `disposeRenderPlugin(world)` - Clean up resources

## Contributing

When modifying the RenderPlugin:

1. Follow ECS principles: components hold data, systems contain logic
2. Update both TypeScript code and shader source files
3. Add tests for new mesh generation algorithms
4. Document public API and usage patterns
5. Test with multiple geometries and materials

## License

Same as Game Studio X engine
