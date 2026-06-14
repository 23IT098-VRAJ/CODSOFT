import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/axios';

function StarRating({ rating = 0, size = 'md', interactive = false, onRate }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" disabled={!interactive}
          onClick={() => interactive && onRate?.(i + 1)}
          className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}>
          <svg className={i < filled ? 'text-vividGold' : 'text-parchment'} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      ))}
      {!interactive && <span className="text-smoke text-xs ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data)).catch(console.error);
    api.get(`/reviews/${id}`).then(({ data }) => setReviews(data)).catch(console.error);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ productId: product._id, name: product.name, price: product.price, quantity, image: product.images?.[0] || '' });
    showToast('Added to cart! 🛒', 'success');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault(); setSubmitLoading(true);
    try {
      await api.post(`/reviews/${id}`, reviewForm);
      const { data } = await api.get(`/reviews/${id}`);
      setReviews(data); setReviewForm({ rating: 5, comment: '' });
      showToast('Review submitted! ✨', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Error submitting review', 'error'); }
    finally { setSubmitLoading(false); }
  };

  if (!product) return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-12 bg-warmIvory min-h-screen">
      <div className="aspect-square bg-parchment animate-pulse rounded-2xl" />
      <div className="space-y-4 pt-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 bg-parchment animate-pulse rounded" />)}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warmIvory">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-pureWhite border border-parchment mb-3 flex items-center justify-center p-8 shadow-sm">
              <div className="relative w-full max-w-[320px] aspect-square rounded-full bg-parchment flex items-center justify-center mx-auto">
                <img src={product.images?.[activeImg] || product.images?.[0]} alt={product.name}
                  className="w-[70%] h-[70%] object-contain drop-shadow-xl"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=600&background=EDE5D0&color=1F2937`; }} />
              </div>
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.slice(0, 4).map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? 'border-vividGold' : 'border-parchment hover:border-vividGold/50'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <p className="text-xs text-smoke uppercase tracking-widest font-bold">{product.brand}</p>
            <h1 className="text-3xl font-bold text-midnight leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3">
              <StarRating rating={product.rating?.average || 0} />
              <span className="text-smoke text-sm">({reviews.length} reviews)</span>
            </div>

            <p className="text-4xl font-extrabold text-vividGold">₹{product.price.toLocaleString('en-IN')}</p>

            <span className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
            </span>

            <p className="text-smoke text-sm leading-relaxed border-t border-parchment pt-4">{product.description}</p>

            {/* Qty */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center bg-pureWhite border border-parchment rounded-xl overflow-hidden">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                  className="px-4 py-3 text-smoke hover:text-midnight transition disabled:opacity-30 text-lg font-bold">−</button>
                <span className="px-4 py-3 font-bold text-midnight min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
                  className="px-4 py-3 text-smoke hover:text-midnight transition disabled:opacity-30 text-lg font-bold">+</button>
              </div>
            </div>

            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className="bg-vividGold text-midnight rounded-full w-full py-4 text-lg mt-2 font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 border-t border-parchment pt-12">
          <h2 className="text-2xl font-bold text-midnight mb-8">Customer Reviews</h2>

          {user && (
            <form onSubmit={handleReviewSubmit} className="bg-pureWhite border border-parchment rounded-2xl shadow-sm p-6 mb-8">
              <p className="font-semibold text-midnight mb-4">Leave a Review</p>
              <StarRating rating={reviewForm.rating} interactive onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Share your experience…" rows={3}
                className="bg-warmIvory border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full mt-4 resize-none" />
              <button type="submit" disabled={submitLoading}
                className="bg-midnight text-pureWhite font-semibold rounded-full px-8 py-2.5 text-sm mt-4 hover:opacity-90 transition">
                {submitLoading ? 'Submitting…' : 'Post Review'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {reviews.length === 0 && (
              <div className="bg-pureWhite border border-parchment rounded-2xl p-6 text-center text-smoke">No reviews yet. Be the first!</div>
            )}
            {reviews.map((r) => (
              <div key={r._id} className="bg-pureWhite border border-parchment rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-midnight flex items-center justify-center text-xs font-bold text-vividGold">
                      {r.userName?.[0]?.toUpperCase()}
                    </div>
                    <p className="font-semibold text-midnight text-sm">{r.userName}</p>
                  </div>
                  <p className="text-xs text-smoke">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <StarRating rating={r.rating} size="sm" />
                <p className="text-bodyInk text-sm mt-2 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
