import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Lock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Field, Spinner } from '../components/ui';
import { OrderSummary } from './Cart';
import api, { errorMessage, fieldErrors } from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatINR, onImgError } from '../lib/format';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const PAYMENTS = [
  { id: 'COD', label: 'Cash on delivery', hint: 'Pay when it arrives', icon: Banknote },
  { id: 'CARD', label: 'Pay online', hint: 'Simulated — nothing is charged', icon: CreditCard },
];

// Same rules as the server (validators/schemas.js). Checking here gives
// instant feedback; the server still validates everything again.
const validate = (f) => {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Enter the recipient name';
  if (!/^[6-9]\d{9}$/.test(f.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number';
  if (f.address.trim().length < 5) errors.address = 'Enter the full street address';
  if (f.city.trim().length < 2) errors.city = 'Enter the city';
  if (!f.state) errors.state = 'Select the state';
  if (!/^[1-9]\d{5}$/.test(f.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode';
  return errors;
};

export default function Checkout() {
  usePageTitle('Checkout');
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user?.name || '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (cartItems.length === 0 && !placed) return <Navigate to="/cart" replace />;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const inputCls = (key) => `input ${errors[key] ? 'input-error' : ''}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setPlacing(true);
    try {
      // Only ids and quantities are sent — the server looks up the prices.
      const { data } = await api.post('/orders', {
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: form,
        paymentMethod,
      });
      setPlaced(true);
      clearCart();
      navigate(`/orders/${data._id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast(errorMessage(err, 'Could not place the order'), 'error');
      if (err.response?.status === 409) navigate('/cart'); // stock changed — let them adjust
    } finally {
      setPlacing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="container-page py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-midnight mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <h2 className="font-bold text-midnight text-lg mb-5 flex items-center gap-2"><MapPin className="w-5 h-5 text-vividGold" /> Delivery address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.name}>
                <input className={inputCls('name')} value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <input className={inputCls('phone')} value={form.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} placeholder="10-digit number" autoComplete="tel-national" />
              </Field>
              <Field label="Street address" error={errors.address} className="sm:col-span-2">
                <input className={inputCls('address')} value={form.address} onChange={set('address')} placeholder="House no., street, area" autoComplete="street-address" />
              </Field>
              <Field label="City" error={errors.city}>
                <input className={inputCls('city')} value={form.city} onChange={set('city')} autoComplete="address-level2" />
              </Field>
              <Field label="State" error={errors.state}>
                <select className={inputCls('state')} value={form.state} onChange={set('state')} autoComplete="address-level1">
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input className={inputCls('pincode')} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
              </Field>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-bold text-midnight text-lg mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-vividGold" /> Payment method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Payment method">
              {PAYMENTS.map(({ id, label, hint, icon: Icon }) => (
                <label key={id} className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${paymentMethod === id ? 'border-vividGold bg-vividGold/5' : 'border-parchment hover:border-vividGold/50'}`}>
                  <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-vividGold" />
                  <Icon className="w-5 h-5 text-smoke" />
                  <span>
                    <span className="block font-semibold text-sm text-midnight">{label}</span>
                    <span className="block text-xs text-smoke">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="h-fit lg:sticky lg:top-24">
          <OrderSummary itemsTotal={cartTotal}>
            <ul className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <li key={item.productId} className="flex gap-3 items-center">
                  <img src={item.image} alt="" onError={onImgError} className="w-12 h-12 rounded-lg object-contain bg-warmIvory p-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-midnight text-xs line-clamp-1">{item.name}</p>
                    <p className="text-smoke text-xs">{item.quantity} × {formatINR(item.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </OrderSummary>
          <button type="submit" disabled={placing} className="btn-primary w-full !py-3.5 mt-4">
            {placing ? <Spinner className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>
    </form>
  );
}
