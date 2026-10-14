import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
} as const;

export const DUR = {
  micro: 0.18,
  ui: 0.45,
  reveal: 0.9,
  camera: 1.6,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
