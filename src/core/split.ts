import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

export function initTextReveals(): void {
  if (prefersReducedMotion()) {
    // If reduced motion, simply make all reveal elements visible
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  const revealTargets = document.querySelectorAll<HTMLElement>("[data-reveal]");

  revealTargets.forEach((el) => {
    // Split into words/lines span wrappers for clean masked upward reveal
    const rawText = el.innerText;
    const words = rawText.split(" ");

    el.innerHTML = "";
    words.forEach((word, idx) => {
      const outerSpan = document.createElement("span");
      outerSpan.style.display = "inline-block";
      outerSpan.style.overflow = "hidden";
      outerSpan.style.verticalAlign = "top";

      const innerSpan = document.createElement("span");
      innerSpan.className = "reveal-word";
      innerSpan.style.display = "inline-block";
      innerSpan.style.transform = "translate3d(0, 115%, 0)";
      innerSpan.style.opacity = "0";
      innerSpan.innerText = word + (idx < words.length - 1 ? "\u00A0" : "");

      outerSpan.appendChild(innerSpan);
      el.appendChild(outerSpan);
    });

    const innerWords = el.querySelectorAll(".reveal-word");

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(innerWords, {
          y: "0%",
          opacity: 1,
          duration: 0.85,
          stagger: 0.035,
          ease: "power3.out",
        });
      },
    });
  });
}
