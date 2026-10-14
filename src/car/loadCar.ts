import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { gsap } from "../core/motion";
import { CarMaterials } from "./materials";
import { buildProceduralCar, ProceduralCarBundle } from "./buildCar";
import { createCarRig, CarRig } from "./rig";
import { prepareModel, PreparedGLB } from "./prepareModel";

export interface LoadedCar {
  root: THREE.Group;
  rig: CarRig;
  isProcedural: boolean;
  dispose: () => void;
}

const MAX_EMISSIVE = 2.4;
const MAX_SPOTLIGHT = 12.0;

/**
 * Headlight rig for the licensed GLB. The model is authored pods-UP, which is
 * pivot rotation 0 (= OPEN). Closing rotates +closeAngle (lid measured to lie
 * flat at ~0.49 rad) and dips each pivot by its measured settle travel so the
 * lid lands flush on the solid hood. Same CarRig interface as the procedural
 * car, so the toggle button and Wink scroll scrub work without changes.
 */
function createGlbHeadlightRig(bundle: PreparedGLB): CarRig {
  const {
    headlight_L,
    headlight_R,
    lampMaterials,
    spotlight_L,
    spotlight_R,
    closeAngle,
    closedDipL,
    closedDipR,
  } = bundle;
  let isHeadlightsOpen = false;

  const baseYL = headlight_L.position.y;
  const baseYR = headlight_R.position.y;

  const state = {
    angleL: closeAngle,
    angleR: closeAngle,
    glow: 0,
    spot: 0,
  };

  const applyState = () => {
    headlight_L.rotation.x = state.angleL;
    headlight_R.rotation.x = state.angleR;
    // Settle dip follows each pod's own angle, so scrub stays in sync.
    headlight_L.position.y = baseYL - closedDipL * (state.angleL / closeAngle);
    headlight_R.position.y = baseYR - closedDipR * (state.angleR / closeAngle);
    for (const m of lampMaterials) m.emissiveIntensity = state.glow;
    spotlight_L.intensity = state.spot;
    spotlight_R.intensity = state.spot;
  };
  applyState();

  let activeTween: gsap.core.Timeline | null = null;

  const setHeadlights = (open: boolean, immediate = false) => {
    isHeadlightsOpen = open;

    if (activeTween) {
      activeTween.kill();
      activeTween = null;
    }

    const targetAngle = open ? 0 : closeAngle;
    const targetGlow = open ? MAX_EMISSIVE : 0;
    const targetSpot = open ? MAX_SPOTLIGHT : 0;

    if (immediate) {
      state.angleL = targetAngle;
      state.angleR = targetAngle;
      state.glow = targetGlow;
      state.spot = targetSpot;
      applyState();
      return;
    }

    const tl = gsap.timeline({ onUpdate: applyState });

    if (open) {
      // Opening with staggered "wink": Left rises first, right follows after 0.08s
      tl.to(state, { angleL: targetAngle, duration: 0.65, ease: "power3.out" }, 0);
      tl.to(state, { angleR: targetAngle, duration: 0.65, ease: "power3.out" }, 0.08);
      tl.to(
        state,
        { glow: targetGlow, spot: targetSpot, duration: 0.45, ease: "power2.inOut" },
        0.18
      );
    } else {
      // Closing: lights extinguish first, then pods tuck into the hood
      tl.to(state, { glow: 0, spot: 0, duration: 0.25, ease: "power2.out" }, 0);
      tl.to(state, { angleR: closeAngle, duration: 0.55, ease: "power3.inOut" }, 0.05);
      tl.to(state, { angleL: closeAngle, duration: 0.55, ease: "power3.inOut" }, 0.12);
    }

    activeTween = tl;
  };

  const toggleHeadlights = (): boolean => {
    setHeadlights(!isHeadlightsOpen);
    return isHeadlightsOpen;
  };

  // Scrubbed by scroll in "The Wink" section (progress 0 = down, 1 = up)
  const scrubHeadlights = (progress: number) => {
    if (activeTween) {
      activeTween.kill();
      activeTween = null;
    }

    const clamped = Math.max(0, Math.min(1, progress));

    // Staggered scrub curves for left and right pods (authentic wink)
    const progressL = Math.max(0, Math.min(1, clamped / 0.82));
    const progressR = Math.max(0, Math.min(1, (clamped - 0.12) / 0.88));

    state.angleL = closeAngle * (1 - progressL);
    state.angleR = closeAngle * (1 - progressR);

    const lampProgress = Math.max(0, Math.min(1, (clamped - 0.25) / 0.75));
    state.glow = lampProgress * MAX_EMISSIVE;
    state.spot = lampProgress * MAX_SPOTLIGHT;

    isHeadlightsOpen = clamped > 0.5;
    applyState();
  };

  return {
    setHeadlights,
    toggleHeadlights,
    scrubHeadlights,
    isOpen: () => isHeadlightsOpen,
    dispose: () => {
      if (activeTween) activeTween.kill();
    },
  };
}

export async function loadCar(
  materials: CarMaterials,
  onProgress?: (ratio: number) => void
): Promise<LoadedCar> {
  // 1. Attempt to load the licensed /models/miata.glb
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync("/models/miata.glb", (ev) => {
      if (ev.total > 0) onProgress?.(ev.loaded / ev.total);
    });
    onProgress?.(1);

    const prepared = prepareModel(gltf);
    const rig = createGlbHeadlightRig(prepared);

    // eslint-disable-next-line no-console
    console.info("[loadCar] Using /models/miata.glb (SPDWKS, CC BY 4.0) with re-pivoted pop-ups.");

    return {
      root: prepared.root,
      rig,
      isProcedural: false,
      dispose: () => {
        rig.dispose();
        prepared.dispose();
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[loadCar] Failed to load /models/miata.glb, falling back to procedural car:", err);
  }

  // 2. Fall back to procedural car model (buildCar.ts untouched)
  const procedural: ProceduralCarBundle = buildProceduralCar(materials);
  const rig = createCarRig(
    procedural.headlight_L,
    procedural.headlight_R,
    procedural.spotlight_L,
    procedural.spotlight_R,
    materials
  );

  return {
    root: procedural.root,
    rig,
    isProcedural: true,
    dispose: () => {
      rig.dispose();
      procedural.dispose();
    },
  };
}
