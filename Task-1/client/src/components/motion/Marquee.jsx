import React from 'react';
import { cn } from '../../lib/utils';

// Magic UI "Marquee": an endless, seamless scrolling strip. The children are
// rendered `repeat` times side by side and each copy slides by exactly its
// own width, so the loop has no visible seam. Speed and spacing are set with
// the --duration and --gap CSS variables, e.g. className="[--duration:30s]".
export default function Marquee({ children, className, reverse = false, pauseOnHover = false, repeat = 4, ...props }) {
  return (
    <div {...props} className={cn('group flex flex-row overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)]', className)}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0} // only the first copy is announced to screen readers
          className={cn(
            'flex shrink-0 flex-row justify-around animate-marquee [gap:var(--gap)]',
            reverse && '[animation-direction:reverse]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
