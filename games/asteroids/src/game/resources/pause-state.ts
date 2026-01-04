/**
 * PauseState Resource
 * Tracks whether the game is paused
 */
export class PauseState {
  private isPaused = false;
  private listeners: Array<(isPaused: boolean) => void> = [];

  toggle(): void {
    this.isPaused = !this.isPaused;
    console.log("[PauseState] toggle called, isPaused:", this.isPaused);
    this.notifyListeners();
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      console.log("[PauseState] pause called");
      this.notifyListeners();
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      console.log("[PauseState] resume called");
      this.notifyListeners();
    }
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Subscribe to pause state changes
   * @param listener Callback fired when pause state changes
   */
  onPauseChange(listener: (isPaused: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isPaused));
  }
}
