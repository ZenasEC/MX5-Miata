import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export function initScroll(): Lenis {
  if (lenisInstance) return lenisInstance;

  const reduced = prefersReducedMotion();

  lenisInstance = new Lenis({
    duration: reduced ? 0 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduced,
  });

  lenisInstance.on("scroll", () => {
    ScrollTrigger.update();
  });

  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function scrollTo(target: string | HTMLElement, options?: { offset?: number; immediate?: boolean }): void {
  if (!lenisInstance) {
    if (typeof target === "string") {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
    }
    return;
  }
  lenisInstance.scrollTo(target, options);
}

export function destroyScroll(): void {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
