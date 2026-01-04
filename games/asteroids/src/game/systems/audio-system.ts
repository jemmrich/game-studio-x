/**
 * Example: Audio System
 * 
 * This is an example system showing how to play audio using the AssetLoader.
 * You can use this pattern in your game systems (missile firing, explosions, etc.)
 */

import type { World } from "@engine/core/world.ts";
import type { AssetLoader } from "../resources/asset-loader.ts";

export class AudioSystem {
  /**
   * Play a sound effect
   * @param world - The game world
   * @param soundId - The ID of the sound registered in AssetLoader
   * @param volume - Volume level (0.0 to 1.0)
   * @param playbackRate - Playback speed/pitch (0.5 to 2.0, default 1.0). Lower = slower/deeper, higher = faster/higher pitch
   */
  static playSound(world: World, soundId: string, volume = 1.0, playbackRate = 1.0): void {
    const assetLoader = world.getResource<AssetLoader>("assetLoader");
    
    if (!assetLoader) {
      console.warn("[AudioSystem] AssetLoader not found in world resources");
      return;
    }

    const audioElement = assetLoader.getAudio(soundId);
    
    if (!audioElement) {
      console.warn(`[AudioSystem] Audio '${soundId}' not found`);
      return;
    }

    // Clone the audio element so multiple instances can play simultaneously
    const sound = audioElement.cloneNode(true) as HTMLAudioElement;
    sound.volume = volume;
    sound.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate)); // Clamp between 0.5 and 2.0
    
    // Play the sound
    sound.play().catch((error) => {
      console.error(`[AudioSystem] Failed to play sound '${soundId}':`, error);
    });
  }

  /**
   * Play a sound effect with fade control
   * Returns the audio element for manual volume control
   * @param world - The game world
   * @param soundId - The ID of the sound registered in AssetLoader
   * @param volume - Initial volume level (0.0 to 1.0)
   * @returns The audio element or null if failed
   */
  static playSoundWithFade(world: World, soundId: string, volume = 1.0): HTMLAudioElement | null {
    const assetLoader = world.getResource<AssetLoader>("assetLoader");
    
    if (!assetLoader) {
      console.warn("[AudioSystem] AssetLoader not found in world resources");
      return null;
    }

    const audioElement = assetLoader.getAudio(soundId);
    
    if (!audioElement) {
      console.warn(`[AudioSystem] Audio '${soundId}' not found`);
      return null;
    }

    // Clone the audio element so multiple instances can play simultaneously
    const sound = audioElement.cloneNode(true) as HTMLAudioElement;
    sound.volume = volume;
    
    // Play the sound
    sound.play().catch((error) => {
      console.error(`[AudioSystem] Failed to play sound '${soundId}':`, error);
    });

    return sound;
  }

  /**
   * Play background music on loop
   * @param world - The game world
   * @param musicId - The ID of the music registered in AssetLoader
   * @param volume - Volume level (0.0 to 1.0)
   */
  static playBackgroundMusic(world: World, musicId: string, volume = 0.5): HTMLAudioElement | null {
    const assetLoader = world.getResource<AssetLoader>("assetLoader");
    
    if (!assetLoader) {
      console.warn("[AudioSystem] AssetLoader not found in world resources");
      return null;
    }

    const audioElement = assetLoader.getAudio(musicId);
    
    if (!audioElement) {
      console.warn(`[AudioSystem] Music '${musicId}' not found`);
      return null;
    }

    // Clone the audio element to avoid conflicts with the original
    const music = audioElement.cloneNode(true) as HTMLAudioElement;
    music.loop = true;
    music.volume = volume;
    
    // Play the music and handle the promise properly
    const playPromise = music.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error(`[AudioSystem] Failed to play music '${musicId}':`, error);
      });
    }

    return music;
  }

  /**
   * Stop background music
   * @param music - The audio element returned from playBackgroundMusic
   */
  static stopBackgroundMusic(music: HTMLAudioElement | null): void {
    if (music) {
      music.pause();
      music.currentTime = 0;
    }
  }
}

/**
 * Usage Examples:
 * 
 * // Play explosion sound effect
 * AudioSystem.playSound(world, 'explosion', 0.8);
 * 
 * // Play missile sound
 * AudioSystem.playSound(world, 'missile', 0.6);
 * 
 * // Start background music
 * const music = AudioSystem.playBackgroundMusic(world, 'background', 0.3);
 * 
 * // Stop background music later
 * AudioSystem.stopBackgroundMusic(music);
 * 
 * // In a collision system:
 * onCollision(world: World) {
 *   AudioSystem.playSound(world, 'explosion', 1.0);
 * }
 */
