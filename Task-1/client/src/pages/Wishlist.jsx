import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard, { SkeletonCard } from '../components/ProductCard';
import { EmptyState, ErrorState } from '../components/ui';
import { useWishlist } from '../context/WishlistContext';
import api, { errorMessage } from '../lib/axios';
import { usePageTitle } from '../hooks';

export default function Wishlist() {
  usePageTitle('Wishlist');
  const wishlist = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/wishlist')
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Un-hearting a card removes it from this page straight away.
  const visible = products.filter((p) => wishlist.has(p._id));

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-midnight mb-8">
        Wishlist {!loading && visible.length > 0 && <span className="text-base font-normal text-smoke">({visible.length})</span>}
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <div className="max-w-xl mx-auto">
          <EmptyState icon={Heart} title="Nothing saved yet" message="Tap the heart on any product to keep it here for later."
            action={<Link to="/products" className="btn-primary">Browse products</Link>} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {visible.map((p, i) => <ProductCard key={p._id} product={p} index={i % 4} />)}
        </div>
      )}
    </div>
  );
}
