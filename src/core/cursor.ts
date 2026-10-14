import { gsap, prefersReducedMotion } from "./motion";

export function initCustomCursor(): () => void {
  if (prefersReducedMotion()) return () => {};
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};

  document.body.classList.add("has-custom-cursor");

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";

  const dot = document.createElement("div");
  dot.className = "custom-cursor-dot";

  document.body.appendChild(cursor);
  document.body.appendChild(dot);

  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  };

  window.addEventListener("mousemove", onMouseMove);

  // Smooth lerp loop via gsap ticker
  const tickerUpdate = () => {
    cursorX += (mouseX - cursorX) * 0.22;
    cursorY += (mouseY - cursorY) * 0.22;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
  };

  gsap.ticker.add(tickerUpdate);

  // Hover target states
  const onPointerOver = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a, button, .viewer-interaction-zone, [data-cursor-hover]");
    if (target) {
      cursor.classList.add("hover");
    } else {
      cursor.classList.remove("hover");
    }
  };

  const onMouseDown = () => cursor.classList.add("active");
  const onMouseUp = () => cursor.classList.remove("active");

  document.addEventListener("mouseover", onPointerOver);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);

  // Magnetic button effects
  const magneticEls = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  const cleanups: Array<() => void> = [];

  magneticEls.forEach((el) => {
    const onMagMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: relX * 0.28,
        y: relY * 0.28,
        duration: 0.35,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onMagLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    el.addEventListener("mousemove", onMagMove);
    el.addEventListener("mouseleave", onMagLeave);

    cleanups.push(() => {
      el.removeEventListener("mousemove", onMagMove);
      el.removeEventListener("mouseleave", onMagLeave);
    });
  });

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseover", onPointerOver);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mouseup", onMouseUp);
    gsap.ticker.remove(tickerUpdate);
    cleanups.forEach((c) => c());
    cursor.remove();
    dot.remove();
    document.body.classList.remove("has-custom-cursor");
  };
}
