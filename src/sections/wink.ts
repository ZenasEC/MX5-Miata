import { ScrollTrigger, prefersReducedMotion } from "../core/motion";
import { CarRig } from "../car/rig";

export function initWinkSection(rig: CarRig): void {
  const reduced = prefersReducedMotion();

  ScrollTrigger.create({
    trigger: "#wink",
    start: "top 80%",
    end: "bottom 30%",
    scrub: reduced ? false : 1.0,
    onUpdate: (self) => {
      rig.scrubHeadlights(self.progress);
    },
    onLeaveBack: () => {
      // Retract when returning to Hero
      rig.setHeadlights(false, true);
    },
  });
}
