/**
 * Configuration for demo UI text components.
 * Used by DemoBaseScene to display standardized UI elements.
 */
export interface DemoUITextConfig {
  /** Screen position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' */
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";

  /** Optional title/heading */
  title?: string;

  /** Array of text lines to display */
  lines: string[];

  /** Font size in pixels (default: 12) */
  fontSize?: number;

  /** Background color as CSS color string (default: 'rgba(0, 0, 0, 0.7)') */
  backgroundColor?: string;

  /** Padding inside the box in pixels (default: 12) */
  padding?: number;

  /** Margin from screen edge X (left/right) in pixels (default: 16) */
  marginX?: number;

  /** Margin from screen edge Y (top/bottom) in pixels (default: 16) */
  marginY?: number;

  /** Text color as CSS color string (default: 'white') */
  textColor?: string;

  /** Title color as CSS color string (default: '#ffff00' - yellow) */
  titleColor?: string;
}

/**
 * Component for displaying demo UI text overlays.
 * Used by DemoBaseScene to show standardized UI (instructions, descriptions, etc).
 *
 * The actual rendering is handled by a rendering system.
 * This component just holds the configuration.
 */
export class DemoUIText {
  config: DemoUITextConfig & {
    fontSize: number;
    backgroundColor: string;
    padding: number;
    marginX: number;
    marginY: number;
    textColor: string;
    titleColor: string;
  };

  constructor(config: DemoUITextConfig) {
    this.config = {
      fontSize: 12,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: 12,
      marginX: 16,
      marginY: 16,
      textColor: "white",
      titleColor: "#ffff00",
      ...config,
    };
  }
}
