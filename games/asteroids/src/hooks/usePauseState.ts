import { useEffect, useState } from "react";
import type { PauseState } from "../game/resources/pause-state.ts";

/**
 * Custom React hook for observing pause state changes
 *
 * This hook provides a simple way for React components to react to pause state changes
 * in the game world.
 *
 * @param pauseState - The PauseState resource to observe
 * @returns The current pause state
 */
export function usePauseState(pauseState: PauseState | null): boolean {
  // Initialize with current pause state
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    return pauseState?.getIsPaused() ?? false;
  });

  useEffect(() => {
    if (!pauseState) return;

    // Subscribe to pause state changes
    const unsubscribe = pauseState.onPauseChange((newPauseState) => {
      setIsPaused(newPauseState);
    });

    return unsubscribe;
  }, [pauseState]);

  return isPaused;
}
