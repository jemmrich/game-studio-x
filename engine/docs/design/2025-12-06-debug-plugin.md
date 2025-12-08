# Debug Plugin System

Feature Name: Debug Plugin
Filename: `2025-12-06-debug-plugin.md`
Date: 2025-12-06
Author: Game Studio X Team
Version: 1.0

## Purpose & Overview

### Purpose:
Provide developers with real-time debugging tools and visualization utilities that can be easily integrated into games without polluting core game code. The debug plugin exposes helper components and systems that aid in development, profiling, and game iteration.

Goal / Expected Outcome:
- Developers can easily enable/disable debug features at runtime
- Visual debugging tools (entity highlighting, bounds visualization, grid overlays, etc.) are available out-of-the-box
- Minimal performance impact when disabled
- Debug components and systems are completely optional and don't affect production game logic
- Quick iteration and problem-solving during development

### Background / Context:
As games grow in complexity, developers need real-time visibility into game state during play. Debugging tools like entity inspectors, physics visualization, grid overlays, and performance metrics help identify issues quickly. Rather than having developers implement these repeatedly, a standardized debug plugin provides reusable components and systems that can be toggled on/off without modifying core game code.

## Feature Description

### Summary:
The debug plugin provides a collection of optional helper components and systems designed for runtime debugging and visualization. Features include:
- **Debug visualization components** - Mark entities for visual debugging (bounds, outlines, grids, etc.)
- **Debug systems** - Render and update debug visualizations each frame
- **Debug UI helpers** - Text overlays, performance monitors, entity inspectors
- **Debug input handling** - Keyboard shortcuts and controls for toggling debug features

### Key Requirements:

#### Core Debug Plugin Structure
- Implement as a **feature plugin** (not core engine component) to keep debugging optional
- Plugin can be registered or omitted based on game needs
- Export debug components and systems for selective use
- Provide a debug manager/context for coordinating debug state across systems

#### Debug Visualization Components
- **DebugBounds** - Marks an entity for bounds/collision visualization
  - Properties: color, lineWidth, filled (boolean for filled vs outline)
  - Works with existing Transform and rendering systems
  
- **Debug2dGridOverlay** - Renders a 2D grid overlay on the scene
  - Properties: gridSize, color, opacity, enabled
  - Single global component managed by scene/world
  
- **DebugOutline** - Renders a highlighted outline around entities
  - Properties: color, thickness, intensity (glow effect)
  - Works with existing sprite/mesh renderers

- **DebugLabel** - Attaches debug text to entities
  - Properties: text, offset, color, fontSize
  - Renders via UI system

- **DebugPerformance** - Tracks entity count, system execution time, memory usage
  - Properties: showFPS, showEntityCount, showFrameTime, sampleRate
  - Single global component

#### Debug Systems
- **DebugBoundsRenderSystem** - Renders bounds for entities with DebugBounds component
  - Iterates entities with Transform + DebugBounds
  - Calculates bounds and renders debug geometry
  - Uses camera system for proper viewport culling

- **DebugGridRenderSystem** - Renders 2D grid overlay
  - Reads Debug2dGridOverlay component
  - Renders grid aligned to world space or camera space (configurable)

- **DebugLabelRenderSystem** - Renders debug labels on entities
  - Iterates entities with DebugLabel + Transform
  - Projects world positions to screen coordinates
  - Renders via UI text system

- **DebugPerformanceSystem** - Tracks and displays performance metrics
  - Samples entity count each frame
  - Measures system execution time (if profiling hooks available)
  - Updates DebugPerformance component with metrics

#### Debug Manager/Context
- **DebugContext** resource - Global state for debug features
  - Properties: enabled (boolean), visibleLayers (Set<string>), metrics (performance data)
  - Methods: toggleFeature(name), isEnabled(name), getMetrics()
  - Allows easy enable/disable of debug systems without unregistering them

#### Integration Points
- Debug plugin doesn't require modifications to core engine
- Games opt-in by registering plugin during world initialization
- Debug components can be added/removed like any other component
- Debug systems integrate with existing render pipeline

### Non-Goals:
- **Advanced profiling tools** - CPU/GPU profiling is left to external tools (DevTools, Deno profiler)
- **Networking/multiplayer debugging** - Multiplayer debug features are game-specific
- **Physics-specific debug rendering** - Physics debugging is responsibility of physics plugin (if one exists)
- **Undo/redo system** - Game state reversal is out of scope
- **Debug save/load** - Saving debug state is a game-level feature
- **Web inspector integration** - Remains game-specific; plugin provides data that games can expose to inspectors

## Development Phases & Checklist

### Phase 1 — Discovery
- [x] Requirements confirmed
- [x] Technical feasibility reviewed
- [x] Dependencies identified (Transform, UI rendering systems)

### Phase 2 — Design
- [x] API / interface draft
- [x] Data structures defined
- [x] Component and system contracts established
- [x] Integration points with core engine identified

### Phase 3 — Implementation
- [x] Create the Debug feature plugin folder layout
- [x] Debug components created (DebugBounds, Debug2dGridOverlay, DebugLabel, DebugPerformance)
- [x] Debug systems implemented (BoundsRender, GridRender, LabelRender, Performance)
- [x] DebugContext resource created
- [x] Plugin registration and initialization logic
- [ ] Input handling for debug toggling (if needed for v1)

### Phase 4 — Testing
- [x] Unit tests for debug components
- [ ] Integration tests for debug systems with rendering
- [ ] Performance tests (ensure debug features don't tank FPS when enabled)
- [ ] Compatibility tests with existing game scenes

### Phase 5 — Documentation & Release
- [ ] API documentation for all debug components and systems
- [ ] Usage examples (adding debug to an existing scene)
- [ ] Demo scene showcasing all debug features
- [ ] Performance impact documentation
- [ ] Release notes

### Risks & Concerns
- **Performance impact** - Debug rendering (bounds, grids, labels) could impact frame rate if not optimized
  - Mitigation: Use efficient batch rendering, implement LOD (reduce debug detail at distance), provide enable/disable toggle
  
- **Integration with custom renderers** - Games with custom rendering pipelines may need to adapt debug systems
  - Mitigation: Keep debug systems simple and composable; document integration points
  
- **Scope creep** - Easy to add too many debug features; needs clear boundaries
  - Mitigation: Start with essential features (bounds, grid, labels); add more based on feedback

## Architecture Notes

### Plugin Structure
```
debug-plugin/
├── mod.ts                 # Plugin registration and exports
├── types.ts              # Component and system type definitions
├── components/
│   ├── debug-bounds.ts
│   ├── debug-grid.ts
│   ├── debug-label.ts
│   ├── debug-performance.ts
│   └── mod.ts
├── systems/
│   ├── debug-bounds-render.ts
│   ├── debug-grid-render.ts
│   ├── debug-label-render.ts
│   ├── debug-performance.ts
│   └── mod.ts
├── resources/
│   └── debug-context.ts  # Global debug state
├── utils/
│   └── debug-helpers.ts  # Utility functions
└── tests/
    └── debug-plugin.test.ts
```

### Component Example (DebugBounds)
```typescript
export interface DebugBounds {
  color: Color;
  lineWidth: number;
  filled: boolean;
}

export function createDebugBounds(
  color: Color = { r: 1, g: 0, b: 0, a: 1 },
  lineWidth: number = 2,
  filled: boolean = false
): DebugBounds {
  return { color, lineWidth, filled };
}
```

### System Example (DebugBoundsRenderSystem)
```typescript
export function debugBoundsRenderSystem(world: World): System {
  return {
    name: "DebugBoundsRender",
    query: [Transform, DebugBounds],
    execute: (entities, world) => {
      for (const entity of entities) {
        const transform = world.getComponent(entity, Transform);
        const bounds = world.getComponent(entity, DebugBounds);
        // Render bounds geometry
        renderBoundsDebug(transform, bounds, world.getResource(RenderContext));
      }
    },
  };
}
```

## Most Common Helpers (Top 10 Used Daily)

If you want the essentials:
- Axis helper
- Bounding box helper
- Wireframe helper
- Collider visualizer
- Camera frustum helper
- Light icon + light cone/radius
- Raycast line helper
- Physics body/forces helper
- Normal/tangent helpers
- Grid helper

Those are the ones nearly every engine uses every single day in dev builds.

## Future Extensions
- **Transform / Orientation Helpers** - Visual aids for understanding entity positioning and orientation in 3D space
  - **Axis / Orientation helpers**
    - World axis gizmo (shows global X/Y/Z axes)
    - Local entity axis gizmo (X/Y/Z arrows showing entity's local coordinate system)
    - Rotation rings or handles (interactive rotation controls, editor-only)
  - **Grids & rulers**
    - Infinite or finite floor grid (extensible grid planes)
    - Customizable unit markers (measurement ticks on grid lines)
    - Ruler lines for measuring distances (dynamic measurement tools)
  - **Transform widgets**
    - Position / rotation / scale gizmos (interactive transform controls)
    - Drag handles (for direct manipulation of transform values)
    - Snapping indicators (visual feedback for grid/object snapping)

- **Geometry Helpers** - Visualize mesh shapes, extents, frustums, and internal geometry
  - **Bounding helpers**
    - Bounding box (AABB / OBB)
    - Bounding sphere
    - Capsule visualization
    - Mesh wireframe overlay
  - **Geometry debugging**
    - Vertex normal helper
    - Face normal helper
    - Tangent/binormal helpers
    - Vertex point cloud visualization
    - Edge highlighting

- **Camera Helpers** - Typically used by scene editors and cinematic tools
  - Camera frustum helper
  - Orthographic size visualizer
  - Focus plane visualizer (DOF)
  - Safe zones or aspect-ratio guides
  - Look-at vectors

- **Lighting Helpers** - Show how lights affect the scene
  - **Light visualization**
    - Light direction indicator (for directional lights)
    - Point light radius sphere
    - Spot light cone
    - Shadow frustum volume
    - Shadow cascade debug view (for cascaded shadow maps)
  - **Lighting diagnostics**
    - Heatmap of light intensity in world
    - Overdraw visualization
    - Light-probes grid preview
    - GI volumes (if applicable)

- **Physics Helpers** - These are extremely popular and often built-in
  - **Collider helpers**
    - Box collider
    - Sphere collider
    - Capsule collider
    - Mesh collider wireframe
    - Convex hull helper
  - **Physics world helpers**
    - Contact point markers
    - Raycast visualization
    - Broadphase cells
    - Center-of-mass marker
    - Constraint/joint visualization
    - Velocity vectors
    - Angular velocity arcs

  Rapier, Ammo, PhysX engines all include similar debugging systems.

- **AI / Gameplay Helpers** - Very useful for prototyping and debugging ECS systems
  - **Navigation helpers**
    - NavMesh overlay rendering
    - Pathfinding route preview
    - Waypoint visualizer
    - Patrol route paths
    - Steering vectors
  - **AI behavior helpers**
    - Vision cones
    - Hearing spheres
    - Attack ranges
    - Detection queries
    - Threat/aggro radii
  - **Gameplay helpers**
    - Trigger volume outlines
    - Spawn point helpers
    - Quest marker nodes
    - Scripting debug nodes

- **Particle & VFX Helpers** - Visual tools for tuning particles and visual effects
  - Bounds of particle systems
  - Emission shape preview
  - Wind zone gizmos
  - Noise fields visualization
  - Force fields visualization

- **Engine / System Debug Helpers** - Used for debugging core engine systems like ECS, rendering, or timing
  - **ECS debugging**
    - Entity count display
    - Component debug overlay
    - System execution timing graphs
    - Query performance heatmaps
  - **Rendering debugging**
    - Wireframe renderer
    - Normals renderer
    - Depth map visualization
    - Shadow map visualization
    - G-buffer debug views (if deferred)
    - HDR histogram
  - **Audio debugging**
    - 3D audio emitter radii
    - Listener cones
    - Occlusion zones

- **Networking Helpers** - If your engine includes multiplayer
  - Networked entity ownership visualization
  - Latency cones
  - Client/server authority indicators

- **Entity inspector UI** - Interactive panel to inspect/modify entity components
- **System profiler** - Detailed system execution time breakdown
- **Event logging** - Capture and replay important game events
- **State snapshots** - Save and restore game state for debugging
- **Remote debugging** - Connect to game from external debugger
