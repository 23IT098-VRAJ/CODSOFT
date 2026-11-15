import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '../../lib/motion';

const defaultFormat = (n) => Math.round(n).toLocaleString('en-IN');

// React Bits "CountUp": a number that counts up to its value when it scrolls
// into view. The text node is updated directly on each frame, so the count
// does not re-render React 60 times a second.
export default function CountUp({ end = 0, start = 0, duration = 1.6, format = defaultFormat, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const last = useRef(start); // so a changed `end` counts on from where it stopped
  const [initialText] = useState(() => format(start));

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return undefined;
    if (reduceMotion) {
      node.textContent = format(end);
      last.current = end;
      return undefined;
    }
    const controls = animate(last.current, end, {
      duration,
      ease: EASE_OUT,
      onUpdate: (value) => {
        last.current = value;
        node.textContent = format(value);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, end, reduceMotion]);

  // The first text is fixed at mount; afterwards only the animation writes to
  // the node, so a re-render can never make the number jump.
  return <span ref={ref} className={className}>{initialText}</span>;
}
