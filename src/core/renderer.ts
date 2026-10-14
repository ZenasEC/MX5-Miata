import * as THREE from "three";

export interface RendererBundle {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  resize: () => void;
  dispose: () => void;
}

export function createRenderer(canvasElement?: HTMLCanvasElement): RendererBundle {
  const canvas = canvasElement || (document.getElementById("webgl-canvas") as HTMLCanvasElement);
  if (!canvas) {
    throw new Error("Target canvas element #webgl-canvas not found");
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  const updateSize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  };

  updateSize();

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const handleResize = () => {
    updateSize();
  };

  window.addEventListener("resize", handleResize);

  const dispose = () => {
    window.removeEventListener("resize", handleResize);
    renderer.dispose();
    renderer.forceContextLoss();
  };

  return {
    renderer,
    canvas,
    resize: updateSize,
    dispose,
  };
}
