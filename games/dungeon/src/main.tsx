import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
import App from "./ui/views/App/App.tsx";

import { Time, World } from "@engine/mod.ts";
import {
  installTransformPlugin,
  Transform,
} from "@engine/features/transform-plugin/mod.ts";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  installRenderPlugin,
  Material,
  SphereGeometry,
  Visible,
} from "@engine/features/render-plugin/mod.ts";

createRoot(document.getElementById("ui")!).render(
  <StrictMode>
    {/* <App /> */}
  </StrictMode>,
);

async function main() {
  const world = new World();

  // Time resource
  const time = new Time();
  world.addResource("time", time);

  // Install engine plugins
  installTransformPlugin(world);
  installRenderPlugin(world, {
    canvas: document.querySelector("canvas") as HTMLCanvasElement,
    antialias: true,
  });

  // Create red box
  const box = world.createEntity();
  world.add(box, new Transform());
  const boxTransform = world.get<Transform>(box, Transform)!;
  boxTransform.position = [-3, 0, 0];
  world.add(box, new BoxGeometry());
  world.add(box, new Material());
  const boxMaterial = world.get<Material>(box, Material)!;
  boxMaterial.shaderId = "rainbow"; 
  world.add(box, new Visible());

  // Create green sphere
  const sphere = world.createEntity();
  world.add(sphere, new Transform());
  const sphereTransform = world.get<Transform>(sphere, Transform)!;
  sphereTransform.position = [0, 0, 0];
  world.add(sphere, new SphereGeometry());
  world.add(sphere, new Material());
  const sphereMaterial = world.get<Material>(sphere, Material)!;
  sphereMaterial.color = [0, 1, 0, 1]; // Green
  world.add(sphere, new Visible());

  // Create blue cylinder
  const cylinder = world.createEntity();
  world.add(cylinder, new Transform());
  const cylinderTransform = world.get<Transform>(cylinder, Transform)!;
  cylinderTransform.position = [3, 0, 0];
  world.add(cylinder, new CylinderGeometry());
  world.add(cylinder, new Material());
  const cylinderMaterial = world.get<Material>(cylinder, Material)!;
  cylinderMaterial.color = [0, 0, 1, 1]; // Blue
  world.add(cylinder, new Visible());

  // Create yellow cone
  const cone = world.createEntity();
  world.add(cone, new Transform());
  const coneTransform = world.get<Transform>(cone, Transform)!;
  coneTransform.position = [0, 3, 0];
  world.add(cone, new ConeGeometry());
  world.add(cone, new Material());
  const coneMaterial = world.get<Material>(cone, Material)!;
  coneMaterial.color = [1, 1, 0, 1]; // Yellow
  world.add(cone, new Visible());

  // Handle window resize
  globalThis.addEventListener("resize", () => {
    // RenderPlugin will handle canvas resize
  });

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Update the Time resource
    time.update(dt);

    // Rotate the primitives
    boxTransform.rotation = [
      boxTransform.rotation[0] + dt,
      boxTransform.rotation[1] + dt * 0.7,
      boxTransform.rotation[2],
    ];

    sphereTransform.rotation = [
      sphereTransform.rotation[0],
      sphereTransform.rotation[1] + dt * 1.2,
      sphereTransform.rotation[2],
    ];

    cylinderTransform.rotation = [
      cylinderTransform.rotation[0] + dt * 0.5,
      cylinderTransform.rotation[1],
      cylinderTransform.rotation[2] + dt,
    ];

    coneTransform.rotation = [
      coneTransform.rotation[0],
      coneTransform.rotation[1] + dt * 0.9,
      coneTransform.rotation[2],
    ];

    // Update all systems
    world.updateSystems(dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
