import { TIMELINE_DATA } from "../data/timeline";

export function initTimelineSection(): void {
  const container = document.getElementById("timeline-container");
  if (!container) return;

  container.innerHTML = TIMELINE_DATA.map(
    (item) => `
    <article class="timeline-card">
      <div class="timeline-year">${item.year}</div>
      <h3 class="timeline-headline">${item.headline}</h3>
      <p class="timeline-desc">${item.description}</p>
    </article>
  `
  ).join("");
}
