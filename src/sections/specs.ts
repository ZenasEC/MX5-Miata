import { SPECS_DATA } from "../data/specs";

export function initSpecsSection(): void {
  const container = document.getElementById("specs-container");
  if (!container) return;

  container.innerHTML = SPECS_DATA.map(
    (item) => `
    <article class="spec-card">
      <div class="spec-label">${item.label}</div>
      <div class="spec-value">${item.value}</div>
      ${item.tag ? `<span class="spec-tag ${item.isFact ? "fact" : ""}">${item.tag}</span>` : ""}
      <p class="spec-sub">${item.sub}</p>
    </article>
  `
  ).join("");
}
