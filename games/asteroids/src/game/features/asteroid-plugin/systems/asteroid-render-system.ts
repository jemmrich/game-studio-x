import type { World } from "@engine/core/world.ts";
import { AsteroidGeometry } from "../components/asteroid-geometry.ts";
import { AsteroidComponent } from "../components/asteroid.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { getCollisionRadius } from "../config/asteroid-size-config.ts";
import * as THREE from "three";

/**
 * AsteroidRenderSystem
 * Three.js based asteroid rendering
 * Renders asteroids as connected line geometry with bounding circles
 */
export class AsteroidRenderSystem {
  private scene: THREE.Scene;
  private asteroidMeshes: Map<string, THREE.Line> = new Map();
  private boundingCircles: Map<string, THREE.LineLoop> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Clear bounding circle and mesh for an entity (called when asteroid is destroyed)
   */
  clearEntityVisuals(entityId: string): void {
    // Clear bounding circle
    const circle = this.boundingCircles.get(entityId);
    if (circle) {
      this.scene.remove(circle);
      const geom = circle.geometry;
      if (geom) geom.dispose();
      const mat = circle.material;
      if (mat) {
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose();
        } else {
          mat.dispose();
        }
      }
      this.boundingCircles.delete(entityId);
    }

    // Clear mesh
    const mesh = this.asteroidMeshes.get(entityId);
    if (mesh) {
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
      this.asteroidMeshes.delete(entityId);
    }
  }

  update(world: World, _dt: number): void {
    // Query for entities with asteroid geometry
    const query = world.query(AsteroidGeometry, Transform, AsteroidComponent);
    const entities = query.entities();

    const renderedAsteroids = new Set<string>();

    // Process queried entities
    for (const entity of entities) {
      const geometry = world.get<AsteroidGeometry>(entity, AsteroidGeometry);
      const transform = world.get<Transform>(entity, Transform);
      const asteroid = world.get<AsteroidComponent>(entity, AsteroidComponent);

      if (!geometry || !transform || !asteroid) {
        continue;
      }

      renderedAsteroids.add(entity);

      this.renderAsteroid(world, entity, geometry, transform, asteroid);
    }

    // Cleanup old meshes and circles for asteroids that no longer exist
    this.cleanupRemovedAsteroids(renderedAsteroids);
  }

  private renderAsteroid(
    world: World,
    entity: string,
    geometry: AsteroidGeometry,
    transform: Transform,
    asteroid: AsteroidComponent
  ): void {
    // Create or reuse asteroid mesh
    let mesh = this.asteroidMeshes.get(entity);
    if (!mesh) {
      mesh = this.createAsteroidMesh(geometry);
      this.asteroidMeshes.set(entity, mesh);
      this.scene.add(mesh);

      // When creating a new mesh (new entity), also clear any old bounding circle
      // This prevents reusing circles from recycled entity IDs
      const oldCircle = this.boundingCircles.get(entity);
      if (oldCircle) {
        this.scene.remove(oldCircle);
        const geom = oldCircle.geometry;
        if (geom) geom.dispose();
        const mat = oldCircle.material;
        if (mat) {
          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose();
          } else {
            mat.dispose();
          }
        }
        this.boundingCircles.delete(entity);
      }
    }

    // Create or reuse bounding circle based on boundingSphereEnabled
    let circle = this.boundingCircles.get(entity);
    if (asteroid.boundingSphereEnabled) {
      if (!circle) {
        circle = this.createBoundingCircle(asteroid.sizeTier);
        this.boundingCircles.set(entity, circle);
        this.scene.add(circle);
      }
      // Update circle position only (collision radius is already in world space, don't scale it)
      circle.position.set(transform.position[0], transform.position[1], transform.position[2]);
    } else {
      // Remove circle if bounding sphere is disabled
      if (circle) {
        this.scene.remove(circle);
        const geom = circle.geometry;
        if (geom) geom.dispose();
        const mat = circle.material;
        if (mat) {
          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose();
          } else {
            mat.dispose();
          }
        }
        this.boundingCircles.delete(entity);
      }
    }

    // Update mesh position and rotation from transform
    mesh.position.set(transform.position[0], transform.position[1], transform.position[2]);
    mesh.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
    mesh.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
  }

  private cleanupRemovedAsteroids(renderedAsteroids: Set<string>): void {
    // Remove meshes for asteroids that no longer exist
    for (const [entityId, mesh] of this.asteroidMeshes.entries()) {
      if (!renderedAsteroids.has(entityId)) {
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
        this.asteroidMeshes.delete(entityId);
      }
    }

    // Remove circles for asteroids that no longer exist
    for (const [entityId, circle] of this.boundingCircles.entries()) {
      if (!renderedAsteroids.has(entityId)) {
        this.scene.remove(circle);
        const geom = circle.geometry;
        if (geom) geom.dispose();
        const mat = circle.material;
        if (mat) {
          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose();
          } else {
            mat.dispose();
          }
        }
        this.boundingCircles.delete(entityId);
      }
    }
  }

  private createAsteroidMesh(geometry: AsteroidGeometry): THREE.Line {
    // Convert geometry points to Three.js BufferGeometry
    const points = geometry.points.map((p) => new THREE.Vector3(p.x, p.y, 0));

    const bufferGeom = new THREE.BufferGeometry().setFromPoints(points);

    // White line material for asteroid outline - increased line width for visibility
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      fog: false,
    });

    const mesh = new THREE.Line(bufferGeom, material);
    return mesh;
  }

  private createBoundingCircle(sizeTier: 1 | 2 | 3): THREE.LineLoop {
    // Get collision radius for this asteroid size (automatically calculated)
    const collisionRadius = getCollisionRadius(sizeTier);

    // Create circle geometry with 32 segments
    const circlePoints: THREE.Vector3[] = [];
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * collisionRadius;
      const y = Math.sin(angle) * collisionRadius;
      circlePoints.push(new THREE.Vector3(x, y, 0));
    }

    const circleGeom = new THREE.BufferGeometry().setFromPoints(circlePoints);

    // Green material for bounding circle - semi-transparent for visibility
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 1,
      fog: false,
      transparent: true,
      opacity: 0.5,
    });

    const circle = new THREE.LineLoop(circleGeom, material);
    return circle;
  }
}
