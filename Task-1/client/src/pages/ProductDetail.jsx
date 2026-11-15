import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import Reveal from '../components/motion/Reveal';
import IconSwap from '../components/motion/IconSwap';
import { EASE_OUT, PRESS, STAGGER_LIST } from '../lib/motion';
import { BadgeCheck, ChevronRight, Heart, PackageX, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { useCart, maxQtyFor } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, QuantityStepper, Spinner, StarRating } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatDate, formatINR, FREE_SHIPPING_THRESHOLD, onImgError } from '../lib/format';

function RatingBreakdown({ reviews, average }) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => r.rating === n).length }));
  return (
    <div className="card p-6 flex flex-col sm:flex-row gap-6 sm:items-center">
      <div className="text-center sm:w-40 shrink-0">
        <p className="text-5xl font-extrabold text-midnight">{average.toFixed(1)}</p>
        <StarRating rating={average} />
        <p className="text-smoke text-xs mt-1">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {counts.map(({ stars, count }) => (
          <div key={stars} className="flex items-center gap-3 text-xs text-smoke">
            <span className="w-10 shrink-0">{stars} star</span>
            <div className="flex-1 h-2 rounded-full bg-parchment/60 overflow-hidden">
              {/* each bar grows to its share when the panel scrolls into view */}
              <m.div className="h-full bg-vividGold rounded-full"
                style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`, originX: 0 }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (5 - stars) * STAGGER_LIST, ease: EASE_OUT }} />
            </div>
            <span className="w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ productId, onPosted }) {
  const [form, setForm] = useState({ rating: 0, comment: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return showToast('Choose a star rating first', 'info');
    setSaving(true);
    try {
      await api.post(`/reviews/${productId}`, form);
      showToast('Thanks for your review!', 'success');
      onPosted();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-6">
      <p className="font-semibold text-midnight mb-3">Write a review</p>
      <StarRating rating={form.rating} size="w-7 h-7" onRate={(rating) => setForm((f) => ({ ...f, rating }))} />
      <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
        placeholder="What did you like or dislike?" rows={3} maxLength={1000} aria-label="Review comment"
        className="input mt-4 resize-none" />
      <button type="submit" disabled={saving} className="btn-dark mt-4">
        {saving && <Spinner className="w-4 h-4" />} Post review
      </button>
    </form>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { addToCart, cartItems } = useCart();
  const wishlist = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  usePageTitle(product?.name);

  const loadReviews = () => api.get(`/reviews/${id}`).then(({ data }) => setReviews(data));
  // After a review changes, the product's cached rating changes too.
  const refreshRatings = () => Promise.all([loadReviews(), api.get(`/products/${id}`).then(({ data }) => setProduct(data))]).catch(() => {});

  const load = () => {
    setStatus('loading');
    setQuantity(1);
    setActiveImg(0);
    Promise.all([api.get(`/products/${id}`), api.get(`/reviews/${id}`), api.get(`/products/${id}/related`)])
      .then(([p, r, rel]) => {
        setProduct(p.data);
        setReviews(r.data);
        setRelated(rel.data);
        setStatus('ready');
      })
      .catch((err) => {
        const code = err.response?.status;
        if (code === 404 || code === 400) return setStatus('notfound');
        setError(errorMessage(err));
        setStatus('error');
      });
  };
  useEffect(load, [id]);

  const myReview = useMemo(() => reviews.find((r) => user && r.userId === user._id), [reviews, user]);

  if (status === 'loading') {
    return (
      <div className="container-page py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="space-y-4 pt-4">{[40, 80, 30, 50, 100].map((w, i) => <div key={i} className="h-7 skeleton" style={{ width: `${w}%` }} />)}</div>
      </div>
    );
  }
  if (status === 'notfound') {
    return (
      <div className="container-page py-16 max-w-xl">
        <EmptyState icon={PackageX} title="Product not found" message="It may have been removed, or the link is incorrect."
          action={<Link to="/products" className="btn-primary">Browse products</Link>} />
      </div>
    );
  }
  if (status === 'error') return <div className="container-page py-16 max-w-xl"><ErrorState message={error} onRetry={load} /></div>;

  const inCart = cartItems.find((i) => i.productId === product._id)?.quantity || 0;
  const available = Math.max(0, maxQtyFor(product) - inCart);
  const soldOut = product.stock === 0;
  const saved = wishlist.has(product._id);
  const average = product.rating?.average || 0;

  const handleAdd = () => {
    const { added, limited } = addToCart(product, quantity);
    if (!added) return showToast('You already have the maximum quantity in your cart', 'info');
    showToast(limited ? `Only ${added} more could be added` : `Added ${added} to cart`, limited ? 'info' : 'success');
    setQuantity(1);
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      showToast('Review deleted', 'success');
      refreshRatings();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="container-page py-8">
      <nav className="flex items-center gap-1.5 text-xs text-smoke mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-vividGold">Home</Link><ChevronRight className="w-3 h-3" />
        <Link to={`/products?category=${product.category}`} className="hover:text-vividGold">{product.category}</Link><ChevronRight className="w-3 h-3" />
        <span className="text-bodyInk truncate max-w-[14rem]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="card aspect-square p-8 flex items-center justify-center overflow-hidden">
            {/* switching thumbnails cross-fades the main image */}
            <AnimatePresence mode="wait" initial={false}>
              <m.img key={activeImg} src={product.images?.[activeImg] || ''} alt={product.name} onError={onImgError}
                initial={{ opacity: 0, filter: 'blur(2px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(2px)' }}
                transition={{ duration: 0.1, ease: EASE_OUT }}
                className="max-w-full max-h-full object-contain" />
            </AnimatePresence>
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2.5 mt-3">
              {product.images.map((img, idx) => (
                <button key={img} onClick={() => setActiveImg(idx)} aria-label={`Image ${idx + 1}`} aria-current={activeImg === idx}
                  className={`w-16 h-16 rounded-xl overflow-hidden bg-pureWhite border-2 p-1 transition ${activeImg === idx ? 'border-vividGold' : 'border-parchment hover:border-vividGold/50'}`}>
                  <img src={img} alt="" onError={onImgError} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <Reveal inView={false} delay={0.1}>
          <p className="text-xs text-smoke uppercase tracking-widest font-bold">{product.brand}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-midnight leading-tight mt-1">{product.name}</h1>

          <a href="#reviews" className="inline-flex items-center gap-2 mt-3 text-sm text-smoke hover:text-vividGold">
            <StarRating rating={average} />
            <span>{average.toFixed(1)} · {product.rating?.count || 0} review{product.rating?.count === 1 ? '' : 's'}</span>
          </a>

          <p className="text-4xl font-extrabold text-midnight mt-5">{formatINR(product.price)}</p>
          <p className="text-xs text-smoke mt-1">Inclusive of all taxes</p>

          <div className="mt-4">
            {soldOut ? <span className="badge-danger">Out of stock</span>
              : product.stock < 10 ? <span className="badge-warning">Only {product.stock} left — order soon</span>
              : <span className="badge-success">In stock</span>}
          </div>

          <p className="text-bodyInk text-sm leading-relaxed border-t border-parchment mt-6 pt-6">{product.description}</p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {!soldOut && available > 0 && (
              <QuantityStepper value={quantity} max={available} onChange={setQuantity} />
            )}
            <m.button whileTap={PRESS} onClick={handleAdd} disabled={soldOut || available === 0} className="btn-primary flex-1 min-w-[12rem] !py-3.5 !text-base">
              <ShoppingCart className="w-5 h-5" />
              {soldOut ? 'Out of stock' : available === 0 ? 'Maximum in cart' : 'Add to cart'}
            </m.button>
            <m.button whileTap={PRESS} onClick={() => wishlist.toggle(product._id)} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved}
              className="btn-outline !p-3.5">
              <IconSwap swapKey={saved ? 'saved' : 'unsaved'}>
                <Heart className={`w-5 h-5 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
              </IconSwap>
            </m.button>
          </div>
          {inCart > 0 && <p className="text-xs text-smoke mt-2">{inCart} already in your <Link to="/cart" className="underline hover:text-vividGold">cart</Link></p>}

          <p className="flex items-center gap-2 text-sm text-smoke mt-6">
            <Truck className="w-4 h-4 text-vividGold" />
            {product.price > FREE_SHIPPING_THRESHOLD ? 'Free delivery on this item' : `Free delivery on orders above ₹${FREE_SHIPPING_THRESHOLD}`}
          </p>
        </Reveal>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-14 scroll-mt-24">
        <h2 className="section-title mb-6">Customer reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {reviews.length > 0 && <RatingBreakdown reviews={reviews} average={average} />}
            {!user ? (
              <div className="card p-6 text-sm text-smoke">
                <Link to="/login" state={{ from: location.pathname }} className="font-semibold text-midnight underline hover:text-vividGold">Log in</Link> to write a review.
              </div>
            ) : myReview ? (
              <div className="card p-6 text-sm text-smoke">You reviewed this product on {formatDate(myReview.createdAt)}.</div>
            ) : (
              <ReviewForm productId={id} onPosted={refreshRatings} />
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 && <div className="card p-8 text-center text-smoke text-sm">No reviews yet. Be the first to share your experience.</div>}
            {reviews.map((r, i) => (
              <Reveal as="article" key={r._id} delay={Math.min(i, 5) * STAGGER_LIST} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-midnight flex items-center justify-center text-sm font-bold text-vividGold">{r.userName?.[0]?.toUpperCase()}</div>
                    <div>
                      <p className="font-semibold text-midnight text-sm flex items-center gap-2 flex-wrap">
                        {r.userName}
                        {r.verifiedPurchase && <span className="badge-success !py-0.5"><BadgeCheck className="w-3 h-3" /> Verified purchase</span>}
                      </p>
                      <StarRating rating={r.rating} size="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-smoke shrink-0">
                    {formatDate(r.createdAt)}
                    {(isAdmin || (user && r.userId === user._id)) && (
                      <button onClick={() => deleteReview(r._id)} aria-label="Delete review" className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {r.comment && <p className="text-bodyInk text-sm mt-3 leading-relaxed">{r.comment}</p>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-6">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
