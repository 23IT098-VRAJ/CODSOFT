# TaskFlow — Frontend Improvements

What changed in the Task-2 web app, and how the five skills in `.claude/skills/` were applied to it. The visual identity — the warm "Quartz" neutrals and near-black ink — is unchanged. The backend rebuild is described in the [README](README.md).

---

## 1. Foundation

| Before | Now |
|---|---|
| `package.json` did not list `react` or `react-dom`; the app only ran because they happened to be installed | Both are declared, with the other libraries the app uses |
| `npm run build` ran a TypeScript check over leftover Vite template files (`main.ts`, `counter.ts`, `style.css`, sample images) | The unused template files and `tsconfig.json` are gone; the build is just `vite build`. The project is JavaScript, and says so |
| The palette was repeated as raw hex codes (`#1A1917`, `#E5E2DC` …) in every file | The palette is named once in `tailwind.config.js` (`ink`, `paper`, `line`, `muted` …) and a small design system in `index.css` (`btn-primary`, `input`, `card`, `badge`) is used everywhere |
| Any `401` reloaded the whole page — which is why a wrong password could never show its message | A `401` now signs the user out through the router; nothing reloads and messages stay on screen |
| The session was read after the first render, so a refresh flashed blank | The session is read immediately and confirmed with `GET /api/auth/me` |
| `window.confirm` for deleting things; errors only in the console | Confirmation dialogs that match the app; toast messages for every success and failure |
| Two near-identical pages for creating and editing a project | One `ProjectForm` page for both |
| Every page shipped in one bundle | Each page is its own chunk, loaded on first visit |

## 2. Features now in the web app

All of these existed in the API after the backend rebuild but had no screen:

- **Personal dashboard** — my open tasks, overdue count, what is due this week, recent activity across projects; plus search and status tabs for the project grid.
- **My tasks** — everything assigned to me in any project, as Open / Overdue / Done.
- **Task details panel** — a drawer instead of a modal, so the board stays visible; with a **comment thread**. Each task has its own link (`?task=…`), and the browser's back button closes the panel.
- **Overview tab** — completion ring, tasks by status, open tasks by priority, overdue / unassigned / done-this-week, workload per member, and the project's activity feed.
- **List view** — now sortable by any column.
- **Filters** — search, priority, assignee and overdue, on both board and list.
- **Members** — see everyone, invite by email, remove a member (owner) or leave (member).
- **Profile** — rename yourself, change your password.
- **Project settings** — colour swatches, and a clearly separated danger zone (delete for the owner, leave for members).

## 3. Drag and drop

The board used to update only the dragged card's position and leave its neighbours untouched, so the screen and the database drifted apart. Dropping a card now re-numbers the column it left and the column it joined, on screen, using the same rule as the server — and reverts with a message if the server refuses.

Dragging is switched off while a filter is active, with a line explaining why: a drop position only means something when the whole column is visible.

Checked with real drags through the library's keyboard dragging: reordering within a column and moving between columns both left the screen and the server in the same gap-free order.

---

## 4. How the skills were applied

TaskFlow is a tool people work in all day, not a landing page. That decides most of this section: the **motion** house rules say that app chrome only fades, that anything the user does often should not animate, and that nothing they start should run longer than 300 ms. So the motion here is quiet on purpose.

| Skill | What it contributed |
|---|---|
| **motion** (house rules) | The rulebook. Every curve, duration and spring comes from one file, `client/src/lib/motion.js`, built to these rules. See the audit below |
| **framer-motion** (performance) | Lazy-loaded animation engine with the light `m` element and `strict` mode; cursor and scroll effects on motion values, not React state; `layout="position"`; only `transform` and `opacity` animated |
| **motion-ui** | The sliding tab control (segmented control), progress ring (SVG `pathLength`), drawer and dialog timings, the backdrop on the sign-in panel (soft spotlight), and its shared spring for sliding indicators. Its `minimal` style preset matches the existing look, so no restyling was needed |
| **animated-component-libraries** | `CountUp` (React Bits) for dashboard and report figures; the staggered `ActivityFeed` (Magic UI "Animated List") |
| **gsap-framer-scroll-animation** | The reveal-on-scroll wrapper (recipe 2) and the top bar that gains a shadow once the page scrolls under it. Parallax, pinning and scrubbing were **not** used — an app screen is not a scroll story, and GSAP was not added |

### Where things move

| Place | Motion |
|---|---|
| Page changes, and switching Board / List / Overview | Cross-fade, opacity only, 150 ms each way |
| Top-bar links and every tab control | One highlight pill glides to the active item |
| Task details | Drawer slides in over 400 ms and out over 350 ms |
| Dialogs, the account menu | 200 ms in from 0.95 scale, 150 ms out; the menu grows from the corner under its button |
| Toasts | 200 ms in, 150 ms out; the others slide to make room |
| Dashboard and overview figures | Count up once when first seen |
| Progress bars, chart bars, completion ring | Grow using `scaleX` / `pathLength` |
| Lists and grids | Items reveal 40 ms apart, once per session |
| Comments and member rows | Fade out when removed; the rest close the gap |
| Buttons | Press scales to 0.98 |
| Show / hide password | Icon cross-fades through a small blur |
| Sign-in panel | A miniature board whose cards glide from column to column |

**Deliberately still:** typing, filtering, sorting, the quick-add field, and the cards on the board themselves — the drag library owns their movement, and adding another animation on top would fight it.

### Audit against the motion house rules

| Rule | How it is met |
|---|---|
| `motion-opacity-for-chrome` | Pages and view switches only fade |
| `motion-no-replay-on-entry` | The first page appears without animating; reveals and the sign-in entrance play once per session |
| `motion-no-flash-on-return` | The dashboard shows its last data at once on return and refreshes quietly (kept per account) |
| `motion-under-300ms`, `motion-close-faster` | 150–200 ms for state changes; closes shorter than opens; only the drawer is longer |
| `motion-strong-ease-out`, `motion-name-the-properties` | The default Tailwind transition uses `cubic-bezier(0.23, 1, 0.32, 1)` and lists only opacity, shadow, transform and filter |
| `motion-instant-hover-color` | Colour is not in that list, so hover colours change instantly |
| `motion-press-scale`, `motion-no-scale-from-zero` | Presses scale to 0.98; entrances start at 0.95 |
| `motion-origin-from-trigger` | The account menu scales from its top-right corner |
| `motion-short-stagger` | 40 ms in lists; 100 ms only for the one-off sign-in entrance |
| `motion-no-motion-on-repeat` | Nothing animates on typing, filtering or sorting |
| `motion-exit-in-presence` | Every element with an exit sits inside `AnimatePresence` with a stable key |
| `motion-hold-content-size` | The task panel keeps showing its task while it slides out |
| `motion-gesture-alternative` | Dragging also works from the keyboard, and status can be changed from the task panel |
| `motion-changing-axis-only` | Bars animate `scaleX`, not `width` |
| `motion-reduced-motion` | `MotionConfig reducedMotion="user"`, a `prefers-reduced-motion` CSS rule, and the sign-in preview holds still |

**Not verified:** how the timings feel at full speed. The preview pane ran in the background during testing, which throttles animation to a few frames a second, so durations were confirmed in code, not by eye.

### Deliberately not applied

| From | What | Why |
|---|---|---|
| motion-ui | Its auto-updater step (`node bin/updater.mjs`) | It would download and run code from the internet |
| motion-ui | Shader backgrounds, tilt and spotlight cards, glow / iOS / brutalist presets | Right for a marketing hero; distracting in a work tool |
| motion | The `@web-kits/motion-blur` package | Its own rule limits blur to fast, thrown motion; nothing here is thrown |
| gsap-framer-scroll-animation | GSAP, pinning, parallax, horizontal scroll | No scroll-driven story to tell |
| animated-component-libraries | Marquee, border beam, shimmer button, WebGL backgrounds | Decoration that an app screen does not need |

---

## 5. Accessibility

- Dialogs and the drawer close on Escape, trap the page scroll behind them, and are labelled for screen readers.
- Tabs, sortable column headers, the colour picker and the progress bars expose their state (`aria-selected`, `aria-sort`, `aria-checked`, `aria-valuenow`).
- A visible focus ring on every control.
- Form errors appear next to the field and are announced.
- Reduced motion is honoured throughout.

## 6. Size

Initial JavaScript is about 129 kB gzipped (React 19, the router, axios and the app shell). Loaded later, on demand: the animation engine (21 kB), the board with the drag library (38 kB), and each other page (1–3 kB).

## 7. How it was checked

- Production build succeeds; the 41 server tests still pass.
- Run in a browser against the in-memory demo API: sign-in (including a wrong password), dashboard, opening a project, real drags within and between columns, editing a task in the panel, posting a comment, the overview, the list view, the members dialog and removing a member, my tasks, and the profile page. No console errors beyond the expected failed login.
- **Not checked:** registering a new account through the form, creating and deleting a project through the form, changing a password, drag with a mouse or on a touch screen, Safari and Firefox, a real phone, and the "reduce motion" setting switched on.

## 8. Known gaps

- **No live updates** — another member's changes appear after a refresh.
- **The board scrolls sideways on phones** rather than stacking its columns.
- **No automated frontend tests**; the checks above were done by hand in a browser.
- **Dark mode** is not implemented, though the named palette makes it a contained change.
