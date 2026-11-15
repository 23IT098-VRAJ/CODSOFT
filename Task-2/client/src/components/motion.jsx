// Motion building blocks. Every curve and duration comes from lib/motion.js.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, AnimatePresence, m, useInView, useReducedMotion } from 'motion/react';
import { DUR, EASE_IN_OUT, EASE_OUT, ICON_SWAP, hasVisited, markVisited } from '../lib/motion';

// Scroll reveal (scroll-animation skill, recipe 2): content fades and rises
// the first time it scrolls into view. No blur — text is never smeared while
// it is being read — and it does not replay on a page already visited.
export function Reveal({ children, className, as = 'div', delay = 0, y = 10, inView = true, ...props }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const [skip] = useState(() => hasVisited(pathname));
  const seen = useInView(ref, { once: true, margin: '0px 0px -30px 0px' });
  const Tag = m[as];

  return (
    <Tag
      ref={ref}
      className={className}
      initial={skip ? false : { opacity: 0, y }}
      animate={!inView || seen ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay, duration: DUR.reveal, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </Tag>
  );
}

const plain = (n) => Math.round(n).toLocaleString('en-IN');

// React Bits "CountUp": a number counts to its value when it becomes visible.
// The text node is written directly each frame, so nothing re-renders.
export function CountUp({ end = 0, duration = 0.9, format = plain, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const last = useRef(0);
  const [initial] = useState(() => format(0));

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return undefined;
    if (reduce) {
      node.textContent = format(end);
      last.current = end;
      return undefined;
    }
    const controls = animate(last.current, end, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        last.current = v;
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, end, reduce]);

  return <span ref={ref} className={className}>{initial}</span>;
}

// An icon that changes in place cross-fades through a small scale and blur,
// so it reads as one object changing state (motion house style: icon swap).
export function IconSwap({ swapKey, children, className = '' }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span key={swapKey} {...ICON_SWAP} className={`inline-flex ${className}`}>
        {children}
      </m.span>
    </AnimatePresence>
  );
}

// Page changes cross-fade: opacity only, 150ms each way, and the first page
// simply appears. `render` gets the location the page was mounted with, so a
// page that is fading out keeps showing its own route.
export function PageTransition({ render }) {
  const location = useLocation();
  const key = location.pathname;

  // Remember each page once it has been left, so its reveals do not replay on
  // the way back. (Done by comparing with the previous path rather than in an
  // effect cleanup, which React's StrictMode runs once straight after mount.)
  const previous = useRef(location.pathname);
  useEffect(() => {
    if (previous.current !== location.pathname) {
      markVisited(previous.current);
      previous.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.page, ease: EASE_IN_OUT }}>
        {render(location)}
      </m.div>
    </AnimatePresence>
  );
}
