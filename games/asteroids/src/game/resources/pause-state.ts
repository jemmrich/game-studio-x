/**
 * PauseState Resource
 * Tracks whether the game is paused
 */
export class PauseState {
  private isPaused = false;

  toggle(): void {
    this.isPaused = !this.isPaused;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }
}
