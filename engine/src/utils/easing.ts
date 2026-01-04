/**
 * Easing function utilities for smooth transitions.
 * 
 * Easing functions control the acceleration and deceleration of transitions.
 * Common use cases:
 * - Fade in/out scenes
 * - Smooth camera pans
 * - Loading screen progress
 * - UI animations
 * 
 * Each function takes a normalized time value (0 to 1) and returns an eased value.
 */

/**
 * Type definition for easing functions.
 * Takes normalized time (0-1) and returns eased progress (0-1).
 */
export type EasingFunction = (t: number) => number;

/**
 * Linear easing: constant speed throughout.
 * t = t
 */
export const easeLinear: EasingFunction = (t: number): number => t;

/**
 * Quadratic easing in: slow start, fast end.
 * t = t²
 */
export const easeInQuad: EasingFunction = (t: number): number => t * t;

/**
 * Quadratic easing out: fast start, slow end.
 * t = 1 - (1-t)²
 */
export const easeOutQuad: EasingFunction = (t: number): number => 1 - (1 - t) * (1 - t);

/**
 * Quadratic easing in-out: slow start, fast middle, slow end.
 * Combines easeInQuad and easeOutQuad.
 */
export const easeInOutQuad: EasingFunction = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

/**
 * Cubic easing in: slow start, fast end.
 * t = t³
 */
export const easeInCubic: EasingFunction = (t: number): number => t * t * t;

/**
 * Cubic easing out: fast start, slow end.
 * t = 1 - (1-t)³
 */
export const easeOutCubic: EasingFunction = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Cubic easing in-out: slow start, fast middle, slow end.
 */
export const easeInOutCubic: EasingFunction = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Quartic easing in: very slow start.
 * t = t⁴
 */
export const easeInQuart: EasingFunction = (t: number): number => t * t * t * t;

/**
 * Quartic easing out: very slow end.
 * t = 1 - (1-t)⁴
 */
export const easeOutQuart: EasingFunction = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * Quartic easing in-out: slow start and end, fast middle.
 */
export const easeInOutQuart: EasingFunction = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

/**
 * Quintic easing in: extremely slow start.
 * t = t⁵
 */
export const easeInQuint: EasingFunction = (t: number): number => t * t * t * t * t;

/**
 * Quintic easing out: extremely slow end.
 * t = 1 - (1-t)⁵
 */
export const easeOutQuint: EasingFunction = (t: number): number => 1 - Math.pow(1 - t, 5);

/**
 * Quintic easing in-out: very smooth acceleration and deceleration.
 */
export const easeInOutQuint: EasingFunction = (t: number): number => {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
};

/**
 * Sine easing in: smooth slow start.
 * Uses sine wave for smooth acceleration.
 */
export const easeInSine: EasingFunction = (t: number): number => {
  return 1 - Math.cos((t * Math.PI) / 2);
};

/**
 * Sine easing out: smooth slow end.
 * Uses sine wave for smooth deceleration.
 */
export const easeOutSine: EasingFunction = (t: number): number => {
  return Math.sin((t * Math.PI) / 2);
};

/**
 * Sine easing in-out: smooth on both ends.
 * Creates a natural "ease" effect.
 */
export const easeInOutSine: EasingFunction = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

/**
 * Exponential easing in: very slow start, rapid acceleration.
 * Creates dramatic acceleration effect.
 */
export const easeInExpo: EasingFunction = (t: number): number => {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
};

/**
 * Exponential easing out: rapid start, very slow end.
 * Creates dramatic deceleration effect.
 */
export const easeOutExpo: EasingFunction = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Exponential easing in-out: dramatic acceleration and deceleration.
 */
export const easeInOutExpo: EasingFunction = (t: number): number => {
  return t === 0
    ? 0
    : t === 1
      ? 1
      : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/**
 * Circular easing in: slow start (circular arc).
 */
export const easeInCirc: EasingFunction = (t: number): number => {
  return 1 - Math.sqrt(1 - Math.pow(t, 2));
};

/**
 * Circular easing out: slow end (circular arc).
 */
export const easeOutCirc: EasingFunction = (t: number): number => {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
};

/**
 * Circular easing in-out: slow start and end.
 */
export const easeInOutCirc: EasingFunction = (t: number): number => {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
};

/**
 * Elastic easing in: elastic overshoot at start.
 * Creates a "bounce" effect at the beginning.
 */
export const easeInElastic: EasingFunction = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

/**
 * Elastic easing out: elastic overshoot at end.
 * Creates a "bounce" effect at the end.
 */
export const easeOutElastic: EasingFunction = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/**
 * Elastic easing in-out: elastic overshoot on both ends.
 */
export const easeInOutElastic: EasingFunction = (t: number): number => {
  const c5 = (2 * Math.PI) / 4.5;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

/**
 * Back easing in: slight overshoot going backwards before accelerating.
 * Creates anticipation effect.
 */
export const easeInBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};

/**
 * Back easing out: slight overshoot going forward after decelerating.
 * Creates follow-through effect.
 */
export const easeOutBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Back easing in-out: overshoot on both start and end.
 * Creates a "pull back" effect.
 */
export const easeInOutBack: EasingFunction = (t: number): number => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

/**
 * Bounce easing in: bouncing effect at start.
 * Creates multiple bounces before reaching target.
 */
export const easeInBounce: EasingFunction = (t: number): number => {
  return 1 - easeOutBounce(1 - t);
};

/**
 * Bounce easing out: bouncing effect at end.
 * Creates multiple bounces when arriving at target.
 */
export const easeOutBounce: EasingFunction = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

/**
 * Bounce easing in-out: bouncing effect on both ends.
 */
export const easeInOutBounce: EasingFunction = (t: number): number => {
  return t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;
};

/**
 * Get all available easing functions by name.
 * Useful for dynamic easing function selection.
 */
export const EASING_FUNCTIONS: Record<string, EasingFunction> = {
  // Linear
  linear: easeLinear,

  // Quadratic
  inQuad: easeInQuad,
  outQuad: easeOutQuad,
  inOutQuad: easeInOutQuad,

  // Cubic
  inCubic: easeInCubic,
  outCubic: easeOutCubic,
  inOutCubic: easeInOutCubic,

  // Quartic
  inQuart: easeInQuart,
  outQuart: easeOutQuart,
  inOutQuart: easeInOutQuart,

  // Quintic
  inQuint: easeInQuint,
  outQuint: easeOutQuint,
  inOutQuint: easeInOutQuint,

  // Sine
  inSine: easeInSine,
  outSine: easeOutSine,
  inOutSine: easeInOutSine,

  // Exponential
  inExpo: easeInExpo,
  outExpo: easeOutExpo,
  inOutExpo: easeInOutExpo,

  // Circular
  inCirc: easeInCirc,
  outCirc: easeOutCirc,
  inOutCirc: easeInOutCirc,

  // Elastic
  inElastic: easeInElastic,
  outElastic: easeOutElastic,
  inOutElastic: easeInOutElastic,

  // Back
  inBack: easeInBack,
  outBack: easeOutBack,
  inOutBack: easeInOutBack,

  // Bounce
  inBounce: easeInBounce,
  outBounce: easeOutBounce,
  inOutBounce: easeInOutBounce,
};
