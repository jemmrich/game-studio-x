import type { World } from "@engine/core/world.ts";
import { ShipGeometry } from "../components/ship-geometry.ts";
import { ShipComponent } from "../components/ship.ts";
import { Transform } from "@engine/features/transform-plugin/mod.ts";
import { Visible } from "@engine/features/render-plugin/mod.ts";
import { BoundingBox } from "../components/bounding-box.ts";
import * as THREE from "three";

/**
 * Three.js based ship rendering
 * Reads ECS data and renders using Three.js
 */
export class ShipRenderSystem {
  private scene: THREE.Scene;
  private shipMesh: THREE.Line | null = null;
  private bboxMesh: THREE.LineSegments | null = null;
  private lastGeometryHash: string = "";
  private lastBBoxHash: string = "";
  private invincibilityTime: number = 0; // Track time for fade effect
  private wasVisible: boolean = true; // Track visibility state for respawn

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(world: World, dt: number): void {
    // Query for entities with ship geometry
    const query = world.query(ShipGeometry, Transform);
    const entities = query.entities();

    // If no entities found but we have a mesh, clean it up (entity was destroyed)
    if (entities.length === 0 && this.shipMesh) {
      const geom = (this.shipMesh as any).geometry;
      if (geom) geom.dispose();
      const mat = (this.shipMesh as any).material;
      if (mat) mat.dispose();
      this.scene.remove(this.shipMesh);
      this.shipMesh = null;
      this.lastGeometryHash = "";
      return;
    }

    for (const entity of entities) {
      const geometry = world.get<ShipGeometry>(entity, ShipGeometry);
      const transform = world.get<Transform>(entity, Transform);
      const ship = world.get<ShipComponent>(entity, ShipComponent);
      const visible = world.get<Visible>(entity, Visible);

      if (!geometry || !transform) continue;

      // Skip rendering if not visible
      if (visible && !visible.enabled) {
        // Hide meshes but keep them for when visible becomes true again
        if (this.shipMesh) {
          this.shipMesh.visible = false;
        }
        if (this.bboxMesh) {
          this.bboxMesh.visible = false;
        }
        this.wasVisible = false;
        continue;
      }

      // If ship just became visible, reset invincibility timer for smooth pulsing effect
      if (!this.wasVisible && visible && visible.enabled) {
        this.invincibilityTime = 0;
      }
      this.wasVisible = true;

      // Make meshes visible when visible.enabled is true
      if (this.shipMesh) {
        this.shipMesh.visible = true;
      }
      if (this.bboxMesh) {
        this.bboxMesh.visible = true;
      }

      // Check if geometry has changed by comparing point counts and values
      const currentHash = this.hashGeometry(geometry);
      
      // Create or recreate ship mesh if it doesn't exist or geometry changed
      if (!this.shipMesh || this.lastGeometryHash !== currentHash) {
        // Dispose of old mesh if it exists
        if (this.shipMesh) {
          const geom = (this.shipMesh as any).geometry;
          if (geom) geom.dispose();
          const mat = (this.shipMesh as any).material;
          if (mat) mat.dispose();
          this.scene.remove(this.shipMesh);
        }
        
        // Create new mesh
        this.shipMesh = this.createShipMesh(geometry);
        this.scene.add(this.shipMesh);
        this.lastGeometryHash = currentHash;
      }

      // Update position, rotation, scale from transform
      this.shipMesh.position.set(transform.position[0], transform.position[1], transform.position[2]);
      this.shipMesh.rotation.z = transform.rotation[2];
      this.shipMesh.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);

      // Handle invincibility fade effect
      if (ship && ship.isInvincible) {
        this.invincibilityTime += dt;
        // Create a pulsing effect: fade between 0.25 and 1 opacity (never fully invisible)
        const opacity = 0.25 + (Math.sin(this.invincibilityTime * Math.PI / 0.75) + 1) / 2 * 0.75;
        const mat = this.shipMesh.material as THREE.LineBasicMaterial;
        mat.opacity = opacity;
        mat.transparent = true;
        mat.needsUpdate = true;
      } else {
        // Ship is not invincible, restore full opacity
        this.invincibilityTime = 0;
        const mat = this.shipMesh.material as THREE.LineBasicMaterial;
        mat.opacity = 1;
        mat.transparent = false;
        mat.needsUpdate = true;
      }

      // Handle bounding box rendering
      const bbox = world.get<BoundingBox>(entity, BoundingBox);
      const shouldShowBBox = bbox && ship && ship.boundingBoxEnabled;
      
      if (shouldShowBBox) {
        const bboxHash = this.hashBBox(bbox);
        
        // Create or recreate bbox mesh if needed
        if (!this.bboxMesh || this.lastBBoxHash !== bboxHash) {
          // Dispose of old bbox mesh
          if (this.bboxMesh) {
            const geom = (this.bboxMesh as any).geometry;
            if (geom) geom.dispose();
            const mat = (this.bboxMesh as any).material;
            if (mat) mat.dispose();
            this.scene.remove(this.bboxMesh);
          }
          
          // Create new bbox mesh
          this.bboxMesh = this.createBBoxMesh(bbox);
          this.scene.add(this.bboxMesh);
          this.lastBBoxHash = bboxHash;
        }
        
        // Update bbox position, rotation, scale to match ship
        this.bboxMesh.position.set(transform.position[0], transform.position[1], transform.position[2]);
        this.bboxMesh.rotation.z = transform.rotation[2];
        this.bboxMesh.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);

        // Apply same invincibility fade to bbox
        if (ship && ship.isInvincible) {
          const opacity = 0.25 + (Math.sin(this.invincibilityTime * Math.PI / 0.75) + 1) / 2 * 0.75;
          (this.bboxMesh.material as THREE.LineBasicMaterial).opacity = opacity;
          (this.bboxMesh.material as THREE.LineBasicMaterial).transparent = true;
        } else {
          (this.bboxMesh.material as THREE.LineBasicMaterial).opacity = 1;
          (this.bboxMesh.material as THREE.LineBasicMaterial).transparent = false;
        }
      } else if (this.bboxMesh) {
        // Remove bounding box if it's no longer present or disabled
        const geom = (this.bboxMesh as any).geometry;
        if (geom) geom.dispose();
        const mat = (this.bboxMesh as any).material;
        if (mat) mat.dispose();
        this.scene.remove(this.bboxMesh);
        this.bboxMesh = null;
        this.lastBBoxHash = "";
      }
    }
  }

  private hashGeometry(geometry: ShipGeometry): string {
    // Create a simple hash of the geometry points
    return geometry.points.map(p => `${p.x},${p.y}`).join("|");
  }

  private hashBBox(bbox: BoundingBox): string {
    return `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`;
  }

  private createShipMesh(geometry: ShipGeometry): THREE.Line {
    // Convert points to Three.js BufferGeometry
    const points = geometry.points.map(p => new THREE.Vector3(p.x, p.y, 0));
    
    // Close the shape by adding the first point again
    if (points.length > 0) {
      points.push(points[0]);
    }

    const bufferGeom = new THREE.BufferGeometry().setFromPoints(points);

    // White line material with transparency support for invincibility pulsing
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 1.0,
    });

    return new THREE.Line(bufferGeom, material);
  }

  private createBBoxMesh(bbox: BoundingBox): THREE.LineSegments {
    const geometry = new THREE.BufferGeometry();

    // Define the 4 corners and the lines connecting them
    const vertices = [
      // Bottom left to bottom right
      bbox.minX, bbox.minY, 0,
      bbox.maxX, bbox.minY, 0,
      // Bottom right to top right
      bbox.maxX, bbox.minY, 0,
      bbox.maxX, bbox.maxY, 0,
      // Top right to top left
      bbox.maxX, bbox.maxY, 0,
      bbox.minX, bbox.maxY, 0,
      // Top left to bottom left
      bbox.minX, bbox.maxY, 0,
      bbox.minX, bbox.minY, 0,
    ];

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));

    // Green line material
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    return lineSegments;
  }

  dispose(): void {
    if (this.shipMesh) {
      const geom = (this.shipMesh as any).geometry;
      if (geom) geom.dispose();
      const mat = (this.shipMesh as any).material;
      if (mat) mat.dispose();
      this.scene.remove(this.shipMesh);
    }
  }
}
