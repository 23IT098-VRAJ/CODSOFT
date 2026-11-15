import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { m, useInView } from 'motion/react';
import { DUR, EASE_OUT, hasVisited } from '../../lib/motion';

// Scroll reveal: content fades and rises the first time it scrolls into view
// (the "ScrollReveal wrapper" recipe from the scroll-animation skill).
//
//   delay   — seconds; stagger siblings with STAGGER_LIST / STAGGER_STAGED
//   inView  — false plays on mount instead of waiting for the scroll
//
// Two rules from the motion house style are built in:
//   • no blur — text should never be smeared while someone is reading it
//   • entrances do not replay — on a page already visited this session the
//     content is simply there
export default function Reveal({ children, className, as = 'div', delay = 0, y = 14, inView = true, ...props }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const [skip] = useState(() => hasVisited(pathname)); // decided once, at mount
  const seen = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const show = !inView || seen;
  const Tag = m[as];

  return (
    <Tag
      ref={ref}
      className={className}
      initial={skip ? false : { opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay, duration: DUR.reveal, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </Tag>
  );
}
