# Liquid Glass Material Editor — Build Specification \& Agent Prompt

# 1\. The Prompt 

Build a production-quality, portfolio-grade interactive web toy called the **Liquid Glass Material Editor** — a single-page app where a draggable glass shape sits on top of a background image and visually **bends, refracts, and reflects** whatever is beneath it, the way Apple's Liquid Glass material (introduced at WWDC 2025 for iOS/iPadOS/macOS 26) behaves.

This is not a "glassmorphism" card with `backdrop-filter: blur()`. That effect is the single most overused, laziest visual cliché in AI-generated UIs, and it is explicitly banned in this project (see Section 11). Real liquid glass **bends light at its edges like an actual lens**, holds a calmer center, catches a moving specular highlight, and reacts elastically when you touch it. Your job is to simulate that, not approximate it with a blur filter and a white overlay.

Priorities, in order:

1. **The material must look and feel physically real** — edge refraction, not just blur.
2. **Interaction must feel alive** — spring-based drag, elastic squish, highlight that "wakes up" on touch.
3. **The UI chrome around it must look designed, not scaffolded** — no default browser sliders, no unstyled color inputs, no cookie-cutter dashboard layout.
4. Feature completeness (extra shapes, presets, export) matters less than the above three being excellent.

If a described technique (e.g., the WebGL refraction shader in Section 6) is beyond what you can fully implement, **build the closest real approximation and say so explicitly** — do not silently swap it for `backdrop-filter: blur()` and present it as done. A visibly-labeled partial implementation is more useful than a confident fake.

Full spec follows below. Read all of it before writing code.

\---

## 2\. Vision \& Design Philosophy

**What this is:** a single-screen interactive demo. A large canvas fills most of the viewport, showing a rich, high-detail background image. A glass shape — default a rounded square, roughly 220×140px — floats above it and can be dragged anywhere on the canvas. As it moves, the region of the image underneath is optically distorted: bent inward near the shape's edges (like looking through a lens or a magnifying glass turned slightly convex), softly blurred in a controllable amount, saturated/tinted, and finished with a moving specular highlight that responds to an implied light source. A floating control panel — itself rendered in the same glass material, as a demonstration of the effect applied to real UI — lets the user tune every parameter live.

**What "liquid glass" specifically means** (grounded in Apple's WWDC25 material, which this project is explicitly inspired by):

* **Edge refraction, not uniform blur.** The center of the glass is nearly a clean pass-through of what's behind it (maybe lightly blurred); the *edges* bend and compress the image, the way light bends through the curved edge of a real lens. This is the single most important visual signature and the one most AI-generated "glass" UIs get wrong by skipping it entirely.
* **Environmental adaptivity.** The material's apparent color/brightness shifts subtly based on what's underneath it — glass over a bright red region should pick up a whisper of warmth; over a dark region it should look calmer and cooler.
* **A specular highlight that behaves like reflected light**, not a static gradient painted onto the shape. It should sit along the edge facing the implied light source, brighten and elongate briefly when the shape is touched/dragged (as if the material is "waking up" and reacting), and settle back to a quieter resting state when idle.
* **Elastic, physical motion.** Real Liquid Glass in Apple's system has a springy, slightly viscous quality — controls squish very subtly on touch and settle with a spring, never snapping linearly. Same expectation here.
* **Restraint.** Apple's material reads as *refined*, not decorative — subtle distortion, subtle tint, subtle highlight. Overdoing any single parameter (especially saturation or tint) should visibly look wrong, and the default preset should sit closer to "barely there but unmistakably real" than "maximum effect."

**Anti-goal, stated plainly:** this should not look like a Dribbble-cliché "glassmorphism" card generated in five seconds by an LLM. If a person who has actually seen Apple's Liquid Glass material in person looks at this and says "that's just blur," the build has failed regardless of how many sliders it has.

\---

## 3\. Product Requirements

### 3.1 Core scene

* A full-bleed canvas area (the majority of the viewport) displaying a background image.
* One glass shape, draggable by pointer/touch, constrained to stay within the canvas bounds (clamp position so the shape never fully leaves the visible area).
* The glass shape continuously re-renders its refraction/blur/tint based on whatever portion of the background currently sits beneath it — this must update in real time as it's dragged, not just on drop.

### 3.2 Background control

* At least 4–6 curated preset background images, chosen deliberately for this demo (see Section 8.4 for criteria) — not a single static image.
* A way to switch between presets (thumbnail strip or dropdown).
* Support for the user to upload their own image (drag-and-drop onto canvas or file picker) as a stretch requirement if time allows — otherwise presets alone satisfy the core spec.

### 3.3 Glass shape controls

|Control|Range|Default|Notes|
|-|-|-|-|
|Blur|0–40px|12px|Gaussian blur applied within the glass mask before/independent of distortion|
|Saturation|50%–200%|130%|Applied only to the sampled content under the glass|
|Refraction / Distortion strength|0–100|45|Drives edge-bend magnitude (see Section 6)|
|Rim width|4–40px|16px|How far the refraction effect extends inward from the edge|
|Tint color|any|none (0% opacity)|Color picker|
|Tint opacity|0–40%|0%|Keep the max low — heavy tint reads as "colored plastic," not glass|
|Chromatic aberration|0–20|4|Subtle RGB fringing at the rim for realism|
|Specular / light intensity|0–100|60|Strength of the moving highlight|
|Corner radius|0px–50% (pill)|28px|Only relevant for rectangle/squircle shapes|
|Elasticity|low/medium/high|medium|Maps to spring stiffness/damping presets, see Section 9|

### 3.4 Shape switching

Support at minimum: **circle**, **rounded rectangle/squircle**, **pill**. A **freeform blob** shape is a strong stretch goal. Switching shapes should morph smoothly (interpolate the SDF/path), not pop instantly.

### 3.5 Text inside glass

* User can type a short text string that renders centered inside the glass shape.
* Text color must auto-select (light/dark) based on the luminance of the background content currently under the glass, so it stays legible as the shape moves over light and dark regions. Recompute this continuously, not once.
* Typeface should read as a clean system/display sans (SF Pro–adjacent — Inter, or a comparable stack) with tight letter-spacing, matching the restrained character of the rest of the UI.

### 3.6 Presets

Provide one-click material presets (see table in Section 8.5) that set multiple sliders at once, with a smooth animated transition between values rather than an instant jump.

### 3.7 Export (nice-to-have, not core)

A "Copy settings as JSON" or "Copy as CSS" action that serializes current control values to the clipboard, with a small confirmation toast. This is a good signal of craft and costs little to add.

\---

## 4\. Visual \& Interaction Design System

This section exists because the #1 way this project fails is by nailing the shader and shipping it inside a generic, unstyled dashboard. Treat this with equal weight to Section 6.

* **Layout:** the canvas is the hero and should occupy the large majority of the screen. The control panel is a floating dock — either a right-hand sidebar (desktop) or a bottom sheet (narrow viewports) — never a full-width top toolbar that competes with the canvas for attention.
* **The control panel itself should be rendered in the same glass material** (or a simplified/cheaper version of it) sitting over the canvas. This is both a design flex and a genuine test of whether the material holds up on real UI, not just a demo shape.
* **Background/canvas chrome:** dark neutral surround (near-black, e.g. `#0A0A0C`) so the glass and the background image read as vivid focal points rather than competing with a busy UI.
* **Typography:** Inter (or SF Pro if licensing allows) for all UI text. Tight tracking on headings (`-0.02em` to `-0.01em`), clear size hierarchy — panel section labels should be small, uppercase, low-opacity (e.g. 11px, letter-spacing 0.06em, 50% opacity) to stay quiet against the sliders.
* **Sliders:** fully custom-styled, never the raw browser `<input type="range">` appearance. Thin track, filled progress indicator, a small circular thumb with a soft shadow, and a live numeric readout beside the label that updates on every frame of drag — not just on release.
* **Color picker / swatches:** custom swatch UI, not a raw `<input type="color">` swatch.
* **Spacing:** consistent 8px baseline grid. Control groups separated by subtle 1px dividers at \~8% opacity, generous internal padding (16–24px) so the panel doesn't feel cramped.
* **Hover/press states:** every interactive element gets a deliberate transition (140–200ms ease-out) on hover and a slight scale-down (\~0.97) on press. No element should feel inert.
* **Cursor:** `grab` over the glass shape, `grabbing` while dragging.
* **Loading state:** if a background image is swapped, show a brief, tasteful shimmer/fade rather than a pop or flash of unstyled content.
* **Empty/first-load state:** the app should look intentional the instant it loads — a sensible default preset, default shape position roughly centered-left, no flash of unstyled sliders.

\---

## 5\. Technical Architecture

### 5.1 Recommended stack

* **React + TypeScript + Vite** for the app shell.
* **Tailwind CSS** for layout/UI chrome (not for the glass material itself).
* **A spring-physics library** (Framer Motion or `@react-spring/web`) for drag interaction and value-change animation.
* **WebGL** (raw WebGL2, or a thin wrapper like `regl`, or Three.js `ShaderMaterial` over a full-screen plane) for the actual glass rendering. This is the piece that makes the difference between "looks real" and "looks like blur." Do not substitute CSS-only techniques as the primary approach — see 5.2 for when a fallback is acceptable.
* **Zustand** (or plain React context if you prefer fewer dependencies) for shared state: shape position/size/type, all slider values, current background, text content.

### 5.2 Two-tier rendering strategy

Build **Tier 1 (WebGL refraction)** as the primary path. Implement **Tier 2 (SVG filter fallback)** only as a graceful degrade for environments where WebGL is unavailable — never as the default.

* **Tier 1 — WebGL, true refraction (primary target):** Render the background image as a texture on a full-viewport quad. A fragment shader samples that texture with per-pixel UV displacement computed from the signed-distance-field (SDF) of the current glass shape, so pixels near the shape's edge sample from further away (bending inward like a lens) while pixels near the center sample almost undisplaced. See Section 6 for the reference shader.
* **Tier 2 — SVG `feDisplacementMap` fallback:** Use a pre-generated radial/edge displacement map (a grayscale PNG or procedurally-drawn SVG gradient shaped to match the current glass shape) fed into `backdrop-filter: url(#glassDistort)` via an SVG `<filter>` with `feImage` + `feDisplacementMap` + `feGaussianBlur`. This is CSS/SVG-native, works without WebGL, and is dramatically better than plain `blur()` because it still bends geometry at the edges — but it's lower fidelity (no chromatic aberration, coarser control over rim shape) and should be labeled in code comments as the fallback tier, not shipped silently as "the effect."

### 5.3 State flow

* Shape position, size, and all material parameters live in the shared store.
* The WebGL layer subscribes to that store and updates shader uniforms every frame the shape is moving or a slider is being dragged; it should not re-render on every React state change when idle (avoid burning GPU cycles on a static frame — pause the render loop when nothing has changed for a few frames, resume on next interaction).
* Pointer/touch drag updates position via `requestAnimationFrame`, never via unthrottled state updates on every `pointermove` event synchronously triggering a full React re-render tree.

\---

## 6\. Rendering Approach — Reference Shader

The following GLSL is a **starting reference**, not drop-in production code — adapt constants and structure to your actual pipeline (single combined pass vs. separate blur pass, etc.). The important part is the *technique*: SDF-based edge detection driving displacement strength, not a flat blur.

```glsl
precision highp float;

uniform sampler2D u\_background;   // the canvas background, pre-rendered to a texture
uniform vec2  u\_resolution;       // canvas size in px
uniform vec2  u\_glassCenter;      // glass shape center, in px
uniform vec2  u\_glassSize;        // glass shape width/height, in px
uniform float u\_cornerRadius;     // px
uniform float u\_refractionStrength; // 0..1, from the Distortion slider
uniform float u\_rimWidth;         // px, from the Rim Width slider
uniform float u\_saturation;       // 1.0 = neutral
uniform vec3  u\_tintColor;
uniform float u\_tintOpacity;      // 0..0.4
uniform float u\_chromaticAberration; // 0..1
uniform vec2  u\_lightDir;         // normalized, e.g. top-left = (-0.6, 0.8)

float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = gl\_FragCoord.xy / u\_resolution;
  vec2 p  = gl\_FragCoord.xy - u\_glassCenter;
  float dist = sdRoundRect(p, u\_glassSize \* 0.5, u\_cornerRadius);

  if (dist > 0.0) {
    gl\_FragColor = texture2D(u\_background, uv); // outside glass: untouched
    return;
  }

  // Approximate the lens surface normal from the SDF gradient near the edge
  vec2 e = vec2(1.0, 0.0);
  vec2 grad = normalize(vec2(
    sdRoundRect(p + e.xy, u\_glassSize \* 0.5, u\_cornerRadius) - sdRoundRect(p - e.xy, u\_glassSize \* 0.5, u\_cornerRadius),
    sdRoundRect(p + e.yx, u\_glassSize \* 0.5, u\_cornerRadius) - sdRoundRect(p - e.yx, u\_glassSize \* 0.5, u\_cornerRadius)
  ));

  // Displacement is strongest right at the rim, fades to \~0 toward the center
  float rim = smoothstep(-u\_rimWidth, 0.0, dist);
  float displace = rim \* u\_refractionStrength \* 24.0; // px — tune the constant to taste

  vec2 baseUV = uv + (grad \* displace) / u\_resolution;

  // Chromatic aberration: offset R/B channel sampling slightly at the rim
  float ca = u\_chromaticAberration \* rim \* 4.0;
  float r = texture2D(u\_background, uv + (grad \* (displace + ca)) / u\_resolution).r;
  float g = texture2D(u\_background, baseUV).g;
  float b = texture2D(u\_background, uv + (grad \* (displace - ca)) / u\_resolution).b;
  vec3 color = vec3(r, g, b);

  // Saturation
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, u\_saturation);

  // Tint
  color = mix(color, u\_tintColor, u\_tintOpacity);

  // Fresnel-style specular: brighter where the edge normal faces the light
  float facing = max(dot(grad, normalize(u\_lightDir)), 0.0);
  float specular = pow(facing, 3.0) \* rim \* 0.9;
  color += specular;

  gl\_FragColor = vec4(color, 1.0);
}
```

**Blur:** implement as a separate low-cost two-pass Gaussian blur applied to the background texture *before* the displacement pass, blended by the Blur slider value — don't try to fold blur math into the same pass as the displacement loop.

**Performance note:** this shader only needs to run over the glass shape's bounding box, not the full canvas — scissor or restrict the draw call to that region for a meaningful perf win, especially with multiple shapes (stretch goal).

\---

## 7\. Suggested File / Component Structure

```
src/
  components/
    GlassCanvas.tsx       — WebGL context, background texture upload, render loop
    GlassShape.tsx         — drag handling, position/spring state, hit-testing
    ControlPanel.tsx       — the floating glass-styled control dock
    Slider.tsx              — fully custom slider control
    ColorSwatchPicker.tsx
    ShapeSwitcher.tsx       — circle / squircle / pill / blob toggle
    BackgroundPicker.tsx    — preset thumbnails + upload
    PresetGallery.tsx
  shaders/
    glass.frag.glsl
    glass.vert.glsl
    blur.frag.glsl
  lib/
    sdf.ts                  — signed distance functions per shape type
    luminance.ts             — sample background luminance under a point, for text contrast
    springConfig.ts
  store/
    glassStore.ts            — zustand store: shape, position, all params, background, text
  assets/
    backgrounds/              — curated preset images
  App.tsx
```

\---

## 8\. Detail Specs

### 8.1 Drag \& positioning

* Support both mouse (`pointerdown/move/up`) and touch, via the Pointer Events API so one code path handles both.
* Clamp the shape's center so at least \~40% of its bounding box always stays within the canvas.
* While dragging, update position every animation frame; on release, let the spring settle rather than stopping instantly.

### 8.2 Specular highlight behavior

* Resting state: a soft, low-intensity highlight arc along the edge facing the light direction (assume light from upper-left, \~45°, matching the reference shader's `u\_lightDir`).
* On drag start: highlight intensity briefly increases (\~120ms ease-out) and slightly elongates, as if the material is reacting to touch.
* On drag end: highlight relaxes back to resting intensity over \~300–400ms.

### 8.3 Motion / spring values

* Default ("medium" elasticity): stiffness ≈ 300, damping ≈ 30 (Framer Motion units) — produces a settle time around 250–400ms with a very slight overshoot (roughly 4–6% scale) in the direction of the release velocity, not a wobbly bounce.
* "Low" elasticity: stiffer/less overshoot, feels more precise.
* "High" elasticity: looser, more visible squish/settle — should still look controlled, not jelly.
* Every slider value change (not just position) should animate to its new value over \~150ms rather than snapping, including when a preset is applied.

### 8.4 Background image selection criteria

Pick or source images that actually show the effect off — flat, low-detail images make refraction invisible. Good choices: a colorful abstract gradient-mesh wallpaper, a city skyline at night with bokeh light points, a macro nature photo with strong color contrast, an architectural photo with straight lines (straight lines bending at the glass edge is one of the clearest "this is really refracting" tells). Avoid a single flat color or a low-contrast photo as a default. Source royalty-free/stock imagery you have rights to use — do not use copyrighted brand photography.

### 8.5 Preset values

|Preset|Blur|Saturation|Refraction|Rim Width|Tint|Tint Opacity|Chromatic Aberration|
|-|-|-|-|-|-|-|-|
|Subtle|8px|115%|15|10px|none|0%|0|
|Frosted|20px|130%|35|18px|white|8%|5|
|Crystal Clear|2px|105%|60|22px|none|0%|15|
|Tinted Blue|14px|120%|40|16px|#4A90E2|18%|8|
|Control Center|24px|140%|45|20px|black|10%|6|

\---

## 9\. Accessibility \& Performance

* Every slider needs a proper `aria-label`, keyboard operability (arrow keys to adjust), and a visible focus ring.
* The glass shape itself should be keyboard-movable (arrow keys nudge position) for users who can't drag.
* Respect `prefers-reduced-motion`: fall back to near-instant transitions instead of springs/overshoot when set.
* Maintain sufficient contrast in the control panel chrome itself (text over the glass material needs a legibility safeguard — a subtle scrim behind panel text is acceptable).
* Target a steady 60fps during drag on a mid-range laptop; avoid re-rendering the full React tree on every animation frame — isolate the WebGL/canvas update path from React's render cycle.
* Responsive down to \~375px width: control panel collapses into a bottom drawer with a drag handle rather than squeezing a sidebar into a phone-width screen.

\---

## 10\. Explicit Anti-Patterns — Do Not Do These

* Do not implement "liquid glass" as `backdrop-filter: blur(Npx)` with a semi-transparent white/black overlay and call it done. That is the exact cliché this project exists to avoid. Edge refraction is mandatory, not optional polish.
* Do not use unstyled native `<input type="range">` or `<input type="color">` elements.
* Do not default to a generic purple-to-blue gradient background — pick imagery with real detail and contrast (Section 8.4).
* Do not use default browser fonts, default box-shadow values, or an unstyled system dashboard layout for the control panel.
* Do not skip hover/press/loading/empty states — an app with only one visual state per element reads as unfinished.
* Do not hardcode a single fixed background image with no way to change it.
* Do not let slider/value changes snap instantly with zero transition.

\---

## 11\. Acceptance Checklist (self-verify before calling this done)

* \[ ] The glass shape visibly bends straight lines/edges in the background near its border — not just blurs them.
* \[ ] The center of the glass is calmer/clearer than the rim, consistent with a real lens.
* \[ ] A specular highlight is visible, sits along the light-facing edge, and visibly reacts (brightens/elongates) when the shape is grabbed.
* \[ ] Dragging feels physically responsive: no input lag, spring settle on release, no linear/robotic motion.
* \[ ] All sliders update the render live, with no flicker, and show a numeric readout.
* \[ ] Text placed inside the glass stays legible as the shape moves over both light and dark background regions.
* \[ ] No raw/unstyled native form controls are visible anywhere in the UI.
* \[ ] The app sustains a smooth frame rate while dragging on a mid-range laptop.
* \[ ] Layout is responsive down to \~375px width without breaking.
* \[ ] On first load, with zero interaction, the screen already looks like a finished, designed product — not a scaffold waiting to be styled.
* \[ ] If any part of Section 6/Tier 1 wasn't fully achievable, it's clearly noted in code comments/README, not silently downgraded.

\---

## 12\. Stretch Goals (only after everything above is solid)

* Multiple simultaneous glass shapes that visually interact/overlap.
* Mouse-based or gyroscope-based tilt, giving the glass a subtle parallax/3D-lens feel as the viewing angle implicitly shifts.
* Light/dark ambient mode toggle that swaps the canvas surround and adjusts default light direction.
* Shareable state via URL query params so a specific configuration can be linked.
* Undo/redo on control changes.
* Freeform blob shape via draggable bezier/metaball control points.

\---

*End of spec. Build Section 1 through Section 9 to a high standard before attempting anything in Section 12.*

