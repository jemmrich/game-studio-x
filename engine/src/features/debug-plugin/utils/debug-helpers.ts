/**
 * Utility functions for debug operations
 */

/**
 * Convert world coordinates to screen coordinates
 * This is a simplified implementation - real implementation would use camera matrices
 */
export function worldToScreen(worldX: number, worldY: number, screenWidth: number, screenHeight: number): [number, number] {
  const screenX = screenWidth / 2 + worldX * 50; // 50 pixels per unit
  const screenY = screenHeight / 2 + worldY * 50;
  return [screenX, screenY];
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screenX: number, screenY: number, screenWidth: number, screenHeight: number): [number, number] {
  const worldX = (screenX - screenWidth / 2) / 50;
  const worldY = (screenY - screenHeight / 2) / 50;
  return [worldX, worldY];
}