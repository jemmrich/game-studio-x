/**
 * Game Scenes
 *
 * This module exports all game scenes that follow the engine's scene architecture.
 *
 * Scene Architecture (Phase 1 - Game Studio X):
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Each scene represents a distinct game state with clear initialization and cleanup:
 *
 * • TitleScene - Main title screen with decorative asteroids
 *   - Shows title screen with "Press Any Key" prompt
 *   - Spawns animated asteroids for visual effect
 *   - Listens for keyboard input to transition to menu
 *   - Manages background music (starts on user interaction)
 *
 * • MenuScene - Main menu with decorative asteroids
 *   - Shows menu items stacked vertically
 *   - Spawns animated asteroids for visual effect (same as title)
 *   - Supports mouse and keyboard navigation
 *   - Transitions to GameplayScene or other scenes based on selection
 *
 * • HowToPlayScene - Game instructions and controls screen
 *   - Shows instructions and control mappings
 *   - Spawns animated asteroids for visual effect (same as title/menu)
 *   - Styled keyboard keys with line-art design
 *   - Returns to menu on ESC key press
 *
 * • GameplayScene - Core game loop with wave management
 *   - Spawns player ship
 *   - Coordinates wave transitions
 *   - Pushes EnteringZoneScene onto stack for wave effects
 *   - Listens for wave completion
 *
 * • EnteringZoneScene - Wave transition effect overlay
 *   - Pauses underlying gameplay scene
 *   - Displays entering zone effect (particles, animations)
 *   - Auto-pops after effect duration
 *   - Supports multiple wave numbers
 *
 * Scene Stack Architecture:
 * ─────────────────────────
 * When a wave transitions, the scene stack looks like:
 *
 *     [EnteringZoneScene]      ← Current (on top, paused=true)
 *     [GameplayScene]          ← Underneath (paused by stack)
 *
 * The engine's SceneManager handles:
 * - Calling pause() on GameplayScene when EnteringZoneScene pushes
 * - Calling resume() on GameplayScene when EnteringZoneScene pops
 * - Ensuring only the top scene's update() is called
 *
 * Key Design Decisions:
 * ─────────────────────
 * 1. Scenes are explicit and discoverable (type-safe)
 * 2. Each scene owns its lifecycle (init/dispose/pause/resume)
 * 3. Scene stack handles pausing naturally (no special event handling)
 * 4. All plugins installed globally in main.tsx (not per-scene)
 * 5. Scenes coordinate via World events and SceneManager
 *
 * Future Extensibility:
 * ────────────────────
 * With this architecture, adding new scenes is straightforward:
 *
 * • PauseMenuScene - Pause menu that stacks on top of gameplay
 * • GameOverScene - Game over screen
 * • SettingsScene - Settings/options menu
 * • TutorialScene - Tutorial mode with special initialization
 * • DemoScene - Auto-playing demo mode
 *
 * All without modifying existing scenes!
 */

export { TitleScene } from "./title-scene.ts";
export { MenuScene } from "./menu-scene.ts";
export { HowToPlayScene } from "./how-to-play-scene.ts";
export { GameplayScene } from "./gameplay.ts";
export { EnteringZoneScene } from "./entering-zone-scene.ts";
