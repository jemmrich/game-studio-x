import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/index.css";
import App from "./ui/views/App/App.tsx";
import * as THREE from "three";

import { Time, World } from "@engine/mod.ts";

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

  // ThreeJS setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    60,
    globalThis.innerWidth / globalThis.innerHeight,
    0.1,
    1000,
  );
  const threeScene = new THREE.Scene();
  world.addResource("renderer", renderer);
  world.addResource("camera", camera);
  world.addResource("scene", threeScene);

  // Handle window resize
  globalThis.addEventListener("resize", () => {
    camera.aspect = globalThis.innerWidth / globalThis.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
  });

  let lastTime = performance.now();

  function loop(now: number) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Update the Time resource
    time.update(dt);

    // Update all systems
    world.updateSystems(dt);

    // Example: If using Three.js, render scene:
    renderer.render(threeScene, camera);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
