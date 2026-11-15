import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { ICON_SWAP } from '../../lib/motion';

// An icon that changes in place — cart → tick, outline heart → filled heart —
// cross-fades through a small scale and blur, so it reads as one object
// changing state rather than two icons trading places (the "icon swap"
// recipe from the motion house style).
//
// `swapKey` identifies the current icon; when it changes, the swap plays.
export default function IconSwap({ swapKey, children, className = '' }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span key={swapKey} {...ICON_SWAP} className={`inline-flex ${className}`}>
        {children}
      </m.span>
    </AnimatePresence>
  );
}
