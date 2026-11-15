// Layered CSS backdrops adapted from motion-ui's `background-gradient` set
// (Dark Ember, Dark Midnight Mesh, Soft Spotlight) and re-coloured to the
// ShopIndi palette. No canvas and no JavaScript: a base gradient, a few
// heavily blurred colour fields, a film-grain dot layer and a vignette.
import React from 'react';
import { cn } from '../../lib/utils';

const GRAIN = '[background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:5px_5px]';

// Dark: midnight lit from below by warm gold, with a cool indigo counter-light.
// Used behind the hero (under the shader, and on its own when WebGL is
// unavailable) and behind the closing call-to-action.
export function EmberBackdrop({ className, drift = true }) {
  const float = drift ? 'animate-float' : '';
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-midnight', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1b1608_0%,#0B1120_52%,#070b16_100%)]" />
      <div className="absolute -inset-8 blur-2xl">
        <div className={`absolute bottom-[2%] -left-[8%] h-[62%] w-[58%] rounded-full bg-[#D4A017] opacity-[0.20] blur-3xl ${float}`} />
        <div className={`absolute bottom-[10%] left-[34%] h-[48%] w-[46%] rounded-full bg-[#F59E0B] opacity-[0.13] blur-3xl ${float} [animation-delay:-4s]`} />
        <div className={`absolute top-[6%] -right-[8%] h-[58%] w-[52%] rounded-full bg-[#6366F1] opacity-[0.16] blur-3xl ${float} [animation-delay:-8s]`} />
        <div className="absolute top-[2%] left-[12%] h-[40%] w-[40%] rounded-full bg-[#F6D878] opacity-[0.08] blur-3xl" />
      </div>
      <div className={`absolute inset-0 opacity-[0.04] ${GRAIN}`} />
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}

// Light: warm ivory with a soft gold spotlight — behind the login and
// register cards.
export function SoftSpotlightBackdrop({ className }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-warmIvory', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,#f6ecd0_0%,#FAF7F2_70%)]" />
      <div className="absolute -inset-8 blur-3xl">
        <div className="absolute -top-[18%] left-[18%] h-[58%] w-[58%] rounded-full bg-[#D4A017] opacity-[0.16] animate-float" />
        <div className="absolute bottom-[-20%] right-[6%] h-[52%] w-[48%] rounded-full bg-[#818CF8] opacity-[0.10] animate-float [animation-delay:-6s]" />
      </div>
      <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle,#d9cfb4_1px,transparent_1px)] [background-size:4px_4px]" />
    </div>
  );
}
