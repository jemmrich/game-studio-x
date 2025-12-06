```text
 @@@@@@@   @@@@@@  @@@@@@@@@@  @@@@@@@@     @@@@@@ @@@@@@@ @@@  @@@ @@@@@@@  @@@  @@@@@@     @@@  @@@ 
!@@       @@!  @@@ @@! @@! @@! @@!         !@@       @!!   @@!  @@@ @@!  @@@ @@! @@!  @@@    @@!  !@@ 
!@! @!@!@ @!@!@!@! @!! !!@ @!@ @!!!:!       !@@!!    @!!   @!@  !@! @!@  !@! !!@ @!@  !@!     !@@!@!  
:!!   !!: !!:  !!! !!:     !!: !!:             !:!   !!:   !!:  !!! !!:  !!! !!: !!:  !!!     !: :!!  
 :: :: :   :   : :  :      :   : :: ::     ::.: :     :     :.:: :  :: :  :  :    : :. :     :::  ::: 
```
# Game Studio X (Game Engine)
Game Studio X is a modern, lightweight game engine built with Deno, TypeScript, Vite, Three.js, and Rapier, designed around a robust Entity Component System (ECS) architecture. It enables fast, modular game development with real-time physics, high-performance rendering, and streamlined tooling. Game Studio X focuses on developer ergonomics, hot-reload workflows, and clean code composition, offering a scalable foundation for 2D/3D interactive experiences on the web.

## Current Capabilities

### Core ECS Architecture
- **Entity Management**: Create, destroy, and query entities using GUIDs
- **Component System**: Attach and manage data components to entities
- **Query System**: Powerful querying system to filter entities by component types
- **Resource Management**: Global world resources (like Time) accessible to all systems
- **System Management**: Register and execute game logic systems that operate on components

### Rendering Plugin
- **3D Geometry Primitives**: Box, Sphere, Cylinder, Plane, and Cone geometries
- **Material System**: Multiple material types (BasicMaterial for diffuse, PhongMaterial for specular highlights)
- **Shader Support**: Basic phong lighting shader and rainbow gradient shader
- **WebGL2 Rendering**: GPU-accelerated rendering via Three.js
- **Automatic Buffer Caching**: Efficient GPU buffer generation and reuse
- **Lighting System**: Ambient and directional lighting support
- **Transform Integration**: Full position, rotation, and scale support for rendered objects

### Transform Plugin
- **Position, Rotation, Scale**: Complete 3D transformation component for entities
- **Transform Hierarchy**: Support for entity-based spatial transformations

### Resource Management
- **Time Resource**: Delta time and frame timing information for smooth animations and physics

### Developer Experience
- Hot-reload support via Vite
- TypeScript first-class support
- Clean, composable ECS architecture
- Minimal plugin system for extending functionality

## The Monorepo
This game engine is in heavy early development and therefore this monorepo holds not only the game engine, but games in various states of development.

- Main development documentation can be found in `engine/readme.md`
- Engine documentation related to how to develop or use GSX can be found in `engine/docs/specs/`
- Features in development or planning can be found in `engine/docs/design/`
- Full RenderPlugin documentation: `engine/src/features/render-plugin/readme.md`
