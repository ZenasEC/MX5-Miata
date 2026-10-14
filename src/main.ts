import "./style/base.css";
import "./style/sections.css";

import { gsap, ScrollTrigger } from "./core/motion";
import { initScroll } from "./core/scroll";
import { createRenderer } from "./core/renderer";
import { createScene } from "./core/scene";
import { createProceduralEnvironment } from "./core/env";
import { createDirector } from "./core/director";
import { initCustomCursor } from "./core/cursor";
import { initTextReveals } from "./core/split";
import { runPreloader } from "./core/preloader";
import { createCarMaterials } from "./car/materials";
import { loadCar } from "./car/loadCar";
import { initTimelineSection } from "./sections/timeline";
import { initSpecsSection } from "./sections/specs";
import { initWinkSection } from "./sections/wink";
import { initViewerSection } from "./sections/viewer";

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  // 1. Initialize DOM data sections
  initTimelineSection();
  initSpecsSection();

  // 2. Start smooth scrolling engine
  initScroll();

  // 3. Setup text reveal triggers
  initTextReveals();

  // 4. Setup custom cursor and magnetic buttons on desktop
  initCustomCursor();

  // 5. Check WebGL availability
  if (!isWebGLAvailable()) {
    console.warn("WebGL not supported in this browser. Activating fallback content.");
    const fallback = document.getElementById("webgl-fallback");
    if (fallback) fallback.classList.add("show");
    await runPreloader();
    return;
  }

  try {
    // 6. Initialize WebGL 3D Pipeline
    const { renderer, canvas, resize: resizeRenderer, dispose: disposeRenderer } =
      createRenderer();
    const { scene, camera, updateAspect, dispose: disposeScene } = createScene();

    // Procedural Studio Environment for clearcoat car paint reflections
    const envTexture = createProceduralEnvironment(renderer);
    scene.environment = envTexture;

    // Materials
    const materials = createCarMaterials(envTexture);

    // Car (licensed /models/miata.glb first; falls back cleanly to procedural NA Miata).
    // Start loading immediately so the preloader can track real GLB progress.
    let glbRatio = 0;
    let glbDone = false;
    const carPromise = loadCar(materials, (r) => {
      glbRatio = r;
    });
    carPromise.then(
      () => {
        glbDone = true;
      },
      () => {
        glbDone = true;
      }
    );

    // Camera choreography and interactive OrbitControls director
    const viewerZone = document.getElementById("viewer-zone") as HTMLElement;
    const director = createDirector(camera, canvas, viewerZone);

    // 7. Run cinematic preloader sequence (tracks the real model load)
    await runPreloader(() => (glbDone ? 1 : glbRatio));

    const car = await carPromise;
    scene.add(car.root);

    // Wire up section interactions
    initWinkSection(car.rig);
    initViewerSection(car.rig, director);

    // Window resize binding
    const handleResize = () => {
      resizeRenderer();
      updateAspect();
    };
    window.addEventListener("resize", handleResize);

    // Single GSAP ticker render loop — zero memory allocation per frame
    const renderTick = () => {
      director.update();
      renderer.render(scene, camera);
    };
    gsap.ticker.add(renderTick);
    
    // Explicit first frame render
    renderTick();

    // Refresh ScrollTrigger once 3D scene is mounted
    ScrollTrigger.refresh();

    // Attach to window for diagnostics
    (window as any).__APP__ = { scene, camera, car, renderer, materials };

    // Clean disposal hook
    window.addEventListener(
      "pagehide",
      () => {
        gsap.ticker.remove(renderTick);
        window.removeEventListener("resize", handleResize);
        car.dispose();
        director.dispose();
        disposeScene();
        envTexture.dispose();
        disposeRenderer();
      },
      { once: true }
    );
  } catch (err) {
    console.error("Failed to initialize WebGL pipeline:", err);
    const fallback = document.getElementById("webgl-fallback");
    if (fallback) fallback.classList.add("show");
    await runPreloader();
  }
}

// Start application once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
