/**
 * Matrix math utilities for WebGL transformations
 */

/**
 * Create an identity matrix
 */
export function identity(): Float32Array {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

/**
 * Create a translation matrix
 */
export function translate(
  x: number,
  y: number,
  z: number
): Float32Array {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

/**
 * Create a scale matrix
 */
export function scale(x: number, y: number, z: number): Float32Array {
  const m = identity();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
}

/**
 * Create a rotation matrix around X axis (in radians)
 */
export function rotateX(radians: number): Float32Array {
  const m = identity();
  const c = Math.cos(radians);
  const s = Math.sin(radians);

  m[5] = c;
  m[6] = s;
  m[9] = -s;
  m[10] = c;

  return m;
}

/**
 * Create a rotation matrix around Y axis (in radians)
 */
export function rotateY(radians: number): Float32Array {
  const m = identity();
  const c = Math.cos(radians);
  const s = Math.sin(radians);

  m[0] = c;
  m[2] = -s;
  m[8] = s;
  m[10] = c;

  return m;
}

/**
 * Create a rotation matrix around Z axis (in radians)
 */
export function rotateZ(radians: number): Float32Array {
  const m = identity();
  const c = Math.cos(radians);
  const s = Math.sin(radians);

  m[0] = c;
  m[1] = s;
  m[4] = -s;
  m[5] = c;

  return m;
}

/**
 * Multiply two 4x4 matrices
 */
export function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] = 0;
      for (let k = 0; k < 4; k++) {
        result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
      }
    }
  }

  return result;
}

/**
 * Compute the inverse of a 4x4 matrix
 */
export function inverse(m: Float32Array): Float32Array {
  const inv = new Float32Array(16);
  const m00 = m[0],
    m01 = m[1],
    m02 = m[2],
    m03 = m[3];
  const m10 = m[4],
    m11 = m[5],
    m12 = m[6],
    m13 = m[7];
  const m20 = m[8],
    m21 = m[9],
    m22 = m[10],
    m23 = m[11];
  const m30 = m[12],
    m31 = m[13],
    m32 = m[14],
    m33 = m[15];

  const b00 = m00 * m11 - m01 * m10;
  const b01 = m00 * m12 - m02 * m10;
  const b02 = m00 * m13 - m03 * m10;
  const b03 = m01 * m12 - m02 * m11;
  const b04 = m01 * m13 - m03 * m11;
  const b05 = m02 * m13 - m03 * m12;
  const b06 = m20 * m31 - m21 * m30;
  const b07 = m20 * m32 - m22 * m30;
  const b08 = m20 * m33 - m23 * m30;
  const b09 = m21 * m32 - m22 * m31;
  const b10 = m21 * m33 - m23 * m31;
  const b11 = m22 * m33 - m23 * m32;

  let det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return identity();
  }

  det = 1.0 / det;

  inv[0] = (m11 * b11 - m12 * b10 + m13 * b09) * det;
  inv[1] = (m02 * b10 - m01 * b11 - m03 * b09) * det;
  inv[2] = (m31 * b05 - m32 * b04 + m33 * b03) * det;
  inv[3] = (m12 * b04 - m11 * b05 - m13 * b03) * det;
  inv[4] = (m12 * b08 - m10 * b11 - m13 * b07) * det;
  inv[5] = (m00 * b11 - m02 * b08 + m03 * b07) * det;
  inv[6] = (m32 * b02 - m30 * b05 - m33 * b01) * det;
  inv[7] = (m10 * b05 - m12 * b02 + m13 * b01) * det;
  inv[8] = (m10 * b10 - m11 * b08 + m13 * b06) * det;
  inv[9] = (m01 * b08 - m00 * b10 - m03 * b06) * det;
  inv[10] = (m30 * b04 - m31 * b02 + m33 * b00) * det;
  inv[11] = (m11 * b02 - m10 * b04 - m13 * b00) * det;
  inv[12] = (m11 * b07 - m10 * b09 - m12 * b06) * det;
  inv[13] = (m00 * b09 - m01 * b07 + m02 * b06) * det;
  inv[14] = (m31 * b01 - m30 * b03 - m32 * b00) * det;
  inv[15] = (m10 * b03 - m11 * b01 + m12 * b00) * det;

  return inv;
}

/**
 * Transpose a 4x4 matrix
 */
export function transpose(m: Float32Array): Float32Array {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[j * 4 + i] = m[i * 4 + j];
    }
  }

  return result;
}

/**
 * Extract upper-left 3x3 matrix from a 4x4 matrix for normal transformation
 */
export function normalMatrix(m: Float32Array): Float32Array {
  const inv = inverse(m);
  const transposed = transpose(inv);

  // Extract 3x3 part
  const result = new Float32Array(9);
  result[0] = transposed[0];
  result[1] = transposed[1];
  result[2] = transposed[2];
  result[3] = transposed[4];
  result[4] = transposed[5];
  result[5] = transposed[6];
  result[6] = transposed[8];
  result[7] = transposed[9];
  result[8] = transposed[10];

  return result;
}

/**
 * Create a model matrix from position, rotation (Euler angles), and scale
 */
export function modelMatrix(
  position: [number, number, number],
  rotation: [number, number, number],
  scaleVec: [number, number, number]
): Float32Array {
  // Create transformation matrices
  const t = translate(position[0], position[1], position[2]);
  const rx = rotateX(rotation[0]);
  const ry = rotateY(rotation[1]);
  const rz = rotateZ(rotation[2]);
  const s = scale(scaleVec[0], scaleVec[1], scaleVec[2]);

  // Combine: T * Rz * Ry * Rx * S
  let result = multiply(rz, rx);
  result = multiply(ry, result);
  result = multiply(result, s);
  result = multiply(t, result);

  return result;
}

/**
 * Create a view matrix from camera position, target, and up vector
 */
export function viewMatrix(
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number]
): Float32Array {
  const result = new Float32Array(16);

  // Forward vector (from target to eye, since we're looking at target)
  const zAxis = [
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  ];
  let len = Math.sqrt(
    zAxis[0] * zAxis[0] + zAxis[1] * zAxis[1] + zAxis[2] * zAxis[2]
  );
  zAxis[0] /= len;
  zAxis[1] /= len;
  zAxis[2] /= len;

  // Right vector (cross product of up and forward)
  const xAxis = [
    up[1] * zAxis[2] - up[2] * zAxis[1],
    up[2] * zAxis[0] - up[0] * zAxis[2],
    up[0] * zAxis[1] - up[1] * zAxis[0],
  ];
  len = Math.sqrt(xAxis[0] * xAxis[0] + xAxis[1] * xAxis[1] + xAxis[2] * xAxis[2]);
  xAxis[0] /= len;
  xAxis[1] /= len;
  xAxis[2] /= len;

  // Real up vector (cross product of forward and right)
  const yAxis = [
    zAxis[1] * xAxis[2] - zAxis[2] * xAxis[1],
    zAxis[2] * xAxis[0] - zAxis[0] * xAxis[2],
    zAxis[0] * xAxis[1] - zAxis[1] * xAxis[0],
  ];

  result[0] = xAxis[0];
  result[1] = yAxis[0];
  result[2] = zAxis[0];
  result[3] = 0;
  result[4] = xAxis[1];
  result[5] = yAxis[1];
  result[6] = zAxis[1];
  result[7] = 0;
  result[8] = xAxis[2];
  result[9] = yAxis[2];
  result[10] = zAxis[2];
  result[11] = 0;
  result[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  result[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  result[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  result[15] = 1;

  return result;
}

/**
 * Create a perspective projection matrix
 */
export function perspectiveMatrix(
  fovRadians: number,
  aspectRatio: number,
  near: number,
  far: number
): Float32Array {
  const result = new Float32Array(16);
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fovRadians);
  const rangeInv = 1.0 / (near - far);

  result[0] = f / aspectRatio;
  result[1] = 0;
  result[2] = 0;
  result[3] = 0;
  result[4] = 0;
  result[5] = f;
  result[6] = 0;
  result[7] = 0;
  result[8] = 0;
  result[9] = 0;
  result[10] = (near + far) * rangeInv;
  result[11] = -1;
  result[12] = 0;
  result[13] = 0;
  result[14] = near * far * rangeInv * 2;
  result[15] = 0;

  return result;
}

/**
 * Create an orthographic projection matrix
 */
export function orthographicMatrix(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number
): Float32Array {
  const result = new Float32Array(16);

  result[0] = 2 / (right - left);
  result[1] = 0;
  result[2] = 0;
  result[3] = 0;
  result[4] = 0;
  result[5] = 2 / (top - bottom);
  result[6] = 0;
  result[7] = 0;
  result[8] = 0;
  result[9] = 0;
  result[10] = 2 / (near - far);
  result[11] = 0;
  result[12] = (left + right) / (left - right);
  result[13] = (bottom + top) / (bottom - top);
  result[14] = (near + far) / (near - far);
  result[15] = 1;

  return result;
}

/**
 * Project a 3D world point to screen coordinates
 * Returns [screenX, screenY] or null if behind camera
 */
export function projectToScreen(
  worldPoint: [number, number, number],
  viewMatrix: Float32Array,
  projectionMatrix: Float32Array,
  screenWidth: number,
  screenHeight: number
): [number, number] | null {
  // Convert to homogeneous coordinates
  const point = [worldPoint[0], worldPoint[1], worldPoint[2], 1];

  // Transform by view matrix
  const viewPoint = new Float32Array(4);
  for (let i = 0; i < 4; i++) {
    viewPoint[i] = 0;
    for (let j = 0; j < 4; j++) {
      viewPoint[i] += viewMatrix[i * 4 + j] * point[j];
    }
  }

  // Transform by projection matrix
  const clipPoint = new Float32Array(4);
  for (let i = 0; i < 4; i++) {
    clipPoint[i] = 0;
    for (let j = 0; j < 4; j++) {
      clipPoint[i] += projectionMatrix[i * 4 + j] * viewPoint[j];
    }
  }

  // Check if point is behind camera (w < 0 in clip space)
  if (clipPoint[3] <= 0) {
    return null; // Behind camera, don't render
  }

  // Perspective divide
  const ndcX = clipPoint[0] / clipPoint[3];
  const ndcY = clipPoint[1] / clipPoint[3];

  // Convert NDC (-1 to 1) to screen coordinates (0 to width/height)
  const screenX = (ndcX + 1) * 0.5 * screenWidth;
  const screenY = (1 - ndcY) * 0.5 * screenHeight; // Flip Y axis

  return [screenX, screenY];
}
