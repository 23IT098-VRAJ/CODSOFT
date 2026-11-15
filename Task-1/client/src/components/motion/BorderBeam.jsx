import React from 'react';
import { m } from 'motion/react';
import { cn } from '../../lib/utils';

// Magic UI "Border Beam": a streak of light that travels around the border
// of its parent. The parent must be `relative` and have a border radius.
// The mask leaves only the border ring visible; the beam rides a CSS
// offset-path that follows the rounded rectangle.
export default function BorderBeam({
  size = 90,
  duration = 7,
  delay = 0,
  colorFrom = '#D4A017',
  colorTo = '#F6D878',
  borderWidth = 1.5,
  reverse = false,
  className,
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      style={{ borderWidth, borderStyle: 'solid' }}
    >
      <m.div
        className={cn('absolute aspect-square bg-gradient-to-l from-[var(--beam-from)] via-[var(--beam-to)] to-transparent', className)}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)`, '--beam-from': colorFrom, '--beam-to': colorTo }}
        initial={{ offsetDistance: reverse ? '100%' : '0%' }}
        animate={{ offsetDistance: reverse ? '0%' : '100%' }}
        transition={{ repeat: Infinity, ease: 'linear', duration, delay: -delay }}
      />
    </div>
  );
}
