# DESIGN — "Pop-Ups"

Direction: **Halogen.** Near-black body, near-black page, one incandescent amber accent.
The car is legible because it is *made of reflected light*, not because it is bright.

## 1. Palette

```
--ink-000  #050506   page background (near-black)
--ink-050  #0B0B0D   raised surface / body paint base
--ink-100  #141416   card, spec row fill
--ink-200  #1E1E21   hairline, 1px rule
--ink-400  #55555B   disabled / decorative
--ink-700  #9A9AA1   secondary text
--paper    #F2F0EC   primary text (off-white, never pure #fff)

--accent        #FFB35C   incandescent amber — UI accent
--accent-hi     #FFD8A3   hover / focus / lamp hot spot
--accent-lo     #C97A24   pressed / deep lamp
--accent-glow   rgba(255,179,92,0.45)
--vignette      rgba(255,179,92,0.10)
```

Body paint: Brilliant Black `#0B0B0D`, `clearcoat 1`, `clearcoatRoughness 0.05`.
Accent usage is rationed: the lamp glow, focus rings, active states, timeline markers and
the numbers that matter. Never a large amber fill.

## 2. Typography

Self-hosted, latin subset only, via `@fontsource`.

```
--font-display  'Big Shoulders Display Variable'   headings, hero, numerals on spec cards
--font-sans     'Inter Variable'                   body, labels, UI
```

Scale (fluid, `clamp`):

```
--step--1  0.6875rem   eyebrow, uppercase, tracking 0.18em
--step-0   clamp(1rem, 0.95rem + 0.25vw, 1.125rem)   body
--step-1   clamp(1.25rem, 1.1rem + 0.6vw, 1.75rem)   lead paragraph
--step-2   clamp(2rem, 1.4rem + 2.4vw, 3.5rem)       spec figure
--step-3   clamp(2.25rem, 1.4rem + 4vw, 5.5rem)      section heading
--step-4   clamp(3.5rem, 1rem + 14vw, 15rem)         hero display
```

Display type is set tight (`letter-spacing -0.02em`, `line-height 0.86`), uppercase for
hero and section headings. Body copy is `line-height 1.55`, max measure 62ch.
Spec figures use `font-variant-numeric: tabular-nums`.

## 3. Layout

- 12-column grid, `clamp(1.25rem, 5vw, 6rem)` gutters, max content width 1440px.
- The canvas is `position: fixed; inset: 0;` **behind** all DOM. Sections are transparent
  passages the car moves through; copy sits in the columns the car is not occupying.
- Section height is driven by content + `min-height: 100svh`; no horizontal scroll, ever.
- Breakpoints: 375 (base), 640, 900, 1200. Desktop-only features gate at `(hover: hover)
  and (pointer: fine)`.

## 4. Motion

One family: **Power**. Out-moves are `power3.out`, symmetric moves `power2.inOut`.
Matching CSS tokens, so DOM and WebGL move identically.

```
--ease-power3-out     cubic-bezier(0.215, 0.61, 0.355, 1)   = gsap 'power3.out'
--ease-power2-in-out  cubic-bezier(0.455, 0.03, 0.515, 0.955) = gsap 'power2.inOut'

--dur-1  180ms   micro (hover, cursor)
--dur-2  450ms   UI (buttons, toggles)
--dur-3  900ms   reveals
--dur-4  1600ms  camera moves
```

Rules:

- **Reveals** — split lines, `y: 110% → 0`, opacity 0→1, `stagger 0.045`, `0.9s`,
  `power3.out`, triggered at `top 80%`, `once: true`.
- **Scrub** — camera and headlight angle only, `scrub: 1.2` (1s catch-up). Transform and
  rotation only; never scrub a filter, blur or color.
- **Headlight pop** — `rotation.x` 0→70°, `0.7s`, `power3.out`, `stagger 0.08` for the
  wink. Emissive and spot intensity ramp on the same tween, lagging 0.15s.
- **Camera** — keyframed per section, tweened position **and** look-at target together;
  fov fixed at 34°.
- **Reduced motion** — `gsap.matchMedia('(prefers-reduced-motion: reduce)')` sets scrub to
  instant (`set()` at section entry), disables the custom cursor, magnetic buttons and
  auto-rotate, and shortens reveals to a plain opacity fade.
- Nothing animates for longer than 1.6s without user input. No infinite loops except the
  idle auto-rotate, which stops on any interaction.

## 5. Interaction

- **Custom cursor** — a small off-white ring, amber on hoverable targets; scales 2.4× over
  magnetic targets. Desktop only. Native cursor hidden only where the ring draws.
- **Magnetic buttons** — pointer offset applied at 0.25 strength, `0.45s power3.out`,
  springs home on leave.
- **Viewer** — `OrbitControls` with `enableDamping`, `dampingFactor 0.05`, polar clamp
  `0.35π→0.62π`, no pan, distance clamp. Director hands over the live camera + target on
  enter, re-syncs and tweens back on leave.
- **Keyboard** — the viewer is focusable; `←/→` rotate in 5° steps, `↑/↓` tilt. The lights
  button is a real button, `aria-pressed="true|false"`, Space/Enter toggles.
- **Idle** — 3s without pointer input starts a slow auto-rotate (~0.06 rad/s); any
  pointer/key input cancels it.

## 6. 3D architecture

One `WebGLRenderer`, one fixed canvas, one `Scene`, one 34° `PerspectiveCamera`, one
`CarRig`. Camera choreography and the viewer share that single camera.

**Node contract.** `loadCar.ts` requests `/models/miata.glb`, then looks up nodes named
`headlight_L` and `headlight_R`. Both found → use the GLB. Anything else → procedural car.
Each node must be a group pivoted at the lamp's **rear hinge edge**, rotating on local X,
0 = closed, ~70° = open. Documented in README.md.

**Procedural body** (`buildCar.ts`). A cross-section loft, not primitives: ~14 stations
nose→tail, each a closed outline sampled from a `CatmullRomCurve3` through hand-placed
control points (ride height, rocker, front and rear fender bulge, shoulder line, hood,
roof), quad-stripped between stations, `computeVertexNormals()`. Long hood, short deck,
low and wide, small cabin. Windshield and rear glass are theta-limited open cylinders.
Wheels are NA "daisy" spokes merged into one geometry, shared by four meshes.
The cockpit is a dark inset. The lamp recess is faked with a near-black silhouette 1mm
behind each pod — cheap, and it reads as the correct panel gap.

**Materials** (`materials.ts`) — `MeshPhysicalMaterial` throughout: paint (clearcoat),
dark tinted glass (opacity, no transmission), rubber, chrome, and the lamp lens whose
`emissiveIntensity` is driven by the headlight tween. Two low-intensity `SpotLight`s aim
forward, ramped with the same value.

**Environment** (`env.ts`) — procedural. A throwaway scene: gradient canvas-texture sky
plus two emissive "softbox" planes, run through `PMREMGenerator.fromScene()`, temp scene
and generator disposed immediately. One allocation, ever. This is what makes the clearcoat
streak. Two rim lights keep the black body legible against the black page.

**Performance** — `min(devicePixelRatio, 2)`; `gsap.ticker` is the only RAF; module-scope
`Vector3`/`Quaternion` temps, zero per-frame allocation; one 1024 shadow map; single
`renderer.render` per tick.

**Cleanup** — `disposeObject()` traverses the rig disposing geometries, materials and
textures; plus `renderer.dispose()`, `forceContextLoss()`, `lenis.destroy()`,
`ScrollTrigger.killAll()`, ticker and listener removal.

**Fallback** — no WebGL: skip renderer creation, keep all copy, show the static CSS hero.
