import React from 'react';
import { cn } from '../../lib/utils';

// Magic UI "Shimmer Button": a call-to-action with a band of light that
// sweeps across it. Polymorphic — pass `as={Link}` to render a router link.
export default function ShimmerButton({ as: Tag = 'button', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3.5',
        'bg-vividGold text-midnight text-sm font-bold shadow-[0_8px_30px_-6px_rgba(212,160,23,0.55)]',
        'transition-transform hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-20deg]" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Tag>
  );
}
