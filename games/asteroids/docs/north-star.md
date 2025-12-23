# Game Design North Star

## Purpose
Define the guiding principles, design vision, and technical constraints for the Asteroids game to ensure focused development and clear architectural decisions. This document serves as the single source of truth for what the game is and what it isn't.

## Game Vision
A modern take on the classic Asteroids arcade game, built with ECS principles and 3D rendering. The player navigates a top-down arena, destroying asteroids and aliens with missiles while managing their ship's position and momentum.

## Most Important Principles

### ECS Architecture First
1. All game logic flows through ECS systems.
2. Asteroids, aliens, and the player ship are entities with components.
3. Collision detection, input handling, and rendering are systems.
4. No monolithic game classes or inheritance hierarchies.

### Performance-First Collision Detection
1. Missile-asteroid and missile-alien collisions must be handled efficiently.
2. Use spatial partitioning or quadtree approaches if needed.
3. Collision checks should never block frame rendering.
4. Vector geometry and simple AABB or circle collision detection preferred over complex physics.

### Vector-Based Procedural Rendering
1. All game objects (asteroids, aliens, ships) are made of vector points.
2. No pre-baked meshes or textures for game entities.
3. Geometry is defined as arrays of points, converted to Three.js BufferGeometry.
4. Ensures lightweight, scalable, and visually consistent art direction.

## Technical Constraints (Non-Negotiable)

### Runtime & Language
- JavaScript Runtime: Deno
- Language: TypeScript

### Rendering
- Render Engine: Three.js
- Camera: Orthographic top-down view (X-Y plane)
- Coordinate System: Z-axis locked (no Z movement for game entities)
- Geometry: BufferGeometry for all game objects

### Physics
- **No 3D Physics Engine**: Rapier not required.
- Manual collision detection using geometric primitives (circles, raytrace, AABBs).
- Asteroid/alien movement via simple velocity and rotation updates.

### Audio
- Format: MP3 files
- No synthesized audio or music generation.

### Input
- Keyboard-driven controls:
  - W: Forward thrust
  - A/D: Rotate left/right
  - Spacebar: Fire missiles
  - Q: Hyper jump (teleport)

### UI/HUD
- Framework: React with hooks
- Font: Custom TTF font
- Rendering: Canvas overlay on top of Three.js scene
- Events: Custom event system for HUD updates (score, lives, wave, etc.)
- No DOM elements directly in the game—HUD is Canvas-based.

### Game Loop & Engine Integration
- Uses the Game Studio X ECS engine for world management, systems, and component lifecycle.
- Input and rendering systems are game-specific plugins.
- Scene lifecycle managed through the engine's scene manager.

## Core Mechanics

### Player Ship
- Controlled via keyboard input.
- Has position, velocity, rotation, and health.
- Players velocity decays with no keyboard input.
- Fires missiles on spacebar input.
- Hyper jump (Q) teleports ship to random safe location.
- Wrapped world boundaries (exits one side, appears on the opposite).

### Asteroids
- Vary in size (large, medium, small).
- Split into smaller asteroids when hit by a missile.
- Rotate and drift with constant velocity.
- No acceleration or physics simulation.

### Aliens
- Simple AI entities that track and shoot at the player.
- Destroyed by missiles.
- Spawn at intervals and increase in difficulty.

### Missiles
- Fired by the player and aliens.
- Travel in a straight line with constant velocity.
- Destroyed on collision with asteroids or aliens.
- Despawn after a timeout, able to travel off screen to opposite side.

### Collision System
- Discrete collision detection (no continuous sweeping needed).
- Missile-asteroid, missile-alien, and player-asteroid, player-alien collisions.
- Tight collision detection but performant.

## Gameplay Flow

### Title Screen
- Displays large "ASTEROIDS" title text.
- Background visual of slowly rotating asteroids and aliens.
- Press any key to continue to the main menu.
- No menu options on this screen—simple press-to-start experience.

### Main Menu
- Menu options: Start Game, High Scores, How to Play, Credits, Quit.
- Simple keyboard or mouse navigation (arrow keys to select, Enter to confirm).
- Background visual of slowly rotating asteroids and aliens.

### Game Start
- Player ship spawns at center of screen.
- Until player moves, they are safe from asteroids and aliens.
- First wave of asteroids spawns around the arena.
- HUD displays: Lives (ship icons), Score, Wave Number, High Score.
- Game begins on first input.

### Active Gameplay
- The start of a new wave starts with the title "Entering Zone x" with a star zoom effect as if the player is in hyperspace. 
- Player navigates the arena, avoiding and destroying asteroids.
- Player and Asteroids can travel out of the arena to appear on the opposite side, while aliens despawn if they go off the left or right side of the screen.
- Asteroids decrease in size as they are hit (large → medium → small → destroyed).
- Each destroyed asteroid awards points (smallest asteroids worth more).
- Every few seconds, an alien spawns and actively hunts the player.
- When all asteroids in a wave are destroyed, the wave is over.
- Player can hyper jump (Q) to escape dangerous situations (limited uses or cooldown).
- Player can press P to pause the game.

### HUD During Gameplay
- **Top Left**: Lives remaining (ship icons).
- **Top Center**: Wave number and enemy count.
- **Top Right**: Current score and high score.
- **Bottom Center**: Controls hint (optional, fades after game start).
- **Center (on hit)**: Visual feedback (screen shake, brief red flash, or damage indicator).

### Player Destruction
- Player takes dies on collision with asteroids or alien fire.
- Ship explodes with a visual effect and sound.
- Lives decrease when the player dies; if lives > 0, player respawns at center with temporary invulnerability.
- If lives = 0, game transitions to Game Over screen.

### Game Over Screen
- Displays final score, wave reached, and enemies destroyed.
- Shows if it's a new high score.
- Options: Play Again, Return to Menu, Quit.

### How To Play Screen
- Instructions on the rules of play.
- Displays keyboard controls for ship movement.

### Credits
- Displays game credits and inspiration.

### Wave Progression
- **Wave 1-3**: Asteroids only, increasing count.
- **Wave 4+**: Asteroids + occasional alien spawns.
- **Difficulty scaling**: Asteroid spawn count increases, alien fire rate increases, alien spawn frequency increases.
- **Win condition**: No explicit win state; game continues indefinitely until player loses all lives.
- **Additional Lives**: For every 10,000 points, the player receives one more life.

### Audio & Feedback
- **Menu**: Background ambient tone (optional, very subtle).
- **Gameplay**: 
  - Thrust sound (looped, plays while W is held).
  - Missile fire (sharp, quick sound).
  - Asteroid destruction (varies by size: high-pitched for small, deeper for large).
  - Hyper jump activation (sci-fi whoosh sound).
  - Collision/player hit (harsh, discordant tone).
  - Wave cleared or alien spawn (fanfare or alert sound).
- **Game Over**: Sad or neutral ending sound.

## Explicitly Not Building

### No Advanced Physics
- No gravity, friction, or realistic momentum simulation.
- Discrete collision detection (no continuous sweeping needed).
- No constraints, joints, or articulated bodies.

### No 3D Gameplay
- Camera is fixed orthographic top-down.
- Z-axis is locked; game is effectively 2D in 3D space.
- No vertical movement, layering, or depth-based mechanics.

### No Networked Multiplayer
- Single-player only.
- No server synchronization or peer-to-peer gameplay.

### No Persistence or Progression
- No save system, level select, or progression across sessions.
- Game state resets on game over or new game.

### No Procedural Generation Beyond Asteroids
- Asteroids are split deterministically; spawning follows a wave pattern.
- No infinite roguelike runs or dynamic level generation.

### No Advanced Particle Systems
- Minimal effects beyond geometric shapes.
- No GPU-accelerated particle engines.

## What Success Looks Like

### The game should:
- Feel responsive and tight in control.
- Run smoothly at 60 FPS with many asteroids and missiles on-screen.
- Use the ECS engine without any custom extensions (game logic is all in plugins).
- Render all game objects as vector geometry efficiently.
- Provide clear audio and visual feedback for all player actions.

### Technical metrics:
- Collision detection completes in < 1ms per frame with 100+ entities.
- Game objects render with minimal draw calls (batched geometry preferred).
- All ECS queries are efficient (component lookups, system iteration).

### The team should:
- Spend most time on game balance, art direction, and content (wave design, alien behaviors).
- Never need to modify the core engine for game-specific needs.
- Use the event system to communicate between HUD and gameplay.

## Summary Statement (North Star)
Build a tight, responsive Asteroids arcade game using ECS principles, 3D vector rendering, and efficient collision detection—no physics engine, no multiplayer, no 3D camera movement. Everything serves the core arcade loop: shoot asteroids, avoid collisions, survive waves. Simplicity and performance win.
