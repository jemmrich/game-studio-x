# Transform Plugin

## Purpose
Provides foundational spatial transformation capabilities to the ECS engine. This plugin is a core requirement for nearly all other plugins and features that need to work with entity positions, rotations, and scales in 3D space.

## Components
- `Transform` - Core position, rotation, and scale component. Provides methods for local-to-world and world-to-local transformations, parent-child relationships, and hierarchical transforms.

## Resources
None - this is a minimal plugin that only provides the component.

## Systems
None - the Transform component is data-only. Other plugins query and modify transforms as needed.

## Installation

```typescript
import { installTransformPlugin } from "@engine/features/transform-plugin";

const world = new World();
installTransformPlugin(world);
```

## Usage Example

```typescript
const entity = world.createEntity();
world.add(entity, new Transform({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
}));

// Get the transform component
const transform = world.get(entity, Transform);
console.log(transform.position);
```

## Dependencies
- None - This is a core plugin with no dependencies.

## Dependent Plugins
Most other plugins depend on Transform:
- Debug Plugin
- Render Plugin
- Physics Plugin (when available)
- Orbit Control Plugin
- Any custom game plugins that need spatial references

## Known Issues
None

## Future Improvements
- [ ] Hierarchical transform optimization (spatial caching)
- [ ] Transform interpolation for smoother movement
- [ ] Batch transform updates for performance
- [ ] Transform event system for change notifications
