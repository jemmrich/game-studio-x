/**
 * Mesh generation utilities for creating vertex data for different geometric primitives
 */

export interface MeshData {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

/**
 * Generate a box mesh with the given dimensions
 */
export function generateBoxMesh(
  width: number,
  height: number,
  depth: number,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  // Helper to add a face
  const addFace = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number],
    normal: [number, number, number],
  ) => {
    const startIdx = positions.length / 3;

    positions.push(...p1, ...p2, ...p3, ...p4);

    for (let i = 0; i < 4; i++) {
      normals.push(...normal);
    }

    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

    indices.push(
      startIdx,
      startIdx + 1,
      startIdx + 2,
      startIdx,
      startIdx + 2,
      startIdx + 3,
    );
  };

  // Front face
  addFace(
    [-w, -h, d],
    [w, -h, d],
    [w, h, d],
    [-w, h, d],
    [0, 0, 1],
  );

  // Back face
  addFace(
    [w, -h, -d],
    [-w, -h, -d],
    [-w, h, -d],
    [w, h, -d],
    [0, 0, -1],
  );

  // Right face
  addFace(
    [w, -h, d],
    [w, -h, -d],
    [w, h, -d],
    [w, h, d],
    [1, 0, 0],
  );

  // Left face
  addFace(
    [-w, -h, -d],
    [-w, -h, d],
    [-w, h, d],
    [-w, h, -d],
    [-1, 0, 0],
  );

  // Top face
  addFace(
    [-w, h, d],
    [w, h, d],
    [w, h, -d],
    [-w, h, -d],
    [0, 1, 0],
  );

  // Bottom face
  addFace(
    [-w, -h, -d],
    [w, -h, -d],
    [w, -h, d],
    [-w, -h, d],
    [0, -1, 0],
  );

  return { positions, normals, uvs, indices };
}

/**
 * Generate a sphere mesh using UV sphere algorithm
 */
export function generateSphereMesh(
  radius: number,
  segments: number,
  rings: number,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let ring = 0; ring <= rings; ring++) {
    const theta = (ring / rings) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let seg = 0; seg <= segments; seg++) {
      const phi = (seg / segments) * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = radius * cosPhi * sinTheta;
      const y = radius * cosTheta;
      const z = radius * sinPhi * sinTheta;

      positions.push(x, y, z);

      // Normal is the same as position for unit sphere, just normalized
      const length = Math.sqrt(x * x + y * y + z * z);
      normals.push(x / length, y / length, z / length);

      // UV coordinates
      uvs.push(seg / segments, ring / rings);
    }
  }

  // Generate indices
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const a = ring * (segments + 1) + seg;
      const b = a + segments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return { positions, normals, uvs, indices };
}

/**
 * Generate a cylinder mesh
 */
export function generateCylinderMesh(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfHeight = height / 2;

  // Generate vertices for top circle
  for (let seg = 0; seg <= segments; seg++) {
    const angle = (seg / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Top circle
    positions.push(radiusTop * cos, halfHeight, radiusTop * sin);
    normals.push(cos, 0, sin);
    uvs.push(seg / segments, 1);

    // Bottom circle
    positions.push(radiusBottom * cos, -halfHeight, radiusBottom * sin);
    normals.push(cos, 0, sin);
    uvs.push(seg / segments, 0);
  }

  // Generate indices for sides
  for (let seg = 0; seg < segments; seg++) {
    const a = seg * 2;
    const b = a + 1;
    const c = ((seg + 1) % (segments + 1)) * 2;
    const d = c + 1;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  // Generate top cap
  const topCapStart = positions.length / 3;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  for (let seg = 0; seg <= segments; seg++) {
    const angle = (seg / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    positions.push(radiusTop * cos, halfHeight, radiusTop * sin);
    normals.push(0, 1, 0);
    uvs.push(0.5 + 0.5 * cos, 0.5 + 0.5 * sin);
  }

  for (let seg = 0; seg < segments; seg++) {
    const a = topCapStart;
    const b = topCapStart + seg + 1;
    const c = topCapStart + seg + 2;
    indices.push(a, b, c);
  }

  // Generate bottom cap
  const bottomCapStart = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  for (let seg = 0; seg <= segments; seg++) {
    const angle = (seg / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    positions.push(radiusBottom * cos, -halfHeight, radiusBottom * sin);
    normals.push(0, -1, 0);
    uvs.push(0.5 + 0.5 * cos, 0.5 + 0.5 * sin);
  }

  for (let seg = 0; seg < segments; seg++) {
    const a = bottomCapStart;
    const b = bottomCapStart + seg + 2;
    const c = bottomCapStart + seg + 1;
    indices.push(a, b, c);
  }

  return { positions, normals, uvs, indices };
}

/**
 * Generate a plane mesh
 */
export function generatePlaneMesh(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const gridX = widthSegments + 1;
  const gridY = heightSegments + 1;

  // Generate vertices
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      const posX = (x / widthSegments - 0.5) * width;
      const posY = (y / heightSegments - 0.5) * height;
      const posZ = 0;

      positions.push(posX, posY, posZ);
      normals.push(0, 0, 1);
      uvs.push(x / widthSegments, y / heightSegments);
    }
  }

  // Generate indices
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * gridX + x;
      const b = a + gridX;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return { positions, normals, uvs, indices };
}

/**
 * Generate a cone mesh
 */
export function generateConeMesh(
  radius: number,
  height: number,
  segments: number,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfHeight = height / 2;

  // Add apex
  const apexIdx = 0;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  // Add base circle vertices
  for (let seg = 0; seg <= segments; seg++) {
    const angle = (seg / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    positions.push(radius * cos, -halfHeight, radius * sin);

    // Normal for cone side (simplified - should be calculated properly)
    const sideNormalLength = Math.sqrt(radius * radius + height * height);
    normals.push(
      (radius * cos) / sideNormalLength,
      height / sideNormalLength,
      (radius * sin) / sideNormalLength,
    );

    uvs.push(seg / segments, 1);
  }

  // Add base center
  const baseCenter = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  // Side faces
  for (let seg = 0; seg < segments; seg++) {
    const a = apexIdx;
    const b = 1 + seg;
    const c = 1 + seg + 1;

    indices.push(a, b, c);
  }

  // Base faces
  for (let seg = 0; seg < segments; seg++) {
    const a = baseCenter;
    const b = 1 + seg + 1;
    const c = 1 + seg;

    indices.push(a, b, c);
  }

  return { positions, normals, uvs, indices };
}
