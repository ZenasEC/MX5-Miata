# PRD — Mazda MX-5 Miata (NA) — "Pop-Ups"

## 1. Goal

A single-page, scroll-driven WebGL site devoted to the first-generation Mazda MX-5 Miata
(NA, 1989–1997) and the feature that defines it: the pop-up headlights.

The centerpiece is one interactive 3D car. The visitor can **drag to rotate it** and
**flip the headlights up and down**. Everything else on the page exists to set that up.

Personal passion project. No backend, no auth, no analytics, no client, no CMS.

## 2. Audience

Enthusiasts and design-minded visitors who will judge the page in the first two seconds,
almost always on a phone, always at night-friendly brightness. They know what an NA is;
the page should feel like it was made by someone who owns one.

## 3. Mood

Nocturnal and cinematic. Near-black background, one accent color, off-white text.
The car is lit as if parked under a streetlight. The amber lamp glow is the warmest and
brightest thing on the page and is the emotional focal point.

## 4. Sections

| # | Section | Purpose | Key interaction |
|---|---------|---------|-----------------|
| 1 | Preloader | Cover the asset wait, establish tone | Headlights "wake up" as progress advances |
| 2 | Hero | State the subject, huge type | Car visible, headlights **down** |
| 3 | The Wink | The signature moment | Scroll **scrubs** the headlight angle 0°→70° |
| 4 | Viewer | Free inspection | Drag-rotate, Lights Up / Lights Down, idle auto-rotate |
| 5 | Timeline | Context in three beats | 1989 launch · 1997 end of NA · pop-ups retired with the next generation |
| 6 | Specs | Numbers, restrained | Facts only, `[verify]` where unconfirmed |
| 7 | Footer | Close | Credits, node-name contract pointer, back to top |

## 5. Features in scope

- Lenis smooth scroll driven from the GSAP ticker, synced to ScrollTrigger.
- ScrollTrigger-scrubbed camera choreography across sections 2→6.
- Split-text reveals on headings and lead paragraphs.
- Custom cursor + magnetic buttons, **desktop only**.
- One consistent easing family across CSS and GSAP.
- Drag-to-rotate viewer with damping; keyboard rotation when focused.
- Headlight toggle as a real `<button>` with `aria-pressed`.
- Gentle auto-rotate when the viewer is idle; cancelled by interaction.
- Accessibility: `prefers-reduced-motion` disables scrub, custom cursor and auto-rotate.
- Layout from 375px to 1440px+; touch drag supported.
- Graceful no-WebGL fallback: static CSS hero, copy intact, no thrown error.

## 6. Copy rules

- Short, confident English. No marketing filler, no exclamation marks.
- Only state what is highly confident.

**Cleared to state as fact**

- NA generation produced 1989–1997.
- Pop-up headlights were retired with the next generation, which used fixed lamps.
- Jinba Ittai — "rider and horse as one" — is the MX-5's stated development philosophy.
- Front-mid engine, rear-wheel drive, double-wishbone independent suspension all round.

**Must be marked `[verify]`**

- Engine outputs (1.6 B6 / 1.8 BP), kerb weight, 0–60 time, top speed, production totals,
  and any "lightest / fastest / best-selling" superlative.

Numbers not listed as cleared are never invented. When in doubt, mark `[verify]`.

## 7. Out of scope

Extra pages or routes · CMS · dark/light theme toggle · i18n · search · forms · email
capture · analytics · animation on scroll-in beyond the listed reveals · sound · VR/AR ·
post-processing bloom · downloadable assets · any asset whose license is not recorded in
CREDITS.md · any dependency not listed in §8.

## 8. Constraints (non-negotiable)

- **Stack:** Vite + TypeScript + Three.js + GSAP (ScrollTrigger) + Lenis.
  Plain CSS with custom properties. Fonts self-hosted via `@fontsource`.
  No React, no Tailwind, no other runtime dependency.
- **Types:** `@types/three` is a devDependency (three ships no bundled types).
  TypeScript pinned to the 5.9 line.
- **Assets:** none supplied. The car is built procedurally. A licensed `.glb` may be
  dropped in later with no code change.
- **Only files inside this project folder are touched.**
- Ask before: adding a dependency, deleting a file, running commands outside the project
  folder, downloading anything.

## 9. Done when

- `npm run build` and `npm run dev` both succeed.
- Zero TypeScript errors, zero console errors.
- Drag-rotate works. The lights toggle works. Scrolling scrubs the headlights.
- Verified at 375px and 1440px, with a note on what was seen.
- `README.md` documents the `headlight_L` / `headlight_R` node contract and how to swap
  in a `.glb`. `CREDITS.md` records the license of everything used.

## 10. Risks & assumptions

- **Legibility.** A near-black car on a near-black page can vanish. Mitigated by a lit
  rim, environment streaks, a floor reflection pool and a background vignette — see
  DESIGN.md §6. This is the single biggest visual risk.
- **Procedural body.** A recognisable NA is achievable with a cross-section loft, not
  with primitives. If it does not read as an NA, that is a stop-and-report moment.
- **OrbitControls handoff.** Director and viewer both own the camera; the handoff must be
  explicit and reversible.
- Facts in §6 are memory-based and flagged where uncertain.
