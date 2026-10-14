import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ScrollTrigger, prefersReducedMotion } from "./motion";

export interface CameraDirector {
  controls: OrbitControls;
  update: () => void;
  enableViewerMode: () => void;
  disableViewerMode: () => void;
  isViewerActive: () => boolean;
  dispose: () => void;
}

export function createDirector(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
  viewerZoneElement: HTMLElement
): CameraDirector {
  const controls = new OrbitControls(camera, viewerZoneElement || domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 7.5;
  controls.minPolarAngle = Math.PI * 0.32; // Prevent seeing under floor
  controls.maxPolarAngle = Math.PI * 0.52; // Keep slightly above ground
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.7;
  controls.enabled = false;

  // Live state tracking
  const state = {
    camX: camera.position.x,
    camY: camera.position.y,
    camZ: camera.position.z,
    tarX: 0,
    tarY: 0.45,
    tarZ: 0,
  };

  const targetVec = new THREE.Vector3(state.tarX, state.tarY, state.tarZ);

  let inViewer = false;
  let idleTimer: number | null = null;

  const resetIdleTimer = () => {
    controls.autoRotate = false;
    if (idleTimer) window.clearTimeout(idleTimer);
    if (!inViewer || prefersReducedMotion()) return;

    idleTimer = window.setTimeout(() => {
      if (inViewer) {
        controls.autoRotate = true;
      }
    }, 3000);
  };

  const onPointerActivity = () => resetIdleTimer();
  viewerZoneElement.addEventListener("pointerdown", onPointerActivity);
  viewerZoneElement.addEventListener("pointermove", onPointerActivity);

  // Keyboard navigation when viewer zone is focused
  const onKeyDown = (e: KeyboardEvent) => {
    if (!inViewer) return;
    const step = 0.087; // ~5 degrees
    if (e.key === "ArrowLeft") {
      controls.autoRotate = false;
      const x = camera.position.x - controls.target.x;
      const z = camera.position.z - controls.target.z;
      const r = Math.hypot(x, z);
      const theta = Math.atan2(z, x) + step;
      camera.position.x = controls.target.x + r * Math.cos(theta);
      camera.position.z = controls.target.z + r * Math.sin(theta);
      resetIdleTimer();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      controls.autoRotate = false;
      const x = camera.position.x - controls.target.x;
      const z = camera.position.z - controls.target.z;
      const r = Math.hypot(x, z);
      const theta = Math.atan2(z, x) - step;
      camera.position.x = controls.target.x + r * Math.cos(theta);
      camera.position.z = controls.target.z + r * Math.sin(theta);
      resetIdleTimer();
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", onKeyDown);

  const enableViewerMode = () => {
    inViewer = true;
    controls.enabled = true;
    controls.target.set(state.tarX, state.tarY, state.tarZ);
    resetIdleTimer();
    const canvas = document.getElementById("webgl-canvas");
    canvas?.classList.add("interactive");
  };

  const disableViewerMode = () => {
    inViewer = false;
    controls.enabled = false;
    controls.autoRotate = false;
    if (idleTimer) window.clearTimeout(idleTimer);
    const canvas = document.getElementById("webgl-canvas");
    canvas?.classList.remove("interactive");

    // Sync state to wherever user left the camera so tweens are seamless
    state.camX = camera.position.x;
    state.camY = camera.position.y;
    state.camZ = camera.position.z;
    state.tarX = controls.target.x;
    state.tarY = controls.target.y;
    state.tarZ = controls.target.z;
  };

  const update = () => {
    if (inViewer) {
      controls.update();
    } else {
      camera.position.set(state.camX, state.camY, state.camZ);
      targetVec.set(state.tarX, state.tarY, state.tarZ);
      camera.lookAt(targetVec);
    }
  };

  // Setup ScrollTrigger choreographies for the sections
  const initTimeline = () => {
    const reduced = prefersReducedMotion();

    // Section 2 (Hero) to Section 3 (The Wink)
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      endTrigger: "#wink",
      end: "top center",
      scrub: reduced ? false : 1.2,
      onUpdate: (self) => {
        if (inViewer) return;
        const p = self.progress;
        // From Hero (3.4, 1.15, 3.2) -> Wink (1.7, 0.82, 2.6)
        state.camX = 3.4 + (1.7 - 3.4) * p;
        state.camY = 1.15 + (0.82 - 1.15) * p;
        state.camZ = 3.2 + (2.6 - 3.2) * p;

        state.tarX = 0.1 + (-0.05 - 0.1) * p;
        state.tarY = 0.45 + (0.52 - 0.45) * p;
        state.tarZ = 0.1 + (0.75 - 0.1) * p;
      },
    });

    // Section 3 (The Wink) to Section 4 (Viewer entry)
    ScrollTrigger.create({
      trigger: "#wink",
      start: "center center",
      endTrigger: "#viewer",
      end: "top top",
      scrub: reduced ? false : 1.2,
      onUpdate: (self) => {
        if (inViewer) return;
        const p = self.progress;
        // From Wink -> Viewer start (3.8, 1.4, 3.6)
        state.camX = 1.7 + (3.8 - 1.7) * p;
        state.camY = 0.82 + (1.4 - 0.82) * p;
        state.camZ = 2.6 + (3.6 - 2.6) * p;

        state.tarX = -0.05 + (0 - -0.05) * p;
        state.tarY = 0.52 + (0.45 - 0.52) * p;
        state.tarZ = 0.75 + (0 - 0.75) * p;
      },
    });

    // Viewer section trigger for activating / deactivating OrbitControls
    ScrollTrigger.create({
      trigger: "#viewer",
      start: "top 50%",
      end: "bottom 20%",
      onEnter: () => enableViewerMode(),
      onEnterBack: () => enableViewerMode(),
      onLeave: () => disableViewerMode(),
      onLeaveBack: () => disableViewerMode(),
    });

    // Section 4 (Viewer exit) to Section 5 (Timeline)
    ScrollTrigger.create({
      trigger: "#viewer",
      start: "bottom 20%",
      endTrigger: "#timeline",
      end: "center center",
      scrub: reduced ? false : 1.2,
      onUpdate: (self) => {
        if (inViewer) return;
        const p = self.progress;
        // From Viewer -> Timeline side profile (4.5, 0.95, 0.2)
        state.camX = 3.8 + (4.5 - 3.8) * p;
        state.camY = 1.4 + (0.95 - 1.4) * p;
        state.camZ = 3.6 + (0.2 - 3.6) * p;

        state.tarX = 0;
        state.tarY = 0.45;
        state.tarZ = 0;
      },
    });

    // Section 5 (Timeline) to Section 6 (Specs)
    ScrollTrigger.create({
      trigger: "#timeline",
      start: "center center",
      endTrigger: "#specs",
      end: "center center",
      scrub: reduced ? false : 1.2,
      onUpdate: (self) => {
        if (inViewer) return;
        const p = self.progress;
        // From Timeline side profile -> Specs rear quarter (-3.4, 1.15, -3.2)
        state.camX = 4.5 + (-3.4 - 4.5) * p;
        state.camY = 0.95 + (1.15 - 0.95) * p;
        state.camZ = 0.2 + (-3.2 - 0.2) * p;

        state.tarX = 0;
        state.tarY = 0.45;
        state.tarZ = -0.2 * p;
      },
    });

    // Section 6 (Specs) to Section 7 (Footer)
    ScrollTrigger.create({
      trigger: "#specs",
      start: "center center",
      endTrigger: "#footer",
      end: "bottom bottom",
      scrub: reduced ? false : 1.2,
      onUpdate: (self) => {
        if (inViewer) return;
        const p = self.progress;
        // From Specs rear quarter -> Footer elevated beauty angle (2.4, 2.3, 3.4)
        state.camX = -3.4 + (2.4 - -3.4) * p;
        state.camY = 1.15 + (2.3 - 1.15) * p;
        state.camZ = -3.2 + (3.4 - -3.2) * p;

        state.tarX = 0;
        state.tarY = 0.45 + (0.35 - 0.45) * p;
        state.tarZ = -0.2 + (0 - -0.2) * p;
      },
    });
  };

  initTimeline();

  const dispose = () => {
    controls.dispose();
    if (idleTimer) window.clearTimeout(idleTimer);
    window.removeEventListener("keydown", onKeyDown);
    viewerZoneElement.removeEventListener("pointerdown", onPointerActivity);
    viewerZoneElement.removeEventListener("pointermove", onPointerActivity);
  };

  return {
    controls,
    update,
    enableViewerMode,
    disableViewerMode,
    isViewerActive: () => inViewer,
    dispose,
  };
}
