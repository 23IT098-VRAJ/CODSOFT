import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import api from '../lib/axios';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '', paymentMethod: 'COD' });
  const [loading, setLoading] = useState(false);
  const shipping = cartTotal > 999 ? 0 : 99;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleOrder = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { name, phone, address, city, pincode, paymentMethod } = form;
      await api.post('/orders', { items: cartItems, shippingAddress: { name, phone, address, city, pincode }, paymentMethod, totalAmount: cartTotal + shipping });
      clearCart(); showToast('Order placed! 🎉', 'success');
      navigate('/orders', { state: { success: true } });
    } catch (err) { showToast(err.response?.data?.message || 'Failed to place order', 'error'); }
    finally { setLoading(false); }
  };

  const inputCls = 'bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full';

  return (
    <form onSubmit={handleOrder} className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-midnight mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-6">
            <h2 className="font-bold text-midnight text-lg mb-5 flex items-center gap-2">
              <span className="text-2xl">📦</span> Shipping Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input required className={`${inputCls} col-span-2`} placeholder="Full Name" value={form.name} onChange={set('name')} />
              <input required className={inputCls} placeholder="Phone Number" value={form.phone} onChange={set('phone')} />
              <input required className={inputCls} placeholder="Pincode" value={form.pincode} onChange={set('pincode')} />
              <input required className={`${inputCls} col-span-2`} placeholder="Street Address" value={form.address} onChange={set('address')} />
              <input required className={`${inputCls} col-span-2`} placeholder="City" value={form.city} onChange={set('city')} />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-6">
            <h2 className="font-bold text-midnight text-lg mb-5 flex items-center gap-2">
              <span className="text-2xl">💳</span> Payment Method
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[{ id: 'COD', label: 'Cash on Delivery', icon: '💵' }, { id: 'CARD', label: 'Pay by Card', icon: '💳' }].map((m) => (
                <label key={m.id} className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  form.paymentMethod === m.id
                    ? 'border-violet-500/40 bg-violet-500/10 text-vividGold'
                    : 'border-parchment hover:border-parchment text-smoke'
                }`}>
                  <input type="radio" name="payment" value={m.id} checked={form.paymentMethod === m.id} onChange={set('paymentMethod')} className="sr-only" />
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium text-sm">{m.label}</span>
                </label>
              ))}
            </div>

            {form.paymentMethod === 'CARD' && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <input className={`${inputCls} col-span-3`} placeholder="4242 4242 4242 4242" />
                <input className={inputCls} placeholder="MM/YY" />
                <input className={inputCls} placeholder="CVV" />
                <p className="col-span-3 text-xs text-smoke bg-warmIvory rounded-lg px-3 py-2">
                  🔒 This is a demo — no real payment is processed
                </p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || cartItems.length === 0}
            className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center w-full py-4 text-base">
            {loading ? 'Placing Order…' : '🎉 Place Order'}
          </button>
        </div>

        {/* Right — Summary */}
        <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-6 h-fit sticky top-20">
          <h2 className="font-bold text-midnight text-lg mb-5">Order Summary</h2>
          <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex gap-3 items-center">
                <img src={item.image} alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover bg-warmIvory flex-shrink-0"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=48&background=27272a&color=a78bfa`; }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-midnight text-xs line-clamp-1">{item.name}</p>
                  <p className="text-smoke text-xs">{item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-parchment pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-smoke"><span>Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-smoke"><span>Shipping</span><span className={shipping === 0 ? 'text-emerald-400' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span className="text-midnight">Total</span>
              <span className="text-vividGold font-extrabold">₹{(cartTotal + shipping).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
