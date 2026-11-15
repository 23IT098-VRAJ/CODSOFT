import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Dumbbell, Home as HomeIcon, RotateCcw, ShieldCheck, Shirt, Smartphone, Star, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Hero from '../components/Hero';
import ProductCard, { SkeletonCard } from '../components/ProductCard';
import { ErrorState } from '../components/ui';
import { EmberBackdrop } from '../components/motion/backgrounds';
import { SpotlightCard } from '../components/motion/pointer';
import BorderBeam from '../components/motion/BorderBeam';
import Magnet from '../components/motion/Magnet';
import Marquee from '../components/motion/Marquee';
import Reveal from '../components/motion/Reveal';
import ShimmerButton from '../components/motion/ShimmerButton';
import api, { errorMessage } from '../lib/axios';
import { readCache, writeCache } from '../lib/cache';
import { STAGGER_LIST } from '../lib/motion';
import { usePageTitle } from '../hooks';
import { FREE_SHIPPING_THRESHOLD, onImgError } from '../lib/format';

const CATEGORY_META = {
  Electronics: { icon: Smartphone, blurb: 'Phones, laptops and the gear around them' },
  Clothing: { icon: Shirt, blurb: 'Everyday fits and statement pieces' },
  Books: { icon: BookOpen, blurb: 'Bestsellers worth your weekend' },
  Home: { icon: HomeIcon, blurb: 'Make your space yours' },
  Sports: { icon: Dumbbell, blurb: 'Move more, play harder' },
};

const PERKS = [
  { icon: Truck, title: 'Free delivery', text: `On orders above ₹${FREE_SHIPPING_THRESHOLD}` },
  { icon: RotateCcw, title: 'Easy cancellation', text: 'Cancel any time before shipping' },
  { icon: ShieldCheck, title: 'Verified reviews', text: 'Badged when the buyer received it' },
];

const EMPTY = { topRated: [], newest: [], categories: [], brands: [], reviews: [], total: 0 };
const CACHE_KEY = 'home';

// ── Bento grid of categories ──────────────────────────────────────────
// Each tile is a SpotlightCard: a pool of gold light follows the cursor.
function CategoryBento({ categories, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[9.5rem]">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`skeleton rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />)}
      </div>
    );
  }
  // The largest category gets the big tile.
  const ordered = [...categories].sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[9.5rem]">
      {ordered.map((c, i) => {
        const { icon: Icon, blurb } = CATEGORY_META[c.name] || { icon: Smartphone, blurb: '' };
        const big = i === 0;
        return (
          <Reveal key={c.name} delay={i * STAGGER_LIST} className={big ? 'col-span-2 row-span-2' : i === 4 ? 'col-span-2 lg:col-span-1' : ''}>
            <SpotlightCard
              spotlightColor={big ? 'rgba(212, 160, 23, 0.22)' : 'rgba(212, 160, 23, 0.14)'}
              className={`h-full rounded-2xl hover:shadow-xl transition-shadow ${big ? 'bg-midnight text-pureWhite' : 'card'}`}
            >
              <Link to={`/products?category=${encodeURIComponent(c.name)}`} className="group h-full flex flex-col justify-between p-5">
                <Icon aria-hidden="true" className={`absolute -right-5 -bottom-5 transition-transform group-hover:scale-105 ${
                  big ? 'w-44 h-44 text-white/10' : 'w-24 h-24 text-parchment'
                }`} />
                <div className="relative flex items-start justify-between">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${big ? 'bg-vividGold text-midnight' : 'bg-warmIvory text-vividGold'}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className={`w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${big ? 'text-vividGold' : 'text-smoke'}`} />
                </div>
                <div className="relative">
                  <p className={`font-bold ${big ? 'text-2xl' : 'text-base text-midnight'}`}>{c.name}</p>
                  {big && <p className="text-gray-300 text-sm mt-1 max-w-xs">{blurb}</p>}
                  <p className={`text-xs mt-1 ${big ? 'text-vividGold' : 'text-smoke'}`}>{c.count} products</p>
                </div>
              </Link>
            </SpotlightCard>
          </Reveal>
        );
      })}
    </div>
  );
}

function SectionHeading({ eyebrow, title, link }) {
  return (
    <Reveal className="flex items-end justify-between gap-4 mb-7">
      <div>
        {eyebrow && <p className="text-vividGold text-xs font-bold uppercase tracking-widest mb-1.5">{eyebrow}</p>}
        <h2 className="section-title sm:text-3xl">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="group text-sm font-semibold text-smoke hover:text-vividGold inline-flex items-center gap-1 shrink-0">
          View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </Reveal>
  );
}

function ProductRow({ eyebrow, title, link, products, loading }) {
  return (
    <section className="container-page py-10">
      <SectionHeading eyebrow={eyebrow} title={title} link={link} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  return (
    <Link to={`/products/${review.product._id}`} className="card w-72 shrink-0 p-5 hover:border-vividGold/60">
      <div className="flex gap-0.5 mb-2.5" aria-label="5 out of 5 stars">
        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-vividGold text-vividGold" />)}
      </div>
      <p className="text-bodyInk text-sm leading-relaxed line-clamp-2">“{review.comment}”</p>
      <div className="flex items-center gap-3 mt-4">
        <img src={review.product.image} alt="" onError={onImgError} className="w-9 h-9 rounded-lg object-contain bg-warmIvory p-0.5" />
        <div className="min-w-0">
          <p className="text-midnight text-xs font-semibold flex items-center gap-1">
            {review.userName} {review.verifiedPurchase && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
          </p>
          <p className="text-smoke text-xs truncate">on {review.product.name}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Closing call to action ────────────────────────────────────────────
// Scroll-linked (the "reveal with clipPath" recipe): the card starts inset
// and slightly small, and opens to full width as it scrolls into view. It
// follows the scrollbar exactly, so it reverses if the visitor scrolls back.
function ClosingCta({ user }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const clipPath = useTransform(scrollYProgress, [0, 1], reduce ? ['inset(0% 0% round 24px)', 'inset(0% 0% round 24px)'] : ['inset(12% 8% round 24px)', 'inset(0% 0% round 24px)']);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);
  const backdropY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -40, 0]);

  return (
    <section ref={ref} className="container-page pt-10">
      <m.div style={{ clipPath, scale }} className="relative overflow-hidden rounded-3xl bg-midnight px-6 py-14 sm:py-16 text-center">
        <m.div style={{ y: backdropY }} className="absolute -inset-y-10 inset-x-0"><EmberBackdrop /></m.div>
        <BorderBeam size={180} duration={10} />
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-pureWhite tracking-tight">
            {user ? `Ready for your next find, ${user.name.split(' ')[0]}?` : 'Your next favourite thing is one tap away'}
          </h2>
          <p className="text-gray-300 mt-3 max-w-md mx-auto text-sm sm:text-base">
            {user ? 'Pick up where you left off — your wishlist and orders are saved to your account.' : 'Create a free account to save a wishlist, track orders and review what you buy.'}
          </p>
          <div className="mt-8">
            <Magnet>
              <ShimmerButton as={Link} to={user ? '/products' : '/register'}>
                {user ? 'Keep shopping' : 'Join ShopIndi'} <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Magnet>
          </div>
        </div>
      </m.div>
    </section>
  );
}

const fadeEdges = '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]';

export default function Home() {
  usePageTitle();
  const { user } = useAuth();

  // First render comes from the cache when there is one, so returning to the
  // home page shows it instantly; fresh data then replaces it quietly.
  const cached = readCache(CACHE_KEY);
  const [data, setData] = useState(cached || EMPTY);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      api.get('/products', { params: { limit: 4, sort: 'top_rated', inStock: true } }),
      api.get('/products', { params: { limit: 4, sort: 'newest' } }),
      api.get('/products/meta'),
      api.get('/reviews/featured').catch(() => ({ data: [] })), // decorative — never block the page
    ])
      .then(([top, fresh, meta, featured]) =>
        setData(
          writeCache(CACHE_KEY, {
            topRated: top.data.products,
            newest: fresh.data.products,
            categories: meta.data.categories,
            brands: meta.data.brands || [],
            reviews: featured.data,
            total: fresh.data.total,
          })
        )
      )
      .catch((err) => { if (!readCache(CACHE_KEY)) setError(errorMessage(err)); }) // keep showing cached data if a refresh fails
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div>
      <Hero products={data.topRated} total={data.total} categoryCount={data.categories.length} loggedIn={Boolean(user)} />

      {/* Perks — overlaps the hero */}
      <section className="container-page -mt-9 relative z-10">
        <Reveal className="card shadow-lg grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-parchment">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group flex items-center gap-3 px-5 py-4">
              <Icon className="w-6 h-6 text-vividGold shrink-0 transition-transform group-hover:scale-110" />
              <div>
                <p className="font-semibold text-midnight text-sm">{title}</p>
                <p className="text-smoke text-xs">{text}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {error ? (
        <div className="container-page py-10"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></div>
      ) : (
        <>
          {/* Brand marquee */}
          {data.brands.length > 0 && (
            <section className="pt-12" aria-label="Brands we stock">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-smoke mb-5">Brands you'll find here</p>
              <Marquee pauseOnHover className={`[--duration:38s] [--gap:3rem] ${fadeEdges}`}>
                {data.brands.map((b) => (
                  <Link key={b.name} to={`/products?q=${encodeURIComponent(b.name)}`}
                    className="text-2xl font-extrabold tracking-tight text-midnight/25 hover:text-vividGold whitespace-nowrap">
                    {b.name}
                  </Link>
                ))}
              </Marquee>
            </section>
          )}

          <section className="container-page pt-14 pb-4">
            <SectionHeading eyebrow="Browse" title="Shop by category" />
            <CategoryBento categories={data.categories} loading={loading} />
          </section>

          <ProductRow eyebrow="Loved by buyers" title="Top rated" link="/products?sort=top_rated" products={data.topRated} loading={loading} />

          {/* Review marquee — two rows drifting in opposite directions */}
          {data.reviews.length >= 4 && (
            <section className="py-10 overflow-hidden" aria-label="Customer reviews">
              <div className="container-page"><SectionHeading eyebrow="Real reviews" title="What shoppers are saying" /></div>
              <div className={`space-y-4 ${fadeEdges}`}>
                <Marquee pauseOnHover repeat={3} className="[--duration:55s]">
                  {data.reviews.slice(0, Math.ceil(data.reviews.length / 2)).map((r) => <ReviewCard key={r._id} review={r} />)}
                </Marquee>
                <Marquee pauseOnHover reverse repeat={3} className="[--duration:55s]">
                  {data.reviews.slice(Math.ceil(data.reviews.length / 2)).map((r) => <ReviewCard key={r._id} review={r} />)}
                </Marquee>
              </div>
            </section>
          )}

          <ProductRow eyebrow="Just in" title="New arrivals" link="/products?sort=newest" products={data.newest} loading={loading} />

          <ClosingCta user={user} />
        </>
      )}
    </div>
  );
}
