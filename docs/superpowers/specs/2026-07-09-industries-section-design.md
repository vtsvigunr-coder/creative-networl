# Industries — "Built across markets" section

**Date:** 2026-07-09
**Figma:** file `ZgDuY3MU3kHkGCpJamyy2T`, frames `205:336…205:461` (pack 1 + hovers), `373:241…373:474` (transition + packs 2/3 + hovers).
**Status:** approved design, ready for implementation plan.

## Summary

A new pinned-scrub section added to the existing single-page site (vanilla HTML/CSS + GSAP/ScrollTrigger), placed **after the Works section**. It presents three "packs", each a 2×2 grid of image cards under the shared heading **"Industries — Built across markets"**. Two behaviours combine:

1. **Hover magnify (ref.digital-style)** — hovering a card enlarges it while the other three shrink by proximity; the card's corner label reveals a one-line description; a "Play showreel" pill + cursor arrow float on the hovered card following the pointer.
2. **Scroll-driven pack cycling** — as the user scrolls, the current pack drifts to the top-left corner shrinking and fading out while the next pack rises in from the bottom-right, settling in the center. Three packs total.

## Placement & page flow

Insert as a new `<section class="industries" id="industries">` in `index.html` immediately **after** `<section class="works">` (line ~314) and before `</main>`. Matches the menu tab order (Info · Artists · Works · Industries).

## Layout (design canvas 1440×900, all dims via `--s`)

- White background (`#fff`), full section.
- **Header block** centered, `top: 120px`: the orange spark + "Industries" eyebrow (16px medium), then "Built across markets" (52px regular, tracking −1.04). Identical markup to the existing eyebrow/spark used elsewhere — reuse the `.spark` SVG.
- **Four corner labels** (32px regular, tracking −0.64), fixed per pack:
  - TL `left:80, top:304` · TR `right-aligned near left:1161, top:304`
  - BL `left:80, top:764` · BR `left:~1161, top:764`
- **Card grid**: 520×522 box centered horizontally, vertical center at `top: calc(50% + 115px)`. CSS grid, 2 cols × 2 rows, gap 2px, each cell 259×259 at rest, `border-radius: 8px`, `object-fit: cover` images.

### Corner ↔ card mapping (per pack)

| corner | pack 1 | pack 2 | pack 3 |
|---|---|---|---|
| TL | Technology | Ecommerce | Cafe |
| TR | Food & Drinks | Nature | Software |
| BL | Fashion | Consultant | Sports |
| BR | Architecture | Product | Podcast |

### Descriptions (16px/20px, `#a1a1a1`, 270px wide, ~52px below its label)

Pack 1: Technology — "Brand systems for ambitious digital products and technology companies." · Food & Drinks — "Packaging and visual experiences designed to stand out on every shelf." · Fashion — "Distinctive identities built for modern brands and cultural relevance." · Architecture — "Refined branding for spaces, studios and visionary developments."

Pack 2: Ecommerce — "Building trusted brands that convert visitors into customers." · Product — "Creating distinctive identities that elevate products and perception." · **Nature — "Organic identities rooted in sustainability and natural materials." (placeholder)** · **Consultant — "Authoritative brands that signal expertise and build client trust." (placeholder)**

Pack 3: Software — "Crafting digital brands that simplify complex products beautifully." · Sports — "Bold identities designed to inspire fans and communities." · **Cafe — "Warm, inviting identities crafted for hospitality and everyday rituals." (placeholder)** · **Podcast — "Distinct audio-first brands that build loyal, engaged audiences." (placeholder)**

Placeholders are marked in the source with a `<!-- TODO copy -->` comment so they are trivially swappable.

## Interaction 1 — hover magnify

Implemented as **animated CSS grid tracks** (not bespoke absolute coords), which reproduces the measured Figma sizes and reads identically to ref.digital:

- At rest: `grid-template-columns: 1fr 1fr`, `grid-template-rows: 1fr 1fr` (259/259).
- On hovering a card, tween the hovered card's column and row to the "large" fraction and the other column/row to the "small" fraction so that: hovered ≈ 280, same-row & same-col neighbours ≈ 244–250, diagonal ≈ 214. Concretely two proxies `colBias` and `rowBias` (0 = left/top favoured, 1 = right/bottom favoured) tweened with GSAP; tracks computed as `large`/`small` from the hovered card's col/row. Cards keep `object-fit: cover` so non-square cells stay clean.
- The hovered card gets a subtle lift (`z-index`, faint shadow) matching the design.
- Description: only the hovered corner's `.industries__desc` fades/rises in (opacity + small `y`); others stay hidden.
- **Play-showreel pill + cursor arrow**: one shared pill element (`rgba(0,0,0,0.1)` bg, `0.6px` white border, `border-radius:40`, 16px label "Play showreel") + a 28px cursor-arrow icon, both `position:absolute` inside the grid, `quickTo`-following the pointer within the hovered card (same technique as the existing `.btn--showreel` in `initShowreel`). Hidden when no card is hovered.
- Hover handlers are **only active while a pack is "settled"** (centered, transition progress ≈ 0). Leaving a card returns tracks to 1fr/1fr.

## Interaction 2 — scroll pack cycling

A pinned scrub stage, same pattern as `initWorksStage`/`initAboutStage`:

- Markup: `.industries-stage` (tall, sets scroll length) → `.industries-sticky` (`position:sticky; top:0; height:100vh; overflow:hidden`) → `.industries-inner` (1440×900 box, `transform: translate(-50%,-50%) scale(var(--ifit,1))`, centered; `--ifit` computed in JS from viewport height, mirroring `--wfit`).
- Three pack DOM nodes (`.ind-pack`, data-index 0/1/2) absolutely positioned, each containing its own 2×2 grid, four corner labels, four descriptions, and sharing one pill.
- Stage height: `calc(N * var(--s))`. Two transitions + three settle-holds ≈ **6000** units (match Works' weight); tune during implementation. Timeline proxy `p` 0→1 drives `render(p)`.
- `render(p)` maps `p` to a pack index + local phase:
  - **settle window** (pack centered, opacity 1, grid at rest, hover enabled),
  - **transition window** (current pack tweens to `(−510*s, −354*s)`, `scale ~0.72`, opacity 1→0 toward top-left; next pack tweens from bottom-right `(~+540*s, ~+380*s)`, `scale ~0.8`→1, opacity 0→1 into center). Measured mid-transition anchors from Figma: outgoing `(−510,−239)`@opacity .15, incoming `(+380,+109)`@opacity .8 — used to set the easing endpoints/directions.
- Only the active/settled pack has `pointer-events:auto`; packs mid-transition or off-stage are `pointer-events:none` and hover is disabled.
- Corner labels + heading: heading is shared/static; corner labels belong to each pack (they change text per pack) and travel/fade with their pack.

## Reduced-motion / touch fallback

Per approval: **show all three packs as plain static 2×2 grids** with their descriptions always visible, no pin, no scrub, no magnify — consistent with how the site's other stages degrade under `body.no-motion` (`height:auto`, `position:static`). Guarded by the existing `reducedMotion` / `touchDevice` checks in `main.js`.

## Assets

12 images (4 per pack) downloaded from Figma into `assets/industries/` (or existing asset convention) and referenced by relative path. Pack-1 & pack-2 asset URLs already captured; pack-3 base URLs fetched during implementation from frames `373:445`/`373:415`. The orange spark and cursor-arrow are inline SVG (reuse existing spark; export cursor arrow `205:393`).

## Files touched

- `index.html` — new `<section class="industries">` markup after Works.
- `css/style.css` — `.industries*` block following the `.works*` block; `body.no-motion .industries-*` fallbacks.
- `js/main.js` — new `initIndustriesStage()` (scrub + pack cycling + hover magnify + pill follow), called from `boot()`; static fallback under reduced-motion/touch.
- `assets/industries/` — 12 images + cursor-arrow SVG.

## Out of scope

- Wiring "Play showreel" to an actual video/lightbox (pill is visual per design; click can be a no-op or reuse the existing showreel expand later).
- Menu "Industries" tab scroll-to behaviour (can be a follow-up).
