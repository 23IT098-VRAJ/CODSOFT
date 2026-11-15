// Cursor-driven surfaces from motion-ui: TiltCard and SpotlightCard.
// Both are purely decorative, so they switch themselves off on touch screens
// (where "hover" sticks after a tap) and under reduced motion.
import React, { useRef } from 'react';
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { SPRING_MOUSE } from '../../lib/motion';
import { cn } from '../../lib/utils';

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// motion-ui "TiltCard": the surface leans toward the cursor in 3D and a soft
// glare follows it. The cursor position lives in motion values, so moving the
// mouse never re-renders React.
export function TiltCard({ children, max = 10, glare = true, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const enabled = !reduce && canHover();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, SPRING_MOUSE);
  const sry = useSpring(ry, SPRING_MOUSE);

  const onMove = (e) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * max);
    rx.set((0.5 - py) * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const transform = useMotionTemplate`perspective(1000px) rotateX(${srx}deg) rotateY(${sry}deg)`;
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.9), transparent 55%)`;

  return (
    <m.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transform, transformStyle: 'preserve-3d' }} className={cn('group/tilt relative will-change-transform', className)}>
      {children}
      {glare && enabled && (
        <m.div aria-hidden="true" style={{ background: glareBg }} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover/tilt:opacity-20 transition-opacity" />
      )}
    </m.div>
  );
}

// motion-ui "SpotlightCard": a pool of light follows the cursor across the
// card, and a faint beam circles its border while it is hovered.
export function SpotlightCard({ children, className, spotlightColor = 'rgba(212, 160, 23, 0.16)', spotlightSize = 320, beam = true, ...props }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const enabled = !reduce && canHover();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, SPRING_MOUSE);
  const y = useSpring(mouseY, SPRING_MOUSE);

  const onMove = (e) => {
    if (!enabled || !ref.current) return;
    const { left, top } = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const background = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`;

  return (
    <div ref={ref} onMouseMove={onMove} className={cn('group/spot relative overflow-hidden', className)} {...props}>
      {enabled && (
        <m.div aria-hidden="true" style={{ background }} className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover/spot:opacity-100 transition-opacity" />
      )}
      {beam && enabled && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px">
          <div className="absolute -inset-[100%] opacity-0 group-hover/spot:opacity-70 group-hover/spot:animate-slow-spin transition-opacity [background:conic-gradient(from_0deg,transparent_0_320deg,#D4A017_360deg)]" />
        </div>
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
