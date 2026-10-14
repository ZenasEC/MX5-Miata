import * as THREE from "three";
import { gsap } from "../core/motion";
import { CarMaterials } from "./materials";

export interface CarRig {
  setHeadlights: (open: boolean, immediate?: boolean) => void;
  toggleHeadlights: () => boolean;
  scrubHeadlights: (progress: number) => void;
  isOpen: () => boolean;
  dispose: () => void;
}

const MAX_ANGLE = 1.22; // ~70 degrees in radians
const MAX_EMISSIVE = 2.4;
const MAX_SPOTLIGHT = 12.0;

export function createCarRig(
  headlight_L: THREE.Object3D,
  headlight_R: THREE.Object3D,
  spotlight_L: THREE.SpotLight | null,
  spotlight_R: THREE.SpotLight | null,
  materials?: CarMaterials
): CarRig {
  let isHeadlightsOpen = false;

  const state = {
    angleL: 0,
    angleR: 0,
    glow: 0,
    spot: 0,
  };

  const applyState = () => {
    headlight_L.rotation.x = state.angleL;
    headlight_R.rotation.x = state.angleR;

    if (materials) {
      materials.headlightLens.emissiveIntensity = state.glow;
    }

    if (spotlight_L) spotlight_L.intensity = state.spot;
    if (spotlight_R) spotlight_R.intensity = state.spot;
  };

  let activeTween: gsap.core.Timeline | null = null;

  const setHeadlights = (open: boolean, immediate = false) => {
    isHeadlightsOpen = open;

    if (activeTween) {
      activeTween.kill();
      activeTween = null;
    }

    const targetAngle = open ? MAX_ANGLE : 0;
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

    const tl = gsap.timeline({
      onUpdate: applyState,
    });

    if (open) {
      // Opening with staggered "wink": Left opens first, right follows after 0.08s
      tl.to(state, {
        angleL: targetAngle,
        duration: 0.65,
        ease: "power3.out",
      }, 0);

      tl.to(state, {
        angleR: targetAngle,
        duration: 0.65,
        ease: "power3.out",
      }, 0.08);

      // Light ignition lags slightly as mechanical pods deploy
      tl.to(state, {
        glow: targetGlow,
        spot: targetSpot,
        duration: 0.45,
        ease: "power2.inOut",
      }, 0.18);
    } else {
      // Closing: lights extinguish first, then pods retract
      tl.to(state, {
        glow: 0,
        spot: 0,
        duration: 0.25,
        ease: "power2.out",
      }, 0);

      tl.to(state, {
        angleR: 0,
        duration: 0.55,
        ease: "power3.inOut",
      }, 0.05);

      tl.to(state, {
        angleL: 0,
        duration: 0.55,
        ease: "power3.inOut",
      }, 0.12);
    }

    activeTween = tl;
  };

  const toggleHeadlights = (): boolean => {
    setHeadlights(!isHeadlightsOpen);
    return isHeadlightsOpen;
  };

  // Scrubbed by scroll in "The Wink" section
  const scrubHeadlights = (progress: number) => {
    if (activeTween) {
      activeTween.kill();
      activeTween = null;
    }

    const clamped = Math.max(0, Math.min(1, progress));

    // Staggered scrub curves for left and right pods
    // Left pod moves across progress 0.0 -> 0.8
    const progressL = Math.max(0, Math.min(1, clamped / 0.82));
    // Right pod moves across progress 0.12 -> 1.0 (creates authentic wink!)
    const progressR = Math.max(0, Math.min(1, (clamped - 0.12) / 0.88));

    state.angleL = progressL * MAX_ANGLE;
    state.angleR = progressR * MAX_ANGLE;

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
