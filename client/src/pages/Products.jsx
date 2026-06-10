import React, { useEffect, useState, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import api from '../lib/axios';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
const defaultFilters = { category: [], minPrice: '', maxPrice: '', sort: 'newest' };

export default function Products() {
  const [filters, setFilters] = useState(defaultFilters);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (f, p, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: f.sort, page: p, limit: 20 });
      f.category.forEach((c) => params.append('category', c));
      if (f.minPrice) params.set('minPrice', f.minPrice);
      if (f.maxPrice) params.set('maxPrice', f.maxPrice);
      const { data } = await api.get(`/products?${params}`);
      setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setPage(1); fetchProducts(filters, 1); }, [filters, fetchProducts]);

  const toggleCategory = (cat) =>
    setFilters((f) => ({
      ...f,
      category: f.category.includes(cat) ? f.category.filter((c) => c !== cat) : [...f.category, cat],
    }));

  const loadMore = () => {
    const next = page + 1; setPage(next); fetchProducts(filters, next, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 hidden md:block space-y-6">
        <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-5 sticky top-20">
          <h2 className="font-bold text-midnight mb-4 flex items-center gap-2">
            <span className="text-vividGold">⚙</span> Filters
          </h2>

          {/* Category */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-smoke mb-3">Category</p>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 text-sm text-midnight cursor-pointer hover:text-midnight transition group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    filters.category.includes(cat)
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-parchment group-hover:border-violet-500/40'
                  }`} onClick={() => toggleCategory(cat)}>
                    {filters.category.includes(cat) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span onClick={() => toggleCategory(cat)}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-smoke mb-3">Price Range (₹)</p>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full px-3 py-2 text-xs flex-1" />
              <input type="number" placeholder="Max" value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full px-3 py-2 text-xs flex-1" />
            </div>
          </div>

          {/* Sort */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-smoke mb-3">Sort By</p>
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full py-2 text-xs bg-warmIvory">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="top_rated">Top Rated</option>
            </select>
          </div>

          <button onClick={() => setFilters(defaultFilters)}
            className="w-full text-vividGold hover:text-vividGold text-xs font-semibold border border-violet-500/40 mist hover:border-violet-400/50 rounded-full py-2 transition-all">
            ✕ Clear All Filters
          </button>
        </div>
      </aside>

      {/* ── Products Grid ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-smoke">
            <span className="font-semibold text-midnight">{total}</span> products found
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {loading && products.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {products.length < total && !loading && (
          <div className="mt-10 text-center">
            <button onClick={loadMore}
              className="border border-vividGold text-vividGold font-semibold rounded-full px-5 py-2 hover:bg-warmIvory transition text-center inline-flex items-center justify-center px-10 py-3 text-sm">
              Load More Products
            </button>
          </div>
        )}
        {loading && products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
