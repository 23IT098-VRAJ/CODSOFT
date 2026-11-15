import React, { lazy, Suspense, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react';
import { EmberBackdrop } from './motion/backgrounds';
import { TiltCard } from './motion/pointer';
import CountUp from './motion/CountUp';
import Magnet from './motion/Magnet';
import ShimmerButton from './motion/ShimmerButton';
import TextReveal from './motion/TextReveal';
import { DUR, EASE_OUT, STAGGER_STAGED, hasVisited } from '../lib/motion';
import { formatINR, FREE_SHIPPING_THRESHOLD, onImgError } from '../lib/format';

// The WebGL backdrop is its own chunk, fetched after the hero has painted.
const ShaderBackground = lazy(() => import('./motion/ShaderBackground'));

// Where each showcase card sits, how far it leans, and how fast it drifts as
// the page scrolls. Different speeds are what make the stack feel deep.
const SLOTS = [
  { box: 'left-[14%] top-[8%] w-[54%] z-20', tilt: '-rotate-3', speed: -70, bob: '' },
  { box: 'right-0 top-0 w-[40%] z-10', tilt: 'rotate-6', speed: -130, bob: '[animation-delay:-1s]' },
  { box: 'left-0 bottom-[2%] w-[40%] z-30', tilt: '-rotate-6', speed: -30, bob: '[animation-delay:-2s]' },
];

// A staged entrance: badge, headline, text, actions, stats arrive 100ms apart.
// It plays once per session — coming back to the home page shows it in place.
function Staged({ step, replay, children, className }) {
  return (
    <m.div
      className={className}
      initial={replay ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE_OUT, delay: step * STAGGER_STAGED }}
    >
      {children}
    </m.div>
  );
}

function ShowcaseCard({ product, slot, progress, still }) {
  // Parallax: each card travels a different distance over the hero's scroll.
  const y = useTransform(progress, [0, 1], [0, still ? 0 : slot.speed]);

  return (
    <m.div style={{ y }} className={`absolute ${slot.box}`}>
      {/* three nested transforms, one job each: idle bob, resting lean, cursor tilt */}
      <div className={`animate-bob ${slot.bob}`}>
        <div className={slot.tilt}>
        <TiltCard className="rounded-3xl">
          <Link
            to={`/products/${product._id}`}
            className="block rounded-3xl bg-pureWhite/95 backdrop-blur p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/20"
          >
            <div className="aspect-square rounded-2xl bg-warmIvory p-4">
              <img src={product.images?.[0] || ''} alt={product.name} onError={onImgError} className="w-full h-full object-contain" />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-smoke truncate">{product.brand}</p>
            <p className="text-sm font-semibold text-midnight truncate">{product.name}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-extrabold text-midnight">{formatINR(product.price)}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-smoke">
                <Star className="w-3.5 h-3.5 fill-vividGold text-vividGold" /> {(product.rating?.average || 0).toFixed(1)}
              </span>
            </div>
          </Link>
        </TiltCard>
        </div>
      </div>
    </m.div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────
// Back to front:
//   1. EmberBackdrop  — layered CSS gradient; visible instantly, and the
//                       whole backdrop if WebGL is unavailable
//   2. ShaderBackground (god rays) — lazy WebGL light shafts, fading in
//   3. copy on the left, a floating stack of real products on the right
//
// Scroll-linked (the "parallax layers" recipe): as the hero scrolls away the
// backdrop swells, the copy sinks and fades, and the three product cards rise
// at different speeds.
export default function Hero({ products, total, categoryCount, loggedIn }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  const [replay] = useState(() => !hasVisited(pathname));

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.18]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  const showcase = products.slice(0, 3);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-midnight">
      <m.div style={{ scale: backdropScale }} className="absolute inset-0 -z-10">
        <EmberBackdrop />
        <Suspense fallback={null}>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: EASE_OUT }} className="absolute inset-0 mix-blend-screen" aria-hidden="true">
            <ShaderBackground
              variant="god-rays"
              colorBack="#00000000"
              colorBloom="#D4A017"
              colors={['#D4A01766', '#F6D87840', '#6366F138']}
              offsetX={-0.45}
              offsetY={-0.9}
              density={0.18}
              spotty={0.45}
              midSize={0.12}
              midIntensity={0.15}
              intensity={0.55}
              bloom={0.25}
              speed={0.5}
            />
          </m.div>
        </Suspense>
        {/* keeps the copy readable over the brightest rays */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-midnight/70 via-midnight/20 to-transparent" />
      </m.div>

      <div className="container-page grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center pt-14 pb-24 sm:pt-20 sm:pb-28 lg:min-h-[640px]">
        {/* Copy */}
        <m.div style={{ y: copyY, opacity: copyOpacity }} className="text-center lg:text-left">
          <Staged step={0} replay={replay}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-200 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-vividGold" /> New drops every week
            </span>
          </Staged>

          <TextReveal
            animate={replay}
            delay={STAGGER_STAGED}
            className="mt-6 text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.04] tracking-tight"
            lines={[
              { text: 'Good things,', wordClassName: 'text-pureWhite' },
              { text: 'delivered fast.', wordClassName: 'pb-2 text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-vividGold to-amber-500' },
            ]}
          />

          <Staged step={5} replay={replay}>
            <p className="text-gray-300 max-w-md mx-auto lg:mx-0 mt-6 text-base sm:text-lg">
              Electronics, fashion, books, home and sports — honest prices, live stock, and every order tracked to your door.
            </p>
          </Staged>

          <Staged step={6} replay={replay} className="flex items-center justify-center lg:justify-start gap-4 flex-wrap mt-8">
            <Magnet>
              <ShimmerButton as={Link} to="/products">Shop now <ArrowRight className="w-4 h-4" /></ShimmerButton>
            </Magnet>
            {!loggedIn && (
              <Link to="/register" className="btn border border-white/25 text-pureWhite hover:border-vividGold hover:text-vividGold !px-8 !py-3.5">Create account</Link>
            )}
          </Staged>

          <Staged step={7} replay={replay}>
            <dl className="mt-12 flex items-center justify-center lg:justify-start gap-8 sm:gap-12">
              {[
                { label: 'Products', end: total, suffix: '+' },
                { label: 'Categories', end: categoryCount },
                { label: 'Free delivery above', end: FREE_SHIPPING_THRESHOLD, prefix: '₹' },
              ].map(({ label, end, prefix = '', suffix = '' }) => (
                <div key={label}>
                  <dd className="text-2xl sm:text-3xl font-extrabold text-pureWhite tabular-nums">
                    <CountUp end={end} start={replay ? 0 : end} format={(n) => `${prefix}${Math.round(n).toLocaleString('en-IN')}${suffix}`} />
                  </dd>
                  <dt className="text-gray-400 text-xs sm:text-sm mt-1">{label}</dt>
                </div>
              ))}
            </dl>
          </Staged>
        </m.div>

        {/* Showcase: three real top-rated products, floating */}
        <Staged step={4} replay={replay} className="relative mx-auto w-full max-w-md lg:max-w-none aspect-[5/4] sm:aspect-[4/3] lg:aspect-auto lg:h-[500px]">
          {showcase.length === 3
            ? showcase.map((p, i) => <ShowcaseCard key={p._id} product={p} slot={SLOTS[i]} progress={scrollYProgress} still={reduce} />)
            : SLOTS.map((slot) => (
              <div key={slot.box} className={`absolute ${slot.box}`}>
                <div className={`${slot.tilt} rounded-3xl bg-white/10 ring-1 ring-white/10 aspect-[3/4] animate-pulse`} />
              </div>
            ))}

          {/* floating trust chips */}
          <div className="absolute left-[2%] top-[4%] z-40 animate-bob [animation-delay:-1.5s] hidden sm:flex items-center gap-2 rounded-full bg-midnight/80 backdrop-blur px-3.5 py-2 text-xs font-semibold text-pureWhite ring-1 ring-white/15 shadow-xl">
            <Truck className="w-4 h-4 text-vividGold" /> Free delivery
          </div>
          <div className="absolute right-[4%] bottom-[10%] z-40 animate-bob [animation-delay:-0.5s] hidden sm:flex items-center gap-2 rounded-full bg-midnight/80 backdrop-blur px-3.5 py-2 text-xs font-semibold text-pureWhite ring-1 ring-white/15 shadow-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified reviews
          </div>
        </Staged>
      </div>
    </section>
  );
}
