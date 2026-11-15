import React, { useRef } from 'react';
import { m, useMotionValue, useSpring } from 'motion/react';
import { SPRING_MOUSE } from '../../lib/motion';

// React Bits "Magnet": the child is gently pulled toward the cursor while it
// hovers nearby, and springs back when the cursor leaves. `padding` is the
// invisible catch area around the child; `strength` is how far it follows.
export default function Magnet({ children, strength = 0.35, padding = 28, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_MOUSE);
  const sy = useSpring(y, SPRING_MOUSE);

  const onMove = (e) => {
    const box = ref.current.getBoundingClientRect();
    x.set((e.clientX - (box.left + box.width / 2)) * strength);
    y.set((e.clientY - (box.top + box.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={`inline-block ${className}`} style={{ padding, margin: -padding }}>
      <m.div style={{ x: sx, y: sy }}>{children}</m.div>
    </div>
  );
}
