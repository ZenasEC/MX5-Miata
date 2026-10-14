import { prefersReducedMotion } from "./motion";

const FAILSAFE_MS = 12000;

export function runPreloader(getProgress?: () => number): Promise<void> {
  return new Promise((resolve) => {
    const preloader = document.getElementById("preloader");
    const percentEl = document.getElementById("preloader-percent");
    const barEl = document.getElementById("preloader-bar");
    const leftPod = document.getElementById("pod-lamp-left");
    const rightPod = document.getElementById("pod-lamp-right");

    if (!preloader || !percentEl || !barEl) {
      resolve();
      return;
    }

    const finish = () => {
      percentEl.innerText = "100%";
      barEl.style.width = "100%";
      leftPod?.classList.add("open");
      rightPod?.classList.add("open");
      setTimeout(() => {
        preloader.classList.add("loaded");
        // Allow DOM transition to finish
        setTimeout(() => {
          resolve();
        }, 600);
      }, 350);
    };

    // Reduced motion: skip the animated sequence, still wait briefly for the
    // real GLB load so first paint never shows an empty stage.
    if (prefersReducedMotion()) {
      const start = performance.now();
      const wait = () => {
        const realDone = getProgress ? getProgress() >= 1 : true;
        if (realDone || performance.now() - start > 3000) {
          finish();
        } else {
          window.setTimeout(wait, 100);
        }
      };
      wait();
      return;
    }

    const startedAt = Date.now();
    let fake = 0;
    const interval = window.setInterval(() => {
      // Cinematic minimum pace; never regress behind the real GLB load progress.
      fake += Math.floor(Math.random() * 8) + 4;
      if (fake > 100) fake = 100;

      const real = getProgress ? Math.max(0, Math.min(1, getProgress())) * 100 : 100;
      const shown = Math.floor(Math.max(fake, real > 100 ? 100 : real));
      const clamped = Math.min(100, shown);

      percentEl.innerText = `${clamped}%`;
      barEl.style.width = `${clamped}%`;

      if (clamped >= 45 && leftPod) {
        leftPod.classList.add("open");
      }
      if (clamped >= 75 && rightPod) {
        rightPod.classList.add("open");
      }

      const realDone = getProgress ? getProgress() >= 1 : true;
      const failsafe = Date.now() - startedAt > FAILSAFE_MS;
      if ((clamped >= 100 && realDone) || failsafe) {
        clearInterval(interval);
        finish();
      }
    }, 45);
  });
}
