import type { World } from "@engine/core/world.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import * as THREE from "three";
import { MissileGeometry } from "../components/missile-geometry.ts";

/**
 * MissileRenderSystem
 * Three.js based missile rendering
 * Renders missiles as small white dots (points) in the world
 */
export class MissileRenderSystem {
  private scene: THREE.Scene;
  private missileMeshes: Map<string, THREE.Points> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(world: World, _dt: number): void {
    // Query for entities with missile geometry
    const query = world.query(MissileGeometry, Transform);
    const entities = query.entities();

    const renderedMissiles = new Set<string>();

    for (const entity of entities) {
      const geometry = world.get<MissileGeometry>(entity, MissileGeometry);
      const transform = world.get<Transform>(entity, Transform);

      if (!geometry || !transform) continue;

      renderedMissiles.add(entity);

      // Create or reuse missile mesh
      let mesh = this.missileMeshes.get(entity);
      if (!mesh) {
        mesh = this.createMissileMesh(geometry);
        this.missileMeshes.set(entity, mesh);
        this.scene.add(mesh);
      }

      // Update mesh position and rotation from transform
      mesh.position.set(transform.position[0], transform.position[1], transform.position[2]);
      mesh.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
      mesh.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
    }

    // Remove meshes for missiles that no longer exist
    for (const [entityId, mesh] of this.missileMeshes.entries()) {
      if (!renderedMissiles.has(entityId)) {
        this.scene.remove(mesh);
        const geom = mesh.geometry;
        if (geom) geom.dispose();
        const mat = mesh.material;
        if (mat) {
          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose();
          } else {
            mat.dispose();
          }
        }
        this.missileMeshes.delete(entityId);
      }
    }
  }

  private createMissileMesh(geometry: MissileGeometry): THREE.Points {
    // Convert geometry points to Three.js BufferGeometry
    const points = geometry.getPoints().map(p => new THREE.Vector3(p.x, p.y, 0));

    const bufferGeom = new THREE.BufferGeometry().setFromPoints(points);

    // White point material for the dot
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.0, // Small size for dot
      sizeAttenuation: true,
    });

    return new THREE.Points(bufferGeom, material);
  }

  dispose(): void {
    for (const mesh of this.missileMeshes.values()) {
      const geom = mesh.geometry;
      if (geom) geom.dispose();
      const mat = mesh.material;
      if (mat) {
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose();
        } else {
          mat.dispose();
        }
      }
    }
    this.missileMeshes.clear();
  }
}
