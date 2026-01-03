import {
	Controls,
	MOUSE,
	Quaternion,
	Spherical,
	TOUCH,
	Vector2,
	Vector3,
	Plane,
	Ray,
	MathUtils,
} from "../../../three.ts";

/**
 * Fires when the camera has been transformed by the controls.
 *
 * @event OrbitControls#change
 * @type {Object}
 */
const _changeEvent = { type: "change" };

/**
 * Fires when an interaction was initiated.
 *
 * @event OrbitControls#start
 * @type {Object}
 */
const _startEvent = { type: "start" };

/**
 * Fires when an interaction has finished.
 *
 * @event OrbitControls#end
 * @type {Object}
 */
const _endEvent = { type: "end" };

const _ray = new Ray();
const _plane = new Plane();
const _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);

const _v = new Vector3();
const _twoPI = 2 * Math.PI;

const _STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6,
};
const _EPS = 0.000001;

/**
 * Orbit controls allow the camera to orbit around a target.
 *
 * OrbitControls performs orbiting, dollying (zooming), and panning. Unlike TrackballControls,
 * it maintains the "up" direction `object.up` (+Y by default).
 *
 * - Orbit: Left mouse / touch: one-finger move.
 * - Zoom: Middle mouse, or mousewheel / touch: two-finger spread or squish.
 * - Pan: Right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move.
 *
 * @augments Controls
 */
class OrbitControls extends Controls {
	/**
	 * Constructs a new controls instance.
	 *
	 * @param {Object3D} object - The object that is managed by the controls.
	 * @param {?HTMLElement} domElement - The HTML element used for event listeners.
	 */
	constructor(object: any, domElement: any = null) {
		super(object, domElement);

		this.state = _STATE.NONE;

		/**
		 * The focus point of the controls, the `object` orbits around this.
		 * It can be updated manually at any point to change the focus of the controls.
		 *
		 * @type {Vector3}
		 */
		this.target = new Vector3();

		/**
		 * The focus point of the `minTargetRadius` and `maxTargetRadius` limits.
		 * It can be updated manually at any point to change the center of interest
		 * for the `target`.
		 *
		 * @type {Vector3}
		 */
		this.cursor = new Vector3();

		/**
		 * How far you can dolly in (perspective camera only).
		 *
		 * @type {number}
		 * @default 0
		 */
		this.minDistance = 0;

		/**
		 * How far you can dolly out (perspective camera only).
		 *
		 * @type {number}
		 * @default Infinity
		 */
		this.maxDistance = Infinity;

		/**
		 * How far you can zoom in (orthographic camera only).
		 *
		 * @type {number}
		 * @default 0
		 */
		this.minZoom = 0;

		/**
		 * How far you can zoom out (orthographic camera only).
		 *
		 * @type {number}
		 * @default Infinity
		 */
		this.maxZoom = Infinity;

		/**
		 * How close you can get the target to the 3D `cursor`.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.minTargetRadius = 0;

		/**
		 * How far you can move the target from the 3D `cursor`.
		 *
		 * @type {number}
		 * @default Infinity
		 */
		this.maxTargetRadius = Infinity;

		/**
		 * How far you can orbit vertically, lower limit. Range is `[0, Math.PI]` radians.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.minPolarAngle = 0;

		/**
		 * How far you can orbit vertically, upper limit. Range is `[0, Math.PI]` radians.
		 *
		 * @type {number}
		 * @default Math.PI
		 */
		this.maxPolarAngle = Math.PI;

		/**
		 * How far you can orbit horizontally, lower limit. If set, the interval `[ min, max ]`
		 * must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		 *
		 * @type {number}
		 * @default -Infinity
		 */
		this.minAzimuthAngle = -Infinity;

		/**
		 * How far you can orbit horizontally, upper limit. If set, the interval `[ min, max ]`
		 * must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		 *
		 * @type {number}
		 * @default Infinity
		 */
		this.maxAzimuthAngle = Infinity;

		/**
		 * Set to `true` to enable damping (inertia), which can be used to give a sense of weight
		 * to the controls. Note that if this is enabled, you must call `update()` in your animation
		 * loop.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.enableDamping = false;

		/**
		 * The damping inertia used if `enableDamping` is set to `true`.
		 *
		 * Note that for this to work, you must call `update()` in your animation loop.
		 *
		 * @type {number}
		 * @default 0.05
		 */
		this.dampingFactor = 0.05;

		/**
		 * Enable or disable zooming (dollying) of the camera.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.enableZoom = true;

		/**
		 * Speed of zooming / dollying.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.zoomSpeed = 1.0;

		/**
		 * Enable or disable horizontal and vertical rotation of the camera.
		 *
		 * Note that it is possible to disable a single axis by setting the min and max of the
		 * `minPolarAngle` or `minAzimuthAngle` to the same value, which will cause the vertical
		 * or horizontal rotation to be fixed at that value.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.enableRotate = true;

		/**
		 * Speed of rotation.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.rotateSpeed = 1.0;

		/**
		 * How fast to rotate the camera when the keyboard is used.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.keyRotateSpeed = 1.0;

		/**
		 * Enable or disable camera panning.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.enablePan = true;

		/**
		 * Speed of panning.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.panSpeed = 1.0;

		/**
		 * Defines how the camera's position is translated when panning. If `true`, the camera pans
		 * in screen space. Otherwise, the camera pans in the plane orthogonal to the camera's up
		 * direction.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.screenSpacePanning = true;

		/**
		 * How fast to pan the camera when the keyboard is used in pixels per keypress.
		 *
		 * @type {number}
		 * @default 7
		 */
		this.keyPanSpeed = 7.0;

		/**
		 * Setting this property to `true` allows to zoom to the cursor's position.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.zoomToCursor = false;

		/**
		 * Set to true to automatically rotate around the target
		 *
		 * Note that if this is enabled, you must call `update()` in your animation loop.
		 * If you want the auto-rotate speed to be independent of the frame rate (the refresh
		 * rate of the display), you must pass the time `deltaTime`, in seconds, to `update()`.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.autoRotate = false;

		/**
		 * How fast to rotate around the target if `autoRotate` is `true`. The default equates to 30 seconds
		 * per orbit at 60fps.
		 *
		 * Note that if `autoRotate` is enabled, you must call `update()` in your animation loop.
		 *
		 * @type {number}
		 * @default 2
		 */
		this.autoRotateSpeed = 2.0;

		/**
		 * This object contains references to the keycodes for controlling camera panning.
		 *
		 * @type {Object}
		 */
		this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown",
		};

		/**
		 * This object contains references to the mouse actions used by the controls.
		 *
		 * @type {Object}
		 */
		this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

		/**
		 * This object contains references to the touch actions used by the controls.
		 *
		 * @type {Object}
		 */
		this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

		/**
		 * Used internally by `saveState()` and `reset()`.
		 *
		 * @type {Vector3}
		 */
		this.target0 = this.target.clone();

		/**
		 * Used internally by `saveState()` and `reset()`.
		 *
		 * @type {Vector3}
		 */
		this.position0 = this.object.position.clone();

		/**
		 * Used internally by `saveState()` and `reset()`.
		 *
		 * @type {number}
		 */
		this.zoom0 = this.object.zoom;

		// the target DOM element for key events
		this._domElementKeyEvents = null;

		// internals

		this._lastPosition = new Vector3();
		this._lastQuaternion = new Quaternion();
		this._lastTargetPosition = new Vector3();

		// so camera.up is the orbit axis
		this._quat = new Quaternion().setFromUnitVectors(
			object.up,
			new Vector3(0, 1, 0),
		);
		this._quatInverse = this._quat.clone().invert();

		// current position in spherical coordinates
		this._spherical = new Spherical();
		this._sphericalDelta = new Spherical();

		this._scale = 1;
		this._panOffset = new Vector3();

		this._rotateStart = new Vector2();
		this._rotateEnd = new Vector2();
		this._rotateDelta = new Vector2();

		this._panStart = new Vector2();
		this._panEnd = new Vector2();
		this._panDelta = new Vector2();

		this._dollyStart = new Vector2();
		this._dollyEnd = new Vector2();
		this._dollyDelta = new Vector2();

		this._dollyDirection = new Vector3();
		this._mouse = new Vector2();
		this._performCursorZoom = false;

		this._pointers = [];
		this._pointerPositions = {};

		this._controlActive = false;

		// event listeners

		this._onPointerMove = onPointerMove.bind(this);
		this._onPointerDown = onPointerDown.bind(this);
		this._onPointerUp = onPointerUp.bind(this);
		this._onContextMenu = onContextMenu.bind(this);
		this._onMouseWheel = onMouseWheel.bind(this);
		this._onKeyDown = onKeyDown.bind(this);

		this._onTouchStart = onTouchStart.bind(this);
		this._onTouchMove = onTouchMove.bind(this);

		this._onMouseDown = onMouseDown.bind(this);
		this._onMouseMove = onMouseMove.bind(this);

		this._interceptControlDown = interceptControlDown.bind(this);
		this._interceptControlUp = interceptControlUp.bind(this);

		if (this.domElement !== null) {
			this.connect(this.domElement);
		}

		this.update();
	}

	connect(element: any) {
		super.connect(element);

		this.domElement.addEventListener("pointerdown", this._onPointerDown);
		this.domElement.addEventListener("pointercancel", this._onPointerUp);

		this.domElement.addEventListener("contextmenu", this._onContextMenu);
		this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });

		const document = this.domElement.getRootNode();
		document.addEventListener("keydown", this._interceptControlDown, {
			passive: true,
			capture: true,
		});

		this.domElement.style.touchAction = "none";
	}

	disconnect() {
		this.domElement.removeEventListener("pointerdown", this._onPointerDown);
		this.domElement.removeEventListener("pointermove", this._onPointerMove);
		this.domElement.removeEventListener("pointerup", this._onPointerUp);
		this.domElement.removeEventListener("pointercancel", this._onPointerUp);

		this.domElement.removeEventListener("wheel", this._onMouseWheel);
		this.domElement.removeEventListener("contextmenu", this._onContextMenu);

		this.stopListenToKeyEvents();

		const document = this.domElement.getRootNode();
		document.removeEventListener("keydown", this._interceptControlDown, {
			capture: true,
		});

		this.domElement.style.touchAction = "auto";
	}

	dispose() {
		this.disconnect();
	}

	getPolarAngle() {
		return this._spherical.phi;
	}

	getAzimuthalAngle() {
		return this._spherical.theta;
	}

	getDistance() {
		return this.object.position.distanceTo(this.target);
	}

	listenToKeyEvents(domElement: any) {
		domElement.addEventListener("keydown", this._onKeyDown);
		this._domElementKeyEvents = domElement;
	}

	stopListenToKeyEvents() {
		if (this._domElementKeyEvents !== null) {
			this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
			this._domElementKeyEvents = null;
		}
	}

	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}

	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();
		this.dispatchEvent(_changeEvent);

		this.update();

		this.state = _STATE.NONE;
	}

	update(deltaTime: any = null) {
		const position = this.object.position;

		_v.copy(position).sub(this.target);

		_v.applyQuaternion(this._quat);

		this._spherical.setFromVector3(_v);

		if (this.autoRotate && this.state === _STATE.NONE) {
			this._rotateLeft(this._getAutoRotationAngle(deltaTime));
		}

		if (this.enableDamping) {
			this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
			this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
		} else {
			this._spherical.theta += this._sphericalDelta.theta;
			this._spherical.phi += this._sphericalDelta.phi;
		}

		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;

		if (isFinite(min) && isFinite(max)) {
			if (min < -Math.PI) min += _twoPI;
			else if (min > Math.PI) min -= _twoPI;

			if (max < -Math.PI) max += _twoPI;
			else if (max > Math.PI) max -= _twoPI;

			if (min <= max) {
				this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
			} else {
				this._spherical.theta =
					this._spherical.theta > (min + max) / 2
						? Math.max(min, this._spherical.theta)
						: Math.min(max, this._spherical.theta);
			}
		}

		this._spherical.phi = Math.max(
			this.minPolarAngle,
			Math.min(this.maxPolarAngle, this._spherical.phi),
		);

		this._spherical.makeSafe();

		if (this.enableDamping === true) {
			this.target.addScaledVector(this._panOffset, this.dampingFactor);
		} else {
			this.target.add(this._panOffset);
		}

		this.target.sub(this.cursor);
		this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
		this.target.add(this.cursor);

		let zoomChanged = false;

		if (
			(this.zoomToCursor && this._performCursorZoom) ||
			this.object.isOrthographicCamera
		) {
			this._spherical.radius = this._clampDistance(this._spherical.radius);
		} else {
			const prevRadius = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
			zoomChanged = prevRadius != this._spherical.radius;
		}

		_v.setFromSpherical(this._spherical);

		_v.applyQuaternion(this._quatInverse);

		position.copy(this.target).add(_v);

		this.object.lookAt(this.target);

		if (this.enableDamping === true) {
			this._sphericalDelta.theta *= 1 - this.dampingFactor;
			this._sphericalDelta.phi *= 1 - this.dampingFactor;

			this._panOffset.multiplyScalar(1 - this.dampingFactor);
		} else {
			this._sphericalDelta.set(0, 0, 0);

			this._panOffset.set(0, 0, 0);
		}

		if (this.zoomToCursor && this._performCursorZoom) {
			let newRadius = null;
			if (this.object.isPerspectiveCamera) {
				const prevRadius = _v.length();
				newRadius = this._clampDistance(prevRadius * this._scale);

				const radiusDelta = prevRadius - newRadius;
				this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
				this.object.updateMatrixWorld();

				zoomChanged = !!radiusDelta;
			} else if (this.object.isOrthographicCamera) {
				const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseBefore.unproject(this.object);

				const prevZoom = this.object.zoom;
				this.object.zoom = Math.max(
					this.minZoom,
					Math.min(this.maxZoom, this.object.zoom / this._scale),
				);
				this.object.updateProjectionMatrix();

				zoomChanged = prevZoom !== this.object.zoom;

				const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseAfter.unproject(this.object);

				this.object.position.sub(mouseAfter).add(mouseBefore);
				this.object.updateMatrixWorld();

				newRadius = _v.length();
			} else {
				console.warn(
					"WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.",
				);
				this.zoomToCursor = false;
			}

			if (newRadius !== null) {
				if (this.screenSpacePanning) {
					this.target.set(0, 0, -1)
						.transformDirection(this.object.matrix)
						.multiplyScalar(newRadius)
						.add(this.object.position);
				} else {
					_ray.origin.copy(this.object.position);
					_ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);

					if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) {
						this.object.lookAt(this.target);
					} else {
						_plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
						_ray.intersectPlane(_plane, this.target);
					}
				}
			}
		} else if (this.object.isOrthographicCamera) {
			const prevZoom = this.object.zoom;
			this.object.zoom = Math.max(
				this.minZoom,
				Math.min(this.maxZoom, this.object.zoom / this._scale),
			);

			if (prevZoom !== this.object.zoom) {
				this.object.updateProjectionMatrix();
				zoomChanged = true;
			}
		}

		this._scale = 1;
		this._performCursorZoom = false;

		if (
			zoomChanged ||
			this._lastPosition.distanceToSquared(this.object.position) > _EPS ||
			8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS ||
			this._lastTargetPosition.distanceToSquared(this.target) > _EPS
		) {
			this.dispatchEvent(_changeEvent);

			this._lastPosition.copy(this.object.position);
			this._lastQuaternion.copy(this.object.quaternion);
			this._lastTargetPosition.copy(this.target);

			return true;
		}

		return false;
	}

	_getAutoRotationAngle(deltaTime: any) {
		if (deltaTime !== null) {
			return (_twoPI / 60 * this.autoRotateSpeed) * deltaTime;
		} else {
			return (_twoPI / 60 / 60) * this.autoRotateSpeed;
		}
	}

	_getZoomScale(delta: any) {
		const normalizedDelta = Math.abs(delta * 0.01);
		return Math.pow(0.95, this.zoomSpeed * normalizedDelta);
	}

	_rotateLeft(angle: any) {
		this._sphericalDelta.theta -= angle;
	}

	_rotateUp(angle: any) {
		this._sphericalDelta.phi -= angle;
	}

	_panLeft(distance: any, objectMatrix: any) {
		_v.setFromMatrixColumn(objectMatrix, 0);
		_v.multiplyScalar(-distance);

		this._panOffset.add(_v);
	}

	_panUp(distance: any, objectMatrix: any) {
		if (this.screenSpacePanning === true) {
			_v.setFromMatrixColumn(objectMatrix, 1);
		} else {
			_v.setFromMatrixColumn(objectMatrix, 0);
			_v.crossVectors(this.object.up, _v);
		}

		_v.multiplyScalar(distance);

		this._panOffset.add(_v);
	}

	_pan(deltaX: any, deltaY: any) {
		const element = this.domElement;

		if (this.object.isPerspectiveCamera) {
			const position = this.object.position;
			_v.copy(position).sub(this.target);
			let targetDistance = _v.length();

			targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);

			this._panLeft(
				(2 * deltaX * targetDistance) / element.clientHeight,
				this.object.matrix,
			);
			this._panUp(
				(2 * deltaY * targetDistance) / element.clientHeight,
				this.object.matrix,
			);
		} else if (this.object.isOrthographicCamera) {
			this._panLeft(
				(deltaX * (this.object.right - this.object.left)) /
					this.object.zoom /
					element.clientWidth,
				this.object.matrix,
			);
			this._panUp(
				(deltaY * (this.object.top - this.object.bottom)) /
					this.object.zoom /
					element.clientHeight,
				this.object.matrix,
			);
		} else {
			console.warn(
				"WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.",
			);
			this.enablePan = false;
		}
	}

	_dollyOut(dollyScale: any) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
			this._scale /= dollyScale;
		} else {
			console.warn(
				"WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.",
			);
			this.enableZoom = false;
		}
	}

	_dollyIn(dollyScale: any) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) {
			this._scale *= dollyScale;
		} else {
			console.warn(
				"WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.",
			);
			this.enableZoom = false;
		}
	}

	_updateZoomParameters(x: any, y: any) {
		if (!this.zoomToCursor) {
			return;
		}

		this._performCursorZoom = true;

		const rect = this.domElement.getBoundingClientRect();
		const dx = x - rect.left;
		const dy = y - rect.top;
		const w = rect.width;
		const h = rect.height;

		this._mouse.x = (dx / w) * 2 - 1;
		this._mouse.y = -(dy / h) * 2 + 1;

		this._dollyDirection
			.set(this._mouse.x, this._mouse.y, 1)
			.unproject(this.object)
			.sub(this.object.position)
			.normalize();
	}

	_clampDistance(dist: any) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
	}

	_handleMouseDownRotate(event: any) {
		this._rotateStart.set(event.clientX, event.clientY);
	}

	_handleMouseDownDolly(event: any) {
		this._updateZoomParameters(event.clientX, event.clientY);
		this._dollyStart.set(event.clientX, event.clientY);
	}

	_handleMouseDownPan(event: any) {
		this._panStart.set(event.clientX, event.clientY);
	}

	_handleMouseMoveRotate(event: any) {
		this._rotateEnd.set(event.clientX, event.clientY);

		this._rotateDelta
			.subVectors(this._rotateEnd, this._rotateStart)
			.multiplyScalar(this.rotateSpeed);

		const element = this.domElement;

		this._rotateLeft((_twoPI * this._rotateDelta.x) / element.clientHeight);

		this._rotateUp((_twoPI * this._rotateDelta.y) / element.clientHeight);

		this._rotateStart.copy(this._rotateEnd);

		this.update();
	}

	_handleMouseMoveDolly(event: any) {
		this._dollyEnd.set(event.clientX, event.clientY);

		this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);

		if (this._dollyDelta.y > 0) {
			this._dollyOut(this._getZoomScale(this._dollyDelta.y));
		} else if (this._dollyDelta.y < 0) {
			this._dollyIn(this._getZoomScale(this._dollyDelta.y));
		}

		this._dollyStart.copy(this._dollyEnd);

		this.update();
	}

	_handleMouseMovePan(event: any) {
		this._panEnd.set(event.clientX, event.clientY);

		this._panDelta
			.subVectors(this._panEnd, this._panStart)
			.multiplyScalar(this.panSpeed);

		this._pan(this._panDelta.x, this._panDelta.y);

		this._panStart.copy(this._panEnd);

		this.update();
	}

	_handleMouseWheel(event: any) {
		this._updateZoomParameters(event.clientX, event.clientY);

		if (event.deltaY < 0) {
			this._dollyIn(this._getZoomScale(event.deltaY));
		} else if (event.deltaY > 0) {
			this._dollyOut(this._getZoomScale(event.deltaY));
		}

		this.update();
	}

	_handleKeyDown(event: any) {
		let needsUpdate = false;

		switch (event.code) {
			case this.keys.UP:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) {
						this._rotateUp((_twoPI * this.keyRotateSpeed) / this.domElement.clientHeight);
					}
				} else {
					if (this.enablePan) {
						this._pan(0, this.keyPanSpeed);
					}
				}

				needsUpdate = true;
				break;

			case this.keys.BOTTOM:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) {
						this._rotateUp((-_twoPI * this.keyRotateSpeed) / this.domElement.clientHeight);
					}
				} else {
					if (this.enablePan) {
						this._pan(0, -this.keyPanSpeed);
					}
				}

				needsUpdate = true;
				break;

			case this.keys.LEFT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) {
						this._rotateLeft((_twoPI * this.keyRotateSpeed) / this.domElement.clientHeight);
					}
				} else {
					if (this.enablePan) {
						this._pan(this.keyPanSpeed, 0);
					}
				}

				needsUpdate = true;
				break;

			case this.keys.RIGHT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) {
						this._rotateLeft((-_twoPI * this.keyRotateSpeed) / this.domElement.clientHeight);
					}
				} else {
					if (this.enablePan) {
						this._pan(-this.keyPanSpeed, 0);
					}
				}

				needsUpdate = true;
				break;
		}

		if (needsUpdate) {
			event.preventDefault();

			this.update();
		}
	}

	_handleTouchStartRotate(event: any) {
		if (this._pointers.length === 1) {
			this._rotateStart.set(event.pageX, event.pageY);
		} else {
			const position = this._getSecondPointerPosition(event);

			const x = 0.5 * (event.pageX + position.x);
			const y = 0.5 * (event.pageY + position.y);

			this._rotateStart.set(x, y);
		}
	}

	_handleTouchStartPan(event: any) {
		if (this._pointers.length === 1) {
			this._panStart.set(event.pageX, event.pageY);
		} else {
			const position = this._getSecondPointerPosition(event);

			const x = 0.5 * (event.pageX + position.x);
			const y = 0.5 * (event.pageY + position.y);

			this._panStart.set(x, y);
		}
	}

	_handleTouchStartDolly(event: any) {
		const position = this._getSecondPointerPosition(event);

		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;

		const distance = Math.sqrt(dx * dx + dy * dy);

		this._dollyStart.set(0, distance);
	}

	_handleTouchStartDollyPan(event: any) {
		if (this.enableZoom) this._handleTouchStartDolly(event);

		if (this.enablePan) this._handleTouchStartPan(event);
	}

	_handleTouchStartDollyRotate(event: any) {
		if (this.enableZoom) this._handleTouchStartDolly(event);

		if (this.enableRotate) this._handleTouchStartRotate(event);
	}

	_handleTouchMoveRotate(event: any) {
		if (this._pointers.length == 1) {
			this._rotateEnd.set(event.pageX, event.pageY);
		} else {
			const position = this._getSecondPointerPosition(event);

			const x = 0.5 * (event.pageX + position.x);
			const y = 0.5 * (event.pageY + position.y);

			this._rotateEnd.set(x, y);
		}

		this._rotateDelta
			.subVectors(this._rotateEnd, this._rotateStart)
			.multiplyScalar(this.rotateSpeed);

		const element = this.domElement;

		this._rotateLeft((_twoPI * this._rotateDelta.x) / element.clientHeight);

		this._rotateUp((_twoPI * this._rotateDelta.y) / element.clientHeight);

		this._rotateStart.copy(this._rotateEnd);
	}

	_handleTouchMovePan(event: any) {
		if (this._pointers.length === 1) {
			this._panEnd.set(event.pageX, event.pageY);
		} else {
			const position = this._getSecondPointerPosition(event);

			const x = 0.5 * (event.pageX + position.x);
			const y = 0.5 * (event.pageY + position.y);

			this._panEnd.set(x, y);
		}

		this._panDelta
			.subVectors(this._panEnd, this._panStart)
			.multiplyScalar(this.panSpeed);

		this._pan(this._panDelta.x, this._panDelta.y);

		this._panStart.copy(this._panEnd);
	}

	_handleTouchMoveDolly(event: any) {
		const position = this._getSecondPointerPosition(event);

		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;

		const distance = Math.sqrt(dx * dx + dy * dy);

		this._dollyEnd.set(0, distance);

		this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed));

		this._dollyOut(this._dollyDelta.y);

		this._dollyStart.copy(this._dollyEnd);

		const centerX = (event.pageX + position.x) * 0.5;
		const centerY = (event.pageY + position.y) * 0.5;

		this._updateZoomParameters(centerX, centerY);
	}

	_handleTouchMoveDollyPan(event: any) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);

		if (this.enablePan) this._handleTouchMovePan(event);
	}

	_handleTouchMoveDollyRotate(event: any) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);

		if (this.enableRotate) this._handleTouchMoveRotate(event);
	}

	_addPointer(event: any) {
		this._pointers.push(event.pointerId);
	}

	_removePointer(event: any) {
		delete this._pointerPositions[event.pointerId];

		for (let i = 0; i < this._pointers.length; i++) {
			if (this._pointers[i] == event.pointerId) {
				this._pointers.splice(i, 1);
				return;
			}
		}
	}

	_isTrackingPointer(event: any) {
		for (let i = 0; i < this._pointers.length; i++) {
			if (this._pointers[i] == event.pointerId) return true;
		}

		return false;
	}

	_trackPointer(event: any) {
		let position = this._pointerPositions[event.pointerId];

		if (position === undefined) {
			position = new Vector2();
			this._pointerPositions[event.pointerId] = position;
		}

		position.set(event.pageX, event.pageY);
	}

	_getSecondPointerPosition(event: any) {
		const pointerId =
			event.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];

		return this._pointerPositions[pointerId];
	}

	_customWheelEvent(event: any) {
		const mode = event.deltaMode;

		const newEvent: any = {
			clientX: event.clientX,
			clientY: event.clientY,
			deltaY: event.deltaY,
		};

		switch (mode) {
			case 1:
				newEvent.deltaY *= 16;
				break;

			case 2:
				newEvent.deltaY *= 100;
				break;
		}

		if (event.ctrlKey && !this._controlActive) {
			newEvent.deltaY *= 10;
		}

		return newEvent;
	}
}

function onPointerDown(this: any, event: any) {
	if (this.enabled === false) return;

	if (this._pointers.length === 0) {
		this.domElement.setPointerCapture(event.pointerId);

		this.domElement.addEventListener("pointermove", this._onPointerMove);
		this.domElement.addEventListener("pointerup", this._onPointerUp);
	}

	if (this._isTrackingPointer(event)) return;

	this._addPointer(event);

	if (event.pointerType === "touch") {
		this._onTouchStart(event);
	} else {
		this._onMouseDown(event);
	}
}

function onPointerMove(this: any, event: any) {
	if (this.enabled === false) return;

	if (event.pointerType === "touch") {
		this._onTouchMove(event);
	} else {
		this._onMouseMove(event);
	}
}

function onPointerUp(this: any, event: any) {
	this._removePointer(event);

	switch (this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(event.pointerId);

			this.domElement.removeEventListener("pointermove", this._onPointerMove);
			this.domElement.removeEventListener("pointerup", this._onPointerUp);

			this.dispatchEvent(_endEvent);

			this.state = _STATE.NONE;

			break;

		case 1:
			const pointerId = this._pointers[0];
			const position = this._pointerPositions[pointerId];

			this._onTouchStart({
				pointerId: pointerId,
				pageX: position.x,
				pageY: position.y,
			});

			break;
	}
}

function onMouseDown(this: any, event: any) {
	let mouseAction;

	switch (event.button) {
		case 0:
			mouseAction = this.mouseButtons.LEFT;
			break;

		case 1:
			mouseAction = this.mouseButtons.MIDDLE;
			break;

		case 2:
			mouseAction = this.mouseButtons.RIGHT;
			break;

		default:
			mouseAction = -1;
	}

	switch (mouseAction) {
		case MOUSE.DOLLY:
			if (this.enableZoom === false) return;

			this._handleMouseDownDolly(event);

			this.state = _STATE.DOLLY;

			break;

		case MOUSE.ROTATE:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enablePan === false) return;

				this._handleMouseDownPan(event);

				this.state = _STATE.PAN;
			} else {
				if (this.enableRotate === false) return;

				this._handleMouseDownRotate(event);

				this.state = _STATE.ROTATE;
			}

			break;

		case MOUSE.PAN:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enableRotate === false) return;

				this._handleMouseDownRotate(event);

				this.state = _STATE.ROTATE;
			} else {
				if (this.enablePan === false) return;

				this._handleMouseDownPan(event);

				this.state = _STATE.PAN;
			}

			break;

		default:
			this.state = _STATE.NONE;
	}

	if (this.state !== _STATE.NONE) {
		this.dispatchEvent(_startEvent);
	}
}

function onMouseMove(this: any, event: any) {
	switch (this.state) {
		case _STATE.ROTATE:
			if (this.enableRotate === false) return;

			this._handleMouseMoveRotate(event);

			break;

		case _STATE.DOLLY:
			if (this.enableZoom === false) return;

			this._handleMouseMoveDolly(event);

			break;

		case _STATE.PAN:
			if (this.enablePan === false) return;

			this._handleMouseMovePan(event);

			break;
	}
}

function onMouseWheel(this: any, event: any) {
	if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE)
		return;

	event.preventDefault();

	this.dispatchEvent(_startEvent);

	this._handleMouseWheel(this._customWheelEvent(event));

	this.dispatchEvent(_endEvent);
}

function onKeyDown(this: any, event: any) {
	if (this.enabled === false) return;

	this._handleKeyDown(event);
}

function onTouchStart(this: any, event: any) {
	this._trackPointer(event);

	switch (this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case TOUCH.ROTATE:
					if (this.enableRotate === false) return;

					this._handleTouchStartRotate(event);

					this.state = _STATE.TOUCH_ROTATE;

					break;

				case TOUCH.PAN:
					if (this.enablePan === false) return;

					this._handleTouchStartPan(event);

					this.state = _STATE.TOUCH_PAN;

					break;

				default:
					this.state = _STATE.NONE;
			}

			break;

		case 2:
			switch (this.touches.TWO) {
				case TOUCH.DOLLY_PAN:
					if (this.enableZoom === false && this.enablePan === false) return;

					this._handleTouchStartDollyPan(event);

					this.state = _STATE.TOUCH_DOLLY_PAN;

					break;

				case TOUCH.DOLLY_ROTATE:
					if (this.enableZoom === false && this.enableRotate === false) return;

					this._handleTouchStartDollyRotate(event);

					this.state = _STATE.TOUCH_DOLLY_ROTATE;

					break;

				default:
					this.state = _STATE.NONE;
			}

			break;

		default:
			this.state = _STATE.NONE;
	}

	if (this.state !== _STATE.NONE) {
		this.dispatchEvent(_startEvent);
	}
}

function onTouchMove(this: any, event: any) {
	this._trackPointer(event);

	switch (this.state) {
		case _STATE.TOUCH_ROTATE:
			if (this.enableRotate === false) return;

			this._handleTouchMoveRotate(event);

			this.update();

			break;

		case _STATE.TOUCH_PAN:
			if (this.enablePan === false) return;

			this._handleTouchMovePan(event);

			this.update();

			break;

		case _STATE.TOUCH_DOLLY_PAN:
			if (this.enableZoom === false && this.enablePan === false) return;

			this._handleTouchMoveDollyPan(event);

			this.update();

			break;

		case _STATE.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === false && this.enableRotate === false) return;

			this._handleTouchMoveDollyRotate(event);

			this.update();

			break;

		default:
			this.state = _STATE.NONE;
	}
}

function onContextMenu(this: any, event: any) {
	if (this.enabled === false) return;

	event.preventDefault();
}

function interceptControlDown(this: any, event: any) {
	if (event.key === "Control") {
		this._controlActive = true;

		const document = this.domElement.getRootNode();

		document.addEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true,
		});
	}
}

function interceptControlUp(this: any, event: any) {
	if (event.key === "Control") {
		this._controlActive = false;

		const document = this.domElement.getRootNode();

		document.removeEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true,
		});
	}
}

export { OrbitControls };
