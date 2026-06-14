import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const shipping = cartTotal > 999 ? 0 : 99;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-24 h-24 bg-pureWhite border border-parchment rounded-3xl flex items-center justify-center text-4xl">
          🛒
        </div>
        <h2 className="text-2xl font-bold text-midnight">Your cart is empty</h2>
        <p className="text-smoke max-w-xs">Add some amazing products to get started!</p>
        <button onClick={() => navigate('/products')} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center px-10 py-3 text-sm">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-midnight mb-8">
        Shopping Cart
        <span className="ml-3 text-base font-normal text-smoke bg-warmIvory px-3 py-1 rounded-full">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <div key={item.productId} className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-warmIvory flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=80&background=27272a&color=a78bfa`; }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-midnight text-sm line-clamp-2">{item.name}</p>
                <p className="text-vividGold font-extrabold text-sm mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              {/* Qty */}
              <div className="flex items-center bg-warmIvory border border-parchment rounded-lg overflow-hidden flex-shrink-0">
                <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                  className="px-2.5 py-1.5 text-smoke hover:text-midnight hover:bg-warmIvory transition text-sm font-bold">−</button>
                <span className="px-2.5 py-1.5 text-sm font-semibold text-midnight min-w-[2rem] text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="px-2.5 py-1.5 text-smoke hover:text-midnight hover:bg-warmIvory transition text-sm font-bold">+</button>
              </div>
              <p className="font-bold text-midnight text-sm w-20 text-right flex-shrink-0">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </p>
              <button onClick={() => removeFromCart(item.productId)}
                className="text-smoke hover:text-red-400 transition flex-shrink-0 ml-1 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-6 h-fit sticky top-20">
          <h2 className="font-bold text-lg text-midnight mb-5">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-smoke">
              <span>Subtotal</span>
              <span className="text-midnight">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-smoke">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-emerald-400 font-medium' : 'text-midnight'}>
                {shipping === 0 ? '🎉 FREE' : `₹${shipping}`}
              </span>
            </div>
            {cartTotal <= 999 && (
              <p className="text-[11px] text-smoke bg-warmIvory rounded-lg px-3 py-2">
                Add ₹{(1000 - cartTotal).toLocaleString('en-IN')} more for free shipping!
              </p>
            )}
            <div className="border-t border-parchment pt-3 flex justify-between font-bold text-lg">
              <span className="text-midnight">Total</span>
              <span className="text-vividGold font-extrabold">₹{(cartTotal + shipping).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center w-full py-3.5 text-sm mt-6">
            Proceed to Checkout →
          </button>
          <button onClick={() => navigate('/products')} className="btn-ghost w-full py-2.5 text-sm mt-2 text-smoke">
            ← Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
