/**
 * Shared Game Configuration
 * Central location for game-wide settings and difficulty parameters
 */

/**
 * Difficulty configuration for wave scaling
 * Set useDifficultyMultiplier to false for normal difficulty (all waves 1.0x)
 * Set to true to enable progressive difficulty scaling
 */
export const DIFFICULTY_CONFIG = Object.freeze({
  /** Enable difficulty multiplier scaling across waves */
  useDifficultyMultiplier: false,
  
  /** Base difficulty multiplier (wave 1) */
  baseDifficultyMultiplier: 1.0,
  
  /** Difficulty increase per wave (15% = 0.15) */
  difficultyIncreasePerWave: 0.15,
});

/**
 * Calculate the difficulty multiplier for a given wave number
 * Formula: 1.0 + (waveNumber - 1) * difficultyIncreasePerWave
 * 
 * Examples with default config:
 * - Wave 1: 1.00x (1.0 + 0 * 0.15)
 * - Wave 2: 1.15x (1.0 + 1 * 0.15)
 * - Wave 3: 1.30x (1.0 + 2 * 0.15)
 * - Wave 5: 1.60x (1.0 + 4 * 0.15)
 */
export function calculateDifficultyMultiplier(waveNumber: number): number {
  if (!DIFFICULTY_CONFIG.useDifficultyMultiplier) {
    return 1.0; // No scaling
  }
  
  return DIFFICULTY_CONFIG.baseDifficultyMultiplier + 
    (waveNumber - 1) * DIFFICULTY_CONFIG.difficultyIncreasePerWave;
}
