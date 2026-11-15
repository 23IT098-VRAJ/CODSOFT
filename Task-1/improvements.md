# ShopIndi — Motion & Modern UI Improvements

How the store was given motion, and how that motion was then held to a standard. Five skills from `.claude/skills/` were applied, in two passes:

| Skill | What it is | Role here |
|---|---|---|
| **animated-component-libraries** | Magic UI and React Bits component collections | Pass 1 — the first set of animated components |
| **motion-ui** | 617 Motion + Tailwind components, with shared easing and spring tokens | Pass 2 — the new hero, shader and gradient backdrops, tilt and spotlight cards, headline reveal, tokens |
| **motion** | House rules for motion: what animates, curves, durations, presses, exits, reduced motion | Pass 2 — an audit; every finding fixed |
| **framer-motion** | 42 performance rules for Motion in React | Pass 2 — bundle size, re-renders, layout animation |
| **gsap-framer-scroll-animation** | Scroll-linked and scroll-triggered recipes | Pass 2 — parallax layers, clip-path reveal, reveal wrapper |

Nothing about how the shop works changed in either pass — ordering, stock, auth and the admin tools behave as before.

---

## 1. The hero, rebuilt

The first version used an animated square grid behind centred text. It was replaced entirely.

**Background — three layers, back to front** ([Hero.jsx](client/src/components/Hero.jsx))

1. **`EmberBackdrop`** — a layered CSS gradient adapted from motion-ui's *Dark Ember* and *Dark Midnight Mesh* backgrounds: midnight lit from below by gold, an indigo counter-light, film grain and a vignette. It paints instantly and is the whole backdrop if WebGL is unavailable.
2. **`ShaderBackground`** — motion-ui's shader component (Paper Shaders, WebGL) running its *god rays* variant: soft shafts of gold light that drift slowly. It is loaded as a separate chunk after the hero has painted, blended over layer 1, and frozen on one frame under reduced motion.
3. A left-to-right scrim so the headline stays readable over the brightest rays.

**Layout** — the copy moved to the left; the right side is a **floating stack of three real top-rated products** from the API. Each card links to its product, leans toward the cursor in 3D (motion-ui `TiltCard`), bobs gently, and shows price and rating.

**Entrance** — a staged sequence, 100 ms apart: badge → headline word by word (motion-ui `TextReveal`) → text → buttons → statistics counting up. It plays once per session.

**On scroll** — the *parallax layers* recipe: the backdrop swells slightly, the copy sinks and fades, and the three cards rise at three different speeds, which is what gives the stack depth.

---

## 2. Component library

All in [client/src/components/motion/](client/src/components/motion/). Each is an adaptation written in JSX for this codebase and themed to the gold / midnight palette — not a verbatim copy.

| Component | Source | What it does |
|---|---|---|
| `ShaderBackground` | motion-ui | GPU-rendered animated backdrop (god rays, mesh gradient, grain gradient) |
| `EmberBackdrop`, `SoftSpotlightBackdrop` | motion-ui background-gradient | Layered CSS backdrops — dark (hero, call-to-action) and light (login, register) |
| `TextReveal` | motion-ui | Headline arriving word by word |
| `TiltCard` | motion-ui | Surface leans toward the cursor in 3D, with a glare |
| `SpotlightCard` | motion-ui | A pool of light follows the cursor; a beam circles the border on hover |
| `Reveal` | scroll skill, recipe 2 | Fade-and-rise the first time content scrolls into view |
| `IconSwap` | motion house style | An icon changing in place cross-fades through a small scale and blur |
| `CountUp` | React Bits | A number counts up when it becomes visible |
| `Magnet` | React Bits | The child is pulled gently toward the cursor |
| `ShimmerButton` | Magic UI | Call-to-action with a sweeping band of light |
| `BorderBeam` | Magic UI | A streak of light travelling round a card's border |
| `Marquee` | Magic UI | Endless seamless scrolling strip |
| `ScrollProgress`, `PageTransition`, `BackToTop`, `MobileDock` | `chrome.jsx` | App-wide pieces |
| `celebrate()` | `lib/confetti.js` | Confetti on a placed order |

**Tokens** — [client/src/lib/motion.js](client/src/lib/motion.js) is the single source for every curve, duration, stagger and spring. Similar things now always move alike, and a timing can be changed in one place.

Removed in pass 2: `AnimatedGridPattern` (the grid), `BlurText` (replaced by `TextReveal`), `BlurFade` (replaced by `Reveal`).

---

## 3. Audit against the motion house rules

The first pass was reviewed rule by rule against the **motion** skill. Every finding below was fixed.

| Rule | What was wrong | Now |
|---|---|---|
| `motion-opacity-for-chrome` | Pages slid up 14 px on every navigation | Pages cross-fade, opacity only |
| `motion-no-replay-on-entry` | The first page animated in on load; scroll reveals replayed on every visit | First page simply appears; reveals and the hero entrance play once per session |
| `motion-no-flash-on-return` | Going back to Home or the catalogue flashed skeletons again | Both show cached data at once and refresh in the background |
| `motion-press-scale` | Presses squashed to 0.75–0.9 | Every press scales to 0.98 |
| `motion-no-scale-from-zero` | Counters, chips, ticks and the back-to-top button grew from 0–0.6 | Entrances start at 0.95 with a fade |
| `motion-icon-crossfade` | Heart and cart→tick swapped with a bounce or a slide | Both use the icon-swap cross-fade (`IconSwap`) |
| `motion-under-300ms` | Hover effects ran 300–500 ms; the timeline 450 ms per step | Hover movement 180 ms; state changes 200 ms; only the filter drawer is longer (400 ms) |
| `motion-close-faster` | Modals, menus and toasts left as slowly as they arrived | Opens 200 ms, closes 150 ms; drawer 400 / 350 ms |
| `motion-ease-by-direction` | Toasts and the product editor bounced on springs | They ease; springs are kept for cursor-following and sliding indicators |
| `motion-strong-ease-out` | Bare `easeOut` / `ease-out` throughout | `cubic-bezier(0.23, 1, 0.32, 1)` — also the default for every Tailwind `transition` |
| `motion-instant-hover-color` | Buttons and links faded their colour on hover | Colour changes are instant; only movement and shadow ease |
| `motion-name-the-properties` | Bare `transition` animated every property | The default list is opacity, shadow, transform and filter |
| `motion-short-stagger` | Grids staggered 60–70 ms per item | 40 ms for lists; 100 ms only for the one-off hero entrance |
| `motion-blur-untracked-only` | Every scroll reveal blurred the text sliding into view | Reveals no longer blur; blur remains only on the one-off headline and on icon and image cross-fades |
| `motion-changing-axis-only` | Rating bars animated `width` | They animate `scaleX` |

Checked and already compliant: exits inside `AnimatePresence` with stable keys, the account menu growing from its trigger corner, no motion on typing, and reduced motion.

**Not verified:** the rules that depend on feel at full speed (whether 180 ms reads right on hover, whether the drawer curve feels natural). The preview pane was running in the background during testing, which throttles animation to a few frames a second, so timings were confirmed in code, not by eye.

---

## 4. Performance (framer-motion skill)

| Rule | Change |
|---|---|
| `bundle-lazy-motion` | Every component uses the light `m` element instead of `motion` |
| `bundle-dynamic-features` | The animation engine is a separate chunk, fetched after first paint |
| `bundle-strict-mode` | `<LazyMotion strict>` — importing the full `motion` element by mistake now throws in development |
| `rerender-variants-object`, `rerender-animate-prop` | Animation objects are shared constants, not re-created on each render |
| `rerender-motion-value`, `rerender-use-transform` | Scroll and cursor effects run on motion values, so scrolling or moving the mouse does not re-render React |
| `layout-position-size` | Cart lines, toasts and filter chips use `layout="position"` |
| `anim-transform-properties` | Only `transform`, `opacity`, `filter` and `clip-path` are animated |
| `scroll-use-spring-smooth` | The scroll progress bar is smoothed with a spring |

**Result.** Initial JavaScript, gzipped:

| | Main bundle | Loaded later, on demand |
|---|---|---|
| Before any animation | ~81 kB | — |
| After pass 1 | ~138 kB | confetti |
| **Now** | **~106 kB** | animation engine 23 kB · hero shader 32 kB · confetti |

`domMax` is used rather than the smaller `domAnimation` because the app relies on layout animation (sliding nav underline, dock highlight, cart lines, toasts).

---

## 5. Scroll effects (gsap-framer-scroll-animation skill)

The skill's own selector says: React with declarative components → Motion; GSAP for pinned timelines and horizontal scroll. Nothing here pins or scrolls sideways, so **GSAP was not added** — a second animation library would have cost bundle size for no gain.

| Recipe | Where |
|---|---|
| 1 — Scroll progress bar | Top of every page |
| 2 — Reusable reveal wrapper | `Reveal`, used across all pages |
| 3 — Parallax layers | Hero: backdrop, copy and three product cards at different speeds |
| 5 — Reveal with clip-path | Closing call-to-action opens from an inset as it scrolls into view, and closes again if you scroll back |
| 6 — Navbar hides on scroll down | Navbar |
| 7 — Staggered card grid | Product grids, bento, reviews |

---

## 6. Everything else that moves

Unchanged in intent from pass 1, now on the shared tokens:

- **Everywhere** — navbar that tucks away on scroll down and turns to frosted glass; sliding active-link underline; counters that pop when they change; toasts with a countdown bar; shimmer skeletons; back-to-top button; a bottom dock on phones.
- **Home** — brand marquee; bento category grid (now spotlight tiles); two-row review marquee; closing call-to-action.
- **Catalogue and cards** — staggered reveal, hover lift, filter chips and a sliding filter drawer.
- **Product page** — cross-fading gallery, rating bars that grow into view.
- **Cart, checkout, orders** — lines leave smoothly and the total rolls to its new value; confetti and a success banner on a placed order; a tracking timeline that draws itself.
- **Login and register** — soft spotlight backdrop and a border beam on the card.
- **Admin** — dashboard figures count up; the product editor fades in over a blurred backdrop.

The brand and review marquees use real data from two small server additions made in pass 1: top brands in `GET /api/products/meta`, and `GET /api/reviews/featured`.

---

## 7. Accessibility

- **Reduced motion** is honoured in three places: `<MotionConfig reducedMotion="user">` turns off movement driven by Motion; scroll-linked effects check `useReducedMotion()` and hold still; a `prefers-reduced-motion` rule stops looping CSS decoration. The shader freezes, `CountUp` shows the final number, and confetti is skipped.
- **Cursor effects switch off on touch screens** (tilt, spotlight), where "hover" would stick after a tap.
- Decoration is hidden from screen readers; the animated headline is announced once as a whole sentence; marquees announce their content once.
- Nothing is reachable only by hover or by a gesture.

---

## 8. Deliberately not applied

| From | What | Why |
|---|---|---|
| motion-ui | Its auto-updater step (`node bin/updater.mjs`) | It would download and run code from the internet; the bundled components were used as they are |
| motion-ui | Style presets, agent surfaces, dashboards, calendars, device mock-ups | Not relevant to a storefront; the existing design system was kept |
| motion | The `@web-kits/motion-blur` package | Its rule is to blur only fast, untracked motion such as a flung card. Nothing here is thrown, so no streaks were added |
| gsap-framer-scroll-animation | GSAP / ScrollTrigger | No pinned or horizontal-scroll section to justify a second library |
| gsap-framer-scroll-animation | The *premium-frontend-ui* companion skill it refers to | Not present in `.claude/skills` |

---

## 9. Bugs fixed along the way

- **Order summary covered the checkout button** on tall screens (from the original rebuild): only the summary was sticky. The whole column is now sticky.
- **Gradient headline was invisible**: gradient text on a parent does not show through animated child words. The gradient is now applied to each word.

---

## 10. How it was checked

- Production build succeeds; server tests pass (48/48).
- Run in a browser against the in-memory demo API: the new hero, the full home page, page-to-page navigation and back, adding to cart, the cart, and the login page. No new console errors, and strict mode raised nothing.
- **Not checked:** the operating system's "reduce motion" setting switched on; Safari and Firefox; a real phone; a device without WebGL (the CSS backdrop is designed to cover that case but it was not exercised); and animation timing by eye, as noted in section 3.

## Ideas for a next pass

- **Dark mode** — `midnight` is used both as a background and as heading text, so it needs splitting into two tokens first.
- **Shared-element transition** from a product card's image to the product page.
- **Sticky add-to-cart bar** on the product page for phones.
- **Animated checkout stepper** in place of the single form.
