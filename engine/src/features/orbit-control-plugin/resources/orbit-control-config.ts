/**
 * Configuration resource for OrbitControls
 * 
 * Stores all settings that control the behavior of the orbit controls system.
 * This resource is used by the OrbitControlSystem to manage camera movement,
 * including rotation, panning, zooming, and auto-rotation features.
 * 
 * All properties are optional and have sensible defaults suitable for most use cases.
 * 
 * @example
 * ```typescript
 * const config = new OrbitControlConfig({
 *   minDistance: 5,
 *   maxDistance: 50,
 *   autoRotate: true,
 *   dampingFactor: 0.08,
 * });
 * world.addResource("OrbitControlConfig", config);
 * ```
 */
export class OrbitControlConfig {
  /**
   * Master enable/disable for all orbit controls
   * @default true
   */
  enabled: boolean = true;

  /**
   * Enable inertia/damping effect for smooth deceleration after user input
   * @default true
   */
  enableDamping: boolean = true;

  /**
   * How quickly movement decelerates when damping is enabled (0-1)
   * - 0.05: Very smooth, takes longer to stop
   * - 0.1: Moderate smoothness
   * - 0.2: Quick stop with minimal inertia
   * @default 0.05
   */
  dampingFactor: number = 0.05;

  /**
   * Minimum distance the camera can zoom to (in world units)
   * @default 1
   */
  minDistance: number = 1;

  /**
   * Maximum distance the camera can zoom from the focal point (in world units)
   * @default 100
   */
  maxDistance: number = 100;

  /**
   * Minimum polar angle constraint (vertical rotation limit in radians)
   * - 0: Camera can rotate to look straight down
   * - Math.PI: Camera can rotate to look straight up
   * @default 0
   */
  minPolarAngle: number = 0;

  /**
   * Maximum polar angle constraint (vertical rotation limit in radians)
   * - 0: Camera locked at top
   * - Math.PI: Camera locked at bottom
   * Typically set to Math.PI to allow full hemisphere rotation
   * @default Math.PI
   */
  maxPolarAngle: number = Math.PI;

  /**
   * Minimum azimuth angle constraint (horizontal rotation limit in radians)
   * Set to -Infinity to disable constraint
   * @default -Infinity
   */
  minAzimuthAngle: number = -Infinity;

  /**
   * Maximum azimuth angle constraint (horizontal rotation limit in radians)
   * Set to Infinity to disable constraint
   * @default Infinity
   */
  maxAzimuthAngle: number = Infinity;

  /**
   * Rotation sensitivity multiplier
   * - 1.0: Default Three.js sensitivity
   * - 2.0: Twice as sensitive (faster rotation)
   * - 0.5: Half as sensitive (slower rotation)
   * @default 1.0
   */
  rotateSpeed: number = 1.0;

  /**
   * Panning sensitivity multiplier
   * - 1.0: Default sensitivity
   * - 2.0: Twice as sensitive
   * - 0.5: Half as sensitive
   * @default 1.0
   */
  panSpeed: number = 1.0;

  /**
   * Zoom sensitivity multiplier
   * - 1.0: Default sensitivity (mouse wheel delta scale)
   * - 2.0: Twice as sensitive (zoom 2x faster)
   * - 0.5: Half as sensitive (zoom 2x slower)
   * @default 1.0
   */
  zoomSpeed: number = 1.0;

  /**
   * Enable automatic camera rotation when user is not interacting
   * @default false
   */
  autoRotate: boolean = false;

  /**
   * Auto-rotation speed in degrees per second
   * - 2.0: Takes 180 seconds (3 minutes) for a full revolution
   * - 4.0: Takes 90 seconds for a full revolution
   * @default 2.0
   */
  autoRotateSpeed: number = 2.0;

  /**
   * Enable/disable panning (middle-click or right-click drag)
   * @default true
   */
  enablePan: boolean = true;

  /**
   * Enable/disable zooming (mouse wheel or pinch)
   * @default true
   */
  enableZoom: boolean = true;

  /**
   * Enable/disable rotation (left-click drag)
   * @default true
   */
  enableRotate: boolean = true;

  /**
   * Create a new OrbitControlConfig with optional partial configuration
   * 
   * @param partial - Optional object with properties to override defaults
   * 
   * @example
   * ```typescript
   * // Create with defaults
   * const config1 = new OrbitControlConfig();
   * 
   * // Create with custom values
   * const config2 = new OrbitControlConfig({
   *   rotateSpeed: 2.0,
   *   autoRotate: true,
   *   minDistance: 10,
   * });
   * ```
   */
  constructor(partial?: Partial<OrbitControlConfig>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
