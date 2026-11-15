import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import CountUp from '../components/motion/CountUp';
import { T_EXIT, T_STATE } from '../lib/motion';
import { useCart, maxQtyFor } from '../context/CartContext';
import { EmptyState, QuantityStepper } from '../components/ui';
import api from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatINR, FREE_SHIPPING_THRESHOLD, onImgError, shippingFeeFor } from '../lib/format';

// A cart line is "blocked" when it cannot be ordered as it stands.
export const lineProblem = (item) => {
  if (item.stock === 0) return 'Out of stock';
  if (item.stock !== undefined && item.quantity > item.stock) return `Only ${item.stock} available`;
  return null;
};

export function OrderSummary({ itemsTotal, children }) {
  const shipping = shippingFeeFor(itemsTotal);
  return (
    <div className="card p-6">
      <h2 className="font-bold text-lg text-midnight mb-5">Order summary</h2>
      {children}
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between text-smoke"><dt>Subtotal</dt><dd className="text-midnight">{formatINR(itemsTotal)}</dd></div>
        <div className="flex justify-between text-smoke">
          <dt>Shipping</dt>
          <dd className={shipping === 0 ? 'text-emerald-600 font-semibold' : 'text-midnight'}>{shipping === 0 ? 'FREE' : formatINR(shipping)}</dd>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-smoke bg-warmIvory rounded-lg px-3 py-2">
            Add {formatINR(FREE_SHIPPING_THRESHOLD + 1 - itemsTotal)} more for free shipping
          </p>
        )}
        <div className="border-t border-parchment pt-3 flex justify-between font-bold text-lg text-midnight">
          {/* the total rolls to its new value whenever the cart changes */}
          <dt>Total</dt><dd className="tabular-nums"><CountUp start={itemsTotal + shipping} end={itemsTotal + shipping} duration={0.25} format={formatINR} /></dd>
        </div>
      </dl>
    </div>
  );
}

export default function Cart() {
  usePageTitle('Cart');
  const { cartItems, removeFromCart, updateQuantity, cartTotal, syncCart } = useCart();
  const navigate = useNavigate();

  // Prices and stock may have changed since items were added — refresh them.
  useEffect(() => {
    if (!cartItems.length) return;
    Promise.all(
      cartItems.map((i) =>
        api.get(`/products/${i.productId}`)
          .then(({ data }) => [i.productId, data])
          .catch((err) => [i.productId, err.response?.status === 404 ? null : undefined])
      )
    ).then((entries) => syncCart(Object.fromEntries(entries)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="container-page py-16 max-w-xl">
        <EmptyState icon={ShoppingCart} title="Your cart is empty" message="Browse the catalogue and add something you like."
          action={<Link to="/products" className="btn-primary">Browse products</Link>} />
      </div>
    );
  }

  const blocked = cartItems.some(lineProblem);

  return (
    <div className="container-page py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-midnight mb-8">
        Shopping cart <span className="text-base font-normal text-smoke">({cartItems.length} item{cartItems.length === 1 ? '' : 's'})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ul className="lg:col-span-2 space-y-3">
          {/* a removed line slides out and the rest glide up to fill the gap */}
          <AnimatePresence mode="popLayout" initial={false}>
          {cartItems.map((item) => {
            const problem = lineProblem(item);
            return (
              <m.li key={item.productId} layout="position"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96, transition: T_EXIT }}
                transition={T_STATE}
                className={`card p-4 flex gap-4 ${problem ? 'border-red-300' : ''}`}>
                <Link to={`/products/${item.productId}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-warmIvory shrink-0 p-2">
                  <img src={item.image} alt={item.name} onError={onImgError} className="w-full h-full object-contain" />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-3">
                    <Link to={`/products/${item.productId}`} className="font-semibold text-midnight text-sm line-clamp-2 hover:text-vividGold">{item.name}</Link>
                    <p className="font-bold text-midnight shrink-0">{formatINR(item.price * item.quantity)}</p>
                  </div>
                  <p className="text-smoke text-xs mt-0.5">{formatINR(item.price)} each</p>
                  {problem && (
                    <p className="text-red-600 text-xs font-semibold mt-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {problem}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    {item.stock === 0 ? <span /> : (
                      <QuantityStepper size="sm" value={item.quantity} max={maxQtyFor(item)} onChange={(q) => updateQuantity(item.productId, q)} />
                    )}
                    <button onClick={() => removeFromCart(item.productId)} className="text-xs font-semibold text-smoke hover:text-red-600 inline-flex items-center gap-1 transition">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </m.li>
            );
          })}
          </AnimatePresence>
        </ul>

        {/* the whole column sticks, so the checkout button stays under the summary */}
        <div className="h-fit lg:sticky lg:top-24">
          <OrderSummary itemsTotal={cartTotal} />
          {blocked && <p className="text-xs text-red-600 mt-3">Fix the highlighted items before checking out.</p>}
          <button onClick={() => navigate('/checkout')} disabled={blocked} className="btn-primary w-full !py-3.5 mt-4">
            Proceed to checkout <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/products" className="btn-ghost w-full mt-2">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
