# Orbit Controls Feature

Feature Name: Orbit Controls Integration
Filename: `2025-12-08-orbit-controls.md`
Date: December 8, 2025
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Add Three.js OrbitControls integration to provide intuitive camera manipulation for 3D scenes. This will enable users to orbit around a target point, pan the camera, and zoom in/out using mouse/touch inputs, which is essential for scene exploration and debugging.

Goal / Expected Outcome:
- Users can orbit the camera around a focal point by clicking and dragging
- Users can pan the camera with middle-click or right-click drag
- Users can zoom with the mouse wheel or pinch gestures
- Controls integrate seamlessly with the existing CameraState resource
- Controls can be easily enabled/disabled per scene or globally

### Background / Context:
The engine currently has a basic `CameraState` resource that defines camera position, target, and projection parameters. The `CameraUpdateSystem` computes view and projection matrices each frame. However, there's no built-in way for users to interactively manipulate the camera using standard 3D navigation patterns. Three.js provides a well-tested OrbitControls implementation that would significantly improve the developer and user experience.

Current demos reference "Click + Drag - Orbit Camera" and "Middle Click - Pan Camera" in their UI, suggesting this functionality is expected but not yet fully implemented.

## Feature Description

### Summary:
Integrate Three.js OrbitControls as a new system within the render plugin. The system will create and manage an OrbitControls instance that manipulates the engine's `CameraState` resource, providing standard 3D camera navigation while maintaining compatibility with the engine's ECS architecture.

### Key Requirements:
- Add Three.js OrbitControls dependency to the render plugin
- Create an `OrbitControlsSystem` that updates the `CameraState` based on OrbitControls
- Provide configuration options for:
  - Enable/disable controls
  - Damping/inertia settings
  - Min/max zoom distances
  - Min/max polar angles (vertical rotation limits)
  - Min/max azimuth angles (horizontal rotation limits)
  - Pan speed, rotate speed, zoom speed
  - Auto-rotate functionality
- Create an `OrbitControlsConfig` resource for managing settings
- Ensure controls work with the existing `CameraUpdateSystem`
- Handle canvas resize events properly
- Support enabling/disabling controls at runtime
- Maintain backward compatibility with existing demos

### Non-Goals:
- Implementing custom orbit controls from scratch (we'll use Three.js implementation)
- Supporting multiple simultaneous camera control schemes (e.g., first-person + orbit)
- Advanced camera animations or cinematics (this is purely for interactive control)
- Mobile touch gesture support (can be added later if needed)
- Keyboard-based camera movement (WASD controls are separate)

## Technical Design

### Architecture:

```
render-plugin/
├── systems/
│   ├── camera-update-system.ts (existing)
│   └── orbit-controls-system.ts (new)
├── resources/
│   ├── camera-state.ts (existing)
│   ├── render-context.ts (existing)
│   └── orbit-controls-config.ts (new)
└── mod.ts
```

### Data Structures:

**OrbitControlsConfig** (new resource):
```typescript
class OrbitControlsConfig {
  enabled: boolean = true;
  enableDamping: boolean = true;
  dampingFactor: number = 0.05;
  minDistance: number = 1;
  maxDistance: number = 100;
  minPolarAngle: number = 0; // radians
  maxPolarAngle: number = Math.PI; // radians
  minAzimuthAngle: number = -Infinity;
  maxAzimuthAngle: number = Infinity;
  rotateSpeed: number = 1.0;
  panSpeed: number = 1.0;
  zoomSpeed: number = 1.0;
  autoRotate: boolean = false;
  autoRotateSpeed: number = 2.0;
  enablePan: boolean = true;
  enableZoom: boolean = true;
  enableRotate: boolean = true;
}
```

### System Execution Order:
1. `OrbitControlsSystem` runs first - updates OrbitControls and syncs to `CameraState`
2. `CameraUpdateSystem` runs second - computes matrices from `CameraState`
3. Render systems execute using the updated matrices

### Integration Points:
- **CameraState**: OrbitControls will read from and write to this resource
- **RenderContext**: Access to canvas element for event listeners
- **Input**: OrbitControls handles its own mouse/touch events
- **Scene Lifecycle**: Controls should be properly disposed when scenes change

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed (Three.js OrbitControls is well-documented)
- [x] Dependencies identified (Three.js, existing camera system)
- [ ] Review existing camera state structure
- [ ] Identify any conflicts with existing input handling

### Phase 2 — Design
- [x] API / interface draft
- [x] Data structures defined (OrbitControlsConfig)
- [x] Naming conventions approved (follows existing patterns)
- [ ] Architecture reviewed
- [ ] Determine Three.js import strategy (npm vs CDN vs vendored)

### Phase 3 — Implementation
- [ ] Add Three.js dependency to deno.json
- [ ] Create `OrbitControlsConfig` resource
- [ ] Create `OrbitControlsSystem`
- [ ] Integrate with render plugin initialization
- [ ] Handle canvas resize events
- [ ] Sync OrbitControls camera with CameraState
- [ ] Edge cases handled (null canvas, disabled state, scene transitions)
- [ ] Performance considerations addressed

### Phase 4 — Testing
- [ ] Unit tests for OrbitControlsSystem
- [ ] Integration tests with CameraUpdateSystem
- [ ] Test in existing demos (debug-demo, primitives, shapes)
- [ ] Test enable/disable functionality
- [ ] Test configuration changes at runtime
- [ ] Profiling & optimization

### Phase 5 — Documentation & Release
- [ ] Update render plugin README
- [ ] Add API documentation for OrbitControlsConfig
- [ ] Update existing demos to use controls (optional)
- [ ] Create example scene demonstrating orbit controls
- [ ] Release notes
- [ ] Update engine-north-star.md if applicable

## Implementation Details

### OrbitControlsSystem Pseudocode:
```typescript
class OrbitControlsSystem {
  private controls: OrbitControls | null = null;
  private threeCamera: THREE.PerspectiveCamera | null = null;
  
  init(world: World): void {
    // Get canvas from RenderContext
    // Create THREE.PerspectiveCamera from CameraState
    // Create OrbitControls instance
    // Configure from OrbitControlsConfig
  }
  
  update(world: World, dt: number): void {
    const config = world.getResource<OrbitControlsConfig>("OrbitControlsConfig");
    const cameraState = world.getResource<CameraState>("CameraState");
    
    if (!config.enabled || !this.controls) return;
    
    // Update controls (handles damping)
    this.controls.update();
    
    // Sync Three.js camera back to CameraState
    cameraState.position = [
      this.threeCamera.position.x,
      this.threeCamera.position.y,
      this.threeCamera.position.z
    ];
    
    // Update target from controls.target
    cameraState.target = [
      this.controls.target.x,
      this.controls.target.y,
      this.controls.target.z
    ];
  }
  
  cleanup(): void {
    // Dispose controls and remove event listeners
  }
}
```

### Configuration API:
```typescript
// In scene setup or game code:
const config = world.getResource<OrbitControlsConfig>("OrbitControlsConfig");
config.minDistance = 5;
config.maxDistance = 50;
config.autoRotate = true;
config.dampingFactor = 0.1;
```

### Risks & Concerns

**Technical Risks:**
- **Dependency Management**: Adding Three.js increases bundle size. Consider tree-shaking or importing only OrbitControls.
- **State Synchronization**: Keeping Three.js camera and CameraState in sync could introduce subtle bugs.
- **Event Handling Conflicts**: OrbitControls uses DOM events which might conflict with other input systems.
- **Scene Transitions**: Controls must be properly disposed/recreated when scenes change.
- **TypeScript Types**: Ensuring proper types for Three.js imports in Deno environment.

**Design Risks:**
- **Control Scheme Overlap**: If other camera control systems are added later, there could be conflicts.
- **Performance**: Running OrbitControls every frame adds overhead, though it should be minimal.

**Mitigation Strategies:**
- Use ES module imports for tree-shaking: `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`
- Implement thorough cleanup in system disposal
- Add enable/disable flag to prevent conflicts with other control schemes
- Document clearly when orbit controls are active vs. manual camera control
- Add integration tests for scene transitions
- Use Deno's npm: specifier for Three.js imports
- Consider lazy-loading controls only when needed

## Future Enhancements

- **First-Person Controls**: Alternative camera control scheme
- **Camera Presets**: Save/load camera positions
- **Smooth Transitions**: Animate between camera positions
- **Touch Gestures**: Enhanced mobile support
- **Multiple Camera Support**: Switch between different cameras
- **Camera Gizmo**: Visual indicator of camera orientation
- **Limits Visualization**: Debug view showing camera constraints

## Success Metrics

- Controls are responsive with no noticeable lag
- No memory leaks during scene transitions
- Performance overhead < 1% of frame time
- All existing demos continue to work
- Developer can enable/disable controls with one line of code
- Configuration changes take effect immediately

## References

- [Three.js OrbitControls Documentation](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [Three.js OrbitControls Source](https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js)
- Engine's existing CameraState and CameraUpdateSystem
- Demo files mentioning orbit controls (debug-demo.ts, primatives.ts)
