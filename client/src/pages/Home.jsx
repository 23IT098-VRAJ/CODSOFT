import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import api from '../lib/axios';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get('/products?limit=8&sort=top_rated')
      .then(({ data }) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-warmIvory">
      {/* ── Hero ── */}
      <section className="bg-midnight rounded-b-3xl">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 text-center">
          <p className="text-vividGold tracking-widest text-xs uppercase font-bold mb-4">
            PREMIUM SHOPPING EXPERIENCE
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-pureWhite leading-tight tracking-tight mb-6">
            Shop Everything.<br />
            <span className="text-vividGold">Delivered Fast.</span>
          </h1>
          <p className="text-lg text-smoke max-w-2xl mx-auto mb-10">
            Discover thousands of products at unbeatable prices — fashion,
            tech, home &amp; more.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/products')}
              className="bg-vividGold text-midnight rounded-full px-8 py-3 font-semibold hover:opacity-90 transition"
            >
              Shop Now →
            </button>
            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="border border-smoke text-pureWhite rounded-full px-8 py-3 hover:bg-bodyInk transition"
              >
                Join Free
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16 flex-wrap border-t border-bodyInk pt-8">
            {[['100+', 'Products'], ['5★', 'Avg Rating'], ['Fast', 'Delivery']].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-bold text-pureWhite">{val}</p>
                <p className="text-smoke text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories Quick-nav ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none md:justify-center">
          {[
            { label: 'All', icon: '🛍️', cat: '' },
            { label: 'Electronics', icon: '📱', cat: 'Electronics' },
            { label: 'Clothing', icon: '👗', cat: 'Clothing' },
            { label: 'Home', icon: '🏠', cat: 'Home' },
            { label: 'Sports', icon: '⚽', cat: 'Sports' },
            { label: 'Books', icon: '📚', cat: 'Books' },
          ].map(({ label, icon, cat }) => (
            <button
              key={label}
              onClick={() => navigate(cat ? `/products?category=${cat}` : '/products')}
              className="flex-shrink-0 flex items-center gap-2 bg-pureWhite border border-parchment hover:border-vividGold text-bodyInk px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-midnight">
            Featured Products
          </h2>
          <button onClick={() => navigate('/products')} className="text-smoke hover:text-vividGold text-sm font-medium transition">
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div className="border-t border-parchment py-8 text-center text-smoke text-sm">
        © 2026 ShopIndi — All rights reserved
      </div>
    </div>
  );
}
