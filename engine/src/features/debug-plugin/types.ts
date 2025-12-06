/**
 * Type definitions for the Debug Plugin
 */

/**
 * RGBA color representation
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * 2D vector for positioning
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 3D vector for positioning
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Minimal DOM types for debug rendering
 */
export interface HTMLCanvasElement {
  getContext(contextId: string): CanvasRenderingContext2D | null;
  width: number;
  height: number;
  remove(): void;
  style: {
    position: string;
    top: string;
    left: string;
    pointerEvents: string;
    zIndex: string;
    backgroundColor: string;
  };
}

export interface CanvasRenderingContext2D {
  clearRect(x: number, y: number, width: number, height: number): void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): TextMetrics;
}

export interface TextMetrics {
  width: number;
}

export type CanvasTextAlign = "start" | "end" | "left" | "right" | "center";
export type CanvasTextBaseline = "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

export interface Document {
  querySelector(selector: string): HTMLCanvasElement | null;
  body: {
    appendChild(element: HTMLCanvasElement): void;
  };
  createElement(tagName: string): HTMLCanvasElement;
}

export interface Window {
  innerWidth: number;
  innerHeight: number;
  addEventListener(event: string, handler: () => void): void;
}