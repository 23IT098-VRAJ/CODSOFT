import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { DUR, EASE_DRAWER, POP, T_EXIT, T_STATE } from '../lib/motion';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import ProductCard, { SkeletonCard } from '../components/ProductCard';
import { EmptyState, ErrorState, Pagination } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { useDebounce, usePageTitle } from '../hooks';
import { readCache, writeCache } from '../lib/cache';
import { CATEGORIES } from '../lib/format';

const PAGE_SIZE = 12;
const SORTS = [
  ['newest', 'Newest'],
  ['top_rated', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name: A to Z'],
];

// The URL is the single source of truth for every filter. That makes results
// shareable and bookmarkable, and the browser's back button just works.
function useFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      q: params.get('q') || '',
      category: params.getAll('category'),
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      inStock: params.get('inStock') === 'true',
      sort: params.get('sort') || 'newest',
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params]
  );

  // Apply a partial change; anything except a page change returns to page 1.
  const update = (patch) => {
    const next = { ...filters, page: 1, ...patch };
    const out = new URLSearchParams();
    if (next.q) out.set('q', next.q);
    next.category.forEach((c) => out.append('category', c));
    if (next.minPrice) out.set('minPrice', next.minPrice);
    if (next.maxPrice) out.set('maxPrice', next.maxPrice);
    if (next.inStock) out.set('inStock', 'true');
    if (next.sort !== 'newest') out.set('sort', next.sort);
    if (next.page > 1) out.set('page', String(next.page));
    setParams(out, { replace: patch.page === undefined });
  };

  return [filters, update, () => setParams({})];
}

function FilterPanel({ filters, update, counts }) {
  // Price inputs are local and debounced so typing "15000" is one request.
  const [price, setPrice] = useState({ min: filters.minPrice, max: filters.maxPrice });
  const debounced = useDebounce(price, 500);

  useEffect(() => setPrice({ min: filters.minPrice, max: filters.maxPrice }), [filters.minPrice, filters.maxPrice]);
  useEffect(() => {
    if (debounced.min !== filters.minPrice || debounced.max !== filters.maxPrice) {
      update({ minPrice: debounced.min, maxPrice: debounced.max });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const toggleCategory = (cat) =>
    update({ category: filters.category.includes(cat) ? filters.category.filter((c) => c !== cat) : [...filters.category, cat] });

  const heading = 'text-[11px] font-bold uppercase tracking-wider text-smoke mb-3';

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={heading}>Category</legend>
        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 text-sm text-bodyInk cursor-pointer">
              <input type="checkbox" checked={filters.category.includes(cat)} onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded accent-vividGold" />
              <span className="flex-1">{cat}</span>
              {counts[cat] !== undefined && <span className="text-xs text-smoke">{counts[cat]}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={heading}>Price (₹)</legend>
        <div className="flex items-center gap-2">
          <input type="number" min="0" inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={price.min}
            onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))} className="input !px-3 !py-2" />
          <span className="text-smoke">–</span>
          <input type="number" min="0" inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={price.max}
            onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))} className="input !px-3 !py-2" />
        </div>
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm text-bodyInk cursor-pointer">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => update({ inStock: e.target.checked })}
          className="w-4 h-4 rounded accent-vividGold" />
        In stock only
      </label>
    </div>
  );
}

export default function Products() {
  const [filters, update, clearAll] = useFilters();
  // The request for the current filters, as a query string. It doubles as the
  // cache key: a filter combination seen before is shown at once while a
  // fresh copy loads in the background.
  const query = useMemo(() => {
    const params = new URLSearchParams({ sort: filters.sort, page: filters.page, limit: PAGE_SIZE });
    if (filters.q) params.set('q', filters.q);
    filters.category.forEach((c) => params.append('category', c));
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');
    return `/products?${params}`;
  }, [filters]);

  const [result, setResult] = useState(() => readCache(query) || { products: [], total: 0, pages: 1 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(() => !readCache(query));
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reload, setReload] = useState(0);

  usePageTitle(filters.q ? `"${filters.q}"` : filters.category.length === 1 ? filters.category[0] : 'All products');

  useEffect(() => {
    api.get('/products/meta')
      .then(({ data }) => setCounts(Object.fromEntries(data.categories.map((c) => [c.name, c.count]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // If the filters change while a request is in flight, ignore the stale reply.
    const controller = new AbortController();
    const cached = readCache(query);
    if (cached) setResult(cached);
    setLoading(!cached);
    setError('');

    api.get(query, { signal: controller.signal })
      .then(({ data }) => { setResult(writeCache(query, data)); setLoading(false); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [query, reload]);

  const chips = [
    filters.q && { label: `Search: ${filters.q}`, clear: { q: '' } },
    ...filters.category.map((c) => ({ label: c, clear: { category: filters.category.filter((x) => x !== c) } })),
    (filters.minPrice || filters.maxPrice) && { label: `₹${filters.minPrice || 0} – ${filters.maxPrice ? `₹${filters.maxPrice}` : 'any'}`, clear: { minPrice: '', maxPrice: '' } },
    filters.inStock && { label: 'In stock', clear: { inStock: false } },
  ].filter(Boolean);

  const goToPage = (page) => {
    update({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-page py-8 flex gap-8">
      {/* Desktop sidebar */}
      <aside className="w-60 shrink-0 hidden lg:block">
        <div className="card p-5 sticky top-24">
          <h2 className="font-bold text-midnight mb-5 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-vividGold" /> Filters</h2>
          <FilterPanel filters={filters} update={update} counts={counts} />
        </div>
      </aside>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: T_STATE }} exit={{ opacity: 0, transition: T_EXIT }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <m.div initial={{ x: '-100%' }} animate={{ x: 0, transition: { duration: DUR.drawerIn, ease: EASE_DRAWER } }}
              exit={{ x: '-100%', transition: { duration: DUR.drawerOut, ease: EASE_DRAWER } }}
              className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-pureWhite p-5 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-midnight">Filters</h2>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close filters"><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel filters={filters} update={update} counts={counts} />
              <button onClick={() => setDrawerOpen(false)} className="btn-dark w-full mt-8">Show {result.total} results</button>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-midnight">
              {filters.q ? `Results for "${filters.q}"` : filters.category.length === 1 ? filters.category[0] : 'All products'}
            </h1>
            <p className="text-sm text-smoke mt-0.5" aria-live="polite">
              {loading ? 'Loading…' : `${result.total} product${result.total === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(true)} className="btn-outline lg:hidden !px-3.5">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by" className="input !w-auto !py-2">
              {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {/* chips pop in and out; the others slide to close the gap */}
            <AnimatePresence mode="popLayout">
              {chips.map((chip) => (
                <m.button key={chip.label} layout="position" {...POP}
                  onClick={() => update(chip.clear)} className="badge bg-midnight text-pureWhite hover:bg-bodyInk">
                  {chip.label} <X className="w-3 h-3" />
                </m.button>
              ))}
            </AnimatePresence>
            <button onClick={clearAll} className="text-xs font-semibold text-smoke hover:text-midnight underline underline-offset-2">Clear all</button>
          </div>
        )}

        {error ? (
          <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />
        ) : !loading && result.products.length === 0 ? (
          <EmptyState icon={SearchX} title="No products match"
            message="Try a different search term or remove some filters."
            action={<button onClick={clearAll} className="btn-primary">Clear all filters</button>} />
        ) : (
          <>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 ${loading ? 'opacity-60' : ''} transition-opacity`}>
              {loading && result.products.length === 0
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
                : result.products.map((p, i) => <ProductCard key={p._id} product={p} index={i % 3} />)}
            </div>
            <Pagination page={filters.page} pages={result.pages} onChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}
