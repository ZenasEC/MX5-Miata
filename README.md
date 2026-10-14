# Mazda MX-5 Miata (NA) — "Pop-Ups"

An interactive, single-page WebGL tribute to the first-generation Mazda MX-5 Miata (NA, 1989–1997)
and its iconic pop-up headlights.

## Stack

- **Three.js** — 3D procedural car model, custom physical shaders, procedural PMREM environment
- **GSAP + ScrollTrigger** — Camera director choreography, scrubbed pop-up headlight wink, split-text reveals
- **Lenis** — Hardware-accelerated smooth scrolling synced to GSAP ticker
- **TypeScript + Vite** — Strict typing, lightning dev server and production rollup bundling
- **CSS Custom Properties** — Pure CSS design tokens, fluid clamp typography, zero CSS frameworks

## Running Locally

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
npm run preview
```

## 3D Asset Strategy & Node Contract

By default, the application runs a **procedural 3D car model** built entirely in code
(`src/car/buildCar.ts`) using a continuous cross-section loft, bespoke NA "daisy" wheels,
tinted glass, and animated pop-up headlight groups.

You can drop in a custom `.glb` model at any time with **zero code changes**:

1. Place your GLTF binary file at:
   ```
   public/models/miata.glb
   ```
2. Ensure your model conforms to the **Node Contract**:
   - `headlight_L`: Group or Object3D pivoted at the rear hinge edge of the driver/left lamp.
   - `headlight_R`: Group or Object3D pivoted at the rear hinge edge of the passenger/right lamp.
   - Rotation axis: Local **X axis**.
     - `rotation.x = 0`: fully closed / retracted flush with the hood.
     - `rotation.x ≈ 1.22 rad` (~70°): fully open / upright.
3. Reload the page. `src/car/loadCar.ts` checks for `/models/miata.glb` first:
   - If found and both nodes exist, it binds directly to them.
   - If absent or missing either node, it seamlessly falls back to the procedural car.
4. Remember to record your asset license in `CREDITS.md`.
