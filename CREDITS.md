# Credits & Licenses

This project contains **zero** proprietary, trademarked, or unlicensed 3D assets or imagery.
All 3D geometry is generated procedurally in code (`src/car/buildCar.ts`).

## Open Source Libraries & Tools

- **Three.js** — Copyright © 2010-2026 mrdoob and three.js authors. Licensed under the MIT License.
  https://github.com/mrdoob/three.js
- **GSAP (GreenSock Animation Platform)** — Copyright © 2008-2026 GreenSock, Inc.
  Standard "no charge" license.
  https://gsap.com/standard-license
- **Lenis** — Copyright © 2022-2026 Studio Freight / Darkroom Engineering. Licensed under the MIT License.
  https://github.com/darkroomengineering/lenis
- **Vite** — Copyright © 2019-2026 Evan You & Vite Contributors. Licensed under the MIT License.
  https://github.com/vitejs/vite
- **TypeScript** — Copyright © Microsoft Corporation. Licensed under the Apache License 2.0.
  https://github.com/microsoft/TypeScript

## Fonts

- **Big Shoulders Display** — Designed by Patric King (Material).
  Licensed under the SIL Open Font License (OFL-1.1).
  Distributed via `@fontsource-variable/big-shoulders-display`.
- **Inter** — Designed by Rasmus Andersson.
  Licensed under the SIL Open Font License (OFL-1.1).
  Distributed via `@fontsource-variable/inter`.

## 3D Model — Mazda MX-5 Miata NA (`public/models/miata.glb`)

- Title: "low poly mazda mx-5 miata na (UPDATE)" by **SPDWKS**
- Source: https://skfb.ly/ptYor
- License: [Creative Commons Attribution 4.0 International (CC BY 4.0)](http://creativecommons.org/licenses/by/4.0/)
- Modifications (applied at load time in code — the `.glb` file itself is unmodified):
  the merged pop-up headlight mesh is split into left/right halves and re-parented
  under rear-hinge pivots (`headlight_L` / `headlight_R`), the model is rescaled to
  the procedural car's length, recentered, grounded at y=0, and the lamp-face
  materials are wired to the headlight rig's emissive control.

## 3D Model Policy

An external 3D model IS shipped with this repository at `/public/models/miata.glb`
(see attribution above). If it fails to load, the site falls back to the fully
procedural roadster generated in code (`src/car/buildCar.ts`).
