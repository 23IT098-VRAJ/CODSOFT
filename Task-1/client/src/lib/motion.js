// Motion tokens — the single place every animation in the app takes its
// curve, duration and spring from, so similar things always move alike.
//
// Curves and durations follow the `motion` house-style skill; the springs are
// the shared physics from the `motion-ui` skill (lib/ease.ts).

// ── Curves ────────────────────────────────────────────────────────────
export const EASE_OUT = [0.23, 1, 0.32, 1]; // things entering or leaving
export const EASE_IN_OUT = [0.77, 0, 0.175, 1]; // things moving on screen, page changes
export const EASE_DRAWER = [0.32, 0.72, 0, 1]; // full panels and drawers

// ── Durations (seconds) ───────────────────────────────────────────────
// Nothing the user starts runs longer than 0.3s, except a full drawer.
export const DUR = {
  press: 0.15, // press and hover movement
  state: 0.2, // toggles, small state changes, toasts, popovers entering
  exit: 0.15, // a close is always shorter than its open
  page: 0.15, // each half of a page change
  drawerIn: 0.4,
  drawerOut: 0.35,
  reveal: 0.4, // scroll reveals: ambient, not user-started
};

export const T_STATE = { duration: DUR.state, ease: EASE_OUT };
export const T_EXIT = { duration: DUR.exit, ease: EASE_OUT };

// ── Staggers (seconds between items) ──────────────────────────────────
export const STAGGER_LIST = 0.04; // lists and grids: under 50ms each
export const STAGGER_STAGED = 0.1; // a one-off staged entrance: title, text, actions

// ── Springs ───────────────────────────────────────────────────────────
export const SPRING_MOUSE = { stiffness: 200, damping: 15, mass: 0.3 }; // cursor-follow: tilt, magnet
export const SPRING_LAYOUT = { type: 'spring', stiffness: 360, damping: 32, mass: 0.6 }; // sliding pills and indicators
export const SPRING_SWAP = { type: 'spring', duration: 0.3, bounce: 0 }; // icon swaps

// ── Reusable gestures and variants ────────────────────────────────────
// A pressed control scales lightly — never a dramatic squash.
export const PRESS = { scale: 0.98 };

// Entrances start from 0.95 or higher, never from zero.
export const POP = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: T_STATE },
  exit: { opacity: 0, scale: 0.95, transition: T_EXIT },
};

// An icon that swaps in place (cart → tick, empty heart → full heart)
// cross-fades through a small blur so it reads as one object changing.
export const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.25, filter: 'blur(4px)' },
  transition: SPRING_SWAP,
};

// ── Entrances do not replay ───────────────────────────────────────────
// Scroll reveals play the first time a page is seen in a session. Coming
// back to a page shows it at once, with nothing fading in again.
const visitedPaths = new Set();
export const hasVisited = (pathname) => visitedPaths.has(pathname);
export const markVisited = (pathname) => visitedPaths.add(pathname);
