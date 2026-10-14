import { CarRig } from "../car/rig";
import { CameraDirector } from "../core/director";
import { gsap } from "../core/motion";
import { scrollTo } from "../core/scroll";

export function initViewerSection(rig: CarRig, director: CameraDirector): void {
  const toggleBtn = document.getElementById("btn-toggle-lights") as HTMLButtonElement | null;
  const toggleText = document.getElementById("btn-toggle-lights-text");
  const resetBtn = document.getElementById("btn-reset-view") as HTMLButtonElement | null;
  const backToTopBtn = document.getElementById("back-to-top");

  const updateButtonState = (isOpen: boolean) => {
    if (!toggleBtn || !toggleText) return;
    toggleBtn.setAttribute("aria-pressed", isOpen ? "true" : "false");
    toggleText.innerText = isOpen ? "Lights Down" : "Lights Up";
  };

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nowOpen = rig.toggleHeadlights();
      updateButtonState(nowOpen);
    });

    // Support keyboard activation
    toggleBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const nowOpen = rig.toggleHeadlights();
        updateButtonState(nowOpen);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const cam = director.controls.object;
      gsap.to(cam.position, {
        x: 3.8,
        y: 1.4,
        z: 3.6,
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => director.controls.update(),
      });
      gsap.to(director.controls.target, {
        x: 0,
        y: 0.45,
        z: 0,
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => director.controls.update(),
      });
    });
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      scrollTo("#hero");
    });
  }
}
