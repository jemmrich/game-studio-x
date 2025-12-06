/**
 * Generic tag component for grouping and identifying entities.
 * Used by scenes to track ownership, but also useful for many other scenarios:
 * - Enemy waves, UI groups, audio channels, etc.
 */
export class Tag {
  /** Identifier string for this tag */
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}
