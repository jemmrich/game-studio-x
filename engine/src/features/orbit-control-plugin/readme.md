# Orbit Control Plugin

A Three.js OrbitControls plugin for the game engine, providing intuitive camera manipulation for 3D scenes.

## Features

- **Orbit Camera**: Click and drag to rotate the camera around a focal point
- **Pan Camera**: Middle-click or right-click drag to pan the camera
- **Zoom**: Mouse wheel or pinch gestures to zoom in/out
- **Configurable**: Full control over rotation speed, zoom distance limits, auto-rotation, and more
- **Seamless Integration**: Works with the engine's existing CameraState resource
- **Runtime Control**: Enable/disable controls and modify settings on the fly
- **Scene-Safe**: Properly handles disposal and cleanup

## Installation & Usage

### Basic Setup

```typescript
import { createOrbitControlPlugin } from "./engine/features/orbit-control-plugin/mod.ts";

// Get your canvas element
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

// Create and add the plugin to your world
const orbitPlugin = createOrbitControlPlugin(canvas);
world.addSystem(orbitPlugin);
```

### Advanced Configuration

```typescript
import { createOrbitControlPlugin } from "./engine/features/orbit-control-plugin/mod.ts";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

const orbitPlugin = createOrbitControlPlugin(canvas, {
  minDistance: 5,
  maxDistance: 50,
  autoRotate: true,
  autoRotateSpeed: 3.0,
  enableDamping: true,
  dampingFactor: 0.08,
  rotateSpeed: 1.0,
  panSpeed: 1.0,
  zoomSpeed: 1.0,
});

world.addSystem(orbitPlugin);
```

### Manual Resource Registration

If you prefer more control, you can register the system and resource separately:

```typescript
import { OrbitControlConfig, OrbitControlSystem } from "./engine/features/orbit-control-plugin/mod.ts";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

// Create and register the configuration resource
const config = new OrbitControlConfig({
  autoRotate: true,
  minDistance: 1,
  maxDistance: 100,
});
world.addResource("OrbitControlConfig", config);

// Create and register the system
const system = new OrbitControlSystem(canvas);
world.addSystem(system);
```

## Configuration Options

All options in `OrbitControlConfig` are optional and have sensible defaults:

### Control Enable/Disable

- `enabled` (boolean, default: `true`): Master enable/disable for all controls
- `enableRotate` (boolean, default: `true`): Enable/disable rotation
- `enablePan` (boolean, default: `true`): Enable/disable panning
- `enableZoom` (boolean, default: `true`): Enable/disable zooming

### Distance Constraints

- `minDistance` (number, default: `1`): Minimum zoom distance
- `maxDistance` (number, default: `100`): Maximum zoom distance

### Angle Constraints

- `minPolarAngle` (number, default: `0`): Minimum vertical rotation angle (radians)
- `maxPolarAngle` (number, default: `π`): Maximum vertical rotation angle (radians)
- `minAzimuthAngle` (number, default: `-Infinity`): Minimum horizontal rotation angle (radians)
- `maxAzimuthAngle` (number, default: `Infinity`): Maximum horizontal rotation angle (radians)

### Speed Settings

- `rotateSpeed` (number, default: `1.0`): Rotation sensitivity multiplier
- `panSpeed` (number, default: `1.0`): Panning sensitivity multiplier
- `zoomSpeed` (number, default: `1.0`): Zoom sensitivity multiplier

### Damping (Inertia)

- `enableDamping` (boolean, default: `true`): Enable inertia/damping
- `dampingFactor` (number, default: `0.05`): How quickly movement decelerates (0-1)

### Auto-Rotation

- `autoRotate` (boolean, default: `false`): Enable automatic camera rotation
- `autoRotateSpeed` (number, default: `2.0`): Auto-rotation speed (degrees per second)

## System Execution Order

The OrbitControlSystem runs **before** the CameraUpdateSystem to ensure:

1. OrbitControlSystem updates OrbitControls and syncs to CameraState
2. CameraUpdateSystem computes view and projection matrices
3. Render systems execute with updated matrices

## Important Notes

### Dependency on Render Plugin

This plugin requires the **render plugin** to be initialized first, as it depends on the `CameraState` resource. If CameraState is not found, the plugin will log an error and skip initialization.

### Backward Compatibility

This plugin is completely optional and does not affect existing code:
- Projects without orbit controls work exactly as before
- Existing camera manipulation systems can coexist (by disabling orbit controls)
- The render plugin is unaware of and unaffected by this plugin

## Implementation Details

### Architecture

```
orbit-control-plugin/
├── deno.json                          # Three.js dependency
├── mod.ts                             # Plugin factory
├── types.ts                           # Type definitions
├── resources/
│   ├── mod.ts
│   └── orbit-control-config.ts        # Configuration resource
└── systems/
    ├── mod.ts
    └── orbit-control-system.ts        # Main system implementation
```

### Three.js Integration

The plugin creates a Three.js PerspectiveCamera internally and uses the official OrbitControls implementation from Three.js. It then synchronizes this camera's state back to the engine's CameraState resource each frame.

### Canvas Resize Handling

The system automatically detects canvas resizes using:
- ResizeObserver (if available)
- Window resize events

The camera's aspect ratio is updated automatically to match the canvas dimensions.

## Troubleshooting

### Controls not working
- Ensure the canvas element is properly attached to the DOM
- Verify the render plugin is initialized before the orbit control plugin
- Check browser console for error messages

### Camera position seems wrong
- Verify the initial CameraState in the render plugin is set correctly
- Check that the canvas has proper width/height dimensions

### Performance issues
- Try increasing `dampingFactor` to reduce smoothness (saves CPU)
- Disable `autoRotate` if not needed
- Check that only one camera control system is active at a time

## Future Enhancements

- Touch gesture support for mobile
- Camera preset/bookmark system
- Smooth camera transitions/animations
- First-person camera alternative
- Camera gizmo visualization
