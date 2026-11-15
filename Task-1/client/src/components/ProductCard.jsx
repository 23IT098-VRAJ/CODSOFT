import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { Check, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';
import { StarRating } from './ui';
import Reveal from './motion/Reveal';
import IconSwap from './motion/IconSwap';
import { DUR, EASE_OUT, PRESS, STAGGER_LIST } from '../lib/motion';
import { formatINR, onImgError } from '../lib/format';

// Defined once, outside the component, so every card shares the same objects
// and a re-render never hands Motion a "new" animation to diff.
const HOVER_LIFT = { y: -4 };
const HOVER_TRANSITION = { duration: DUR.press, ease: EASE_OUT };

// `index` staggers the entrance of cards in a grid: each card fades up
// slightly after the one before it as the row scrolls into view.
export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const wishlist = useWishlist();
  const { showToast } = useToast();
  const saved = wishlist.has(product._id);
  const soldOut = product.stock === 0;

  // After a successful add the cart icon briefly becomes a tick.
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleAdd = () => {
    const { added } = addToCart(product, 1);
    showToast(added ? `${product.name} added to cart` : 'You already have the maximum quantity in your cart', added ? 'success' : 'info');
    if (added) {
      setJustAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustAdded(false), 1400);
    }
  };

  return (
    <Reveal as="article" delay={Math.min(index, 8) * STAGGER_LIST} className="h-full">
      <m.div
        whileHover={HOVER_LIFT}
        transition={HOVER_TRANSITION}
        className="card group relative flex flex-col h-full overflow-hidden hover:shadow-xl hover:border-vividGold/60 transition-shadow"
      >
        <m.button
          whileTap={PRESS}
          onClick={() => wishlist.toggle(product._id)}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={saved}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-pureWhite/90 border border-parchment flex items-center justify-center hover:border-vividGold"
        >
          <IconSwap swapKey={saved ? 'saved' : 'unsaved'}>
            <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-smoke'}`} />
          </IconSwap>
        </m.button>

        <Link to={`/products/${product._id}`} className="block bg-warmIvory/60 aspect-square p-6 overflow-hidden">
          <img
            src={product.images?.[0] || ''}
            alt={product.name}
            loading="lazy"
            onError={onImgError}
            className={`w-full h-full object-contain group-hover:scale-105 transition-transform ${soldOut ? 'opacity-50 grayscale' : ''}`}
          />
        </Link>

        {soldOut ? (
          <span className="badge-danger absolute top-3 left-3">Out of stock</span>
        ) : product.stock < 10 ? (
          <span className="badge-warning absolute top-3 left-3">Only {product.stock} left</span>
        ) : null}

        <div className="flex flex-col flex-1 p-4">
          <p className="text-[11px] text-smoke uppercase font-bold tracking-wider truncate">{product.brand}</p>
          <Link to={`/products/${product._id}`} className="font-semibold text-midnight leading-snug line-clamp-2 mt-0.5 hover:text-vividGold">
            {product.name}
          </Link>

          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating rating={product.rating?.average || 0} size="w-3.5 h-3.5" />
            <span className="text-smoke text-xs">({product.rating?.count || 0})</span>
          </div>

          <div className="flex items-end justify-between gap-2 mt-auto pt-3">
            <p className="text-midnight font-extrabold text-lg">{formatINR(product.price)}</p>
            <m.button
              whileTap={PRESS}
              onClick={handleAdd}
              disabled={soldOut}
              aria-label={`Add ${product.name} to cart`}
              className={`btn !px-3.5 !py-2 text-pureWhite ${justAdded ? 'bg-emerald-600' : 'bg-midnight hover:bg-bodyInk'}`}
            >
              <IconSwap swapKey={justAdded ? 'done' : 'add'}>
                {justAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              </IconSwap>
              <span className="hidden sm:inline">{justAdded ? 'Added' : 'Add'}</span>
            </m.button>
          </div>
        </div>
      </m.div>
    </Reveal>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="aspect-square skeleton rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 skeleton w-1/3" />
        <div className="h-4 skeleton w-5/6" />
        <div className="h-3 skeleton w-1/2" />
        <div className="h-8 skeleton mt-3" />
      </div>
    </div>
  );
}
