import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { m } from 'motion/react';
import BorderBeam from '../components/motion/BorderBeam';
import { celebrate } from '../lib/confetti';
import { EASE_IN_OUT, SPRING_SWAP, T_STATE } from '../lib/motion';
import { ArrowLeft, Check, CheckCircle2, PackageX, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorState, PageLoader, Spinner, StatusBadge } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatDate, formatINR, onImgError, orderNumber } from '../lib/format';

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const STEP_LABELS = { Pending: 'Order placed', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered' };

// Horizontal progress tracker built from the order's status history.
export function OrderTimeline({ order }) {
  const history = order.statusHistory || [];
  const timeOf = (status) => history.find((h) => h.status === status)?.at;

  if (order.status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
        <XCircle className="w-5 h-5 shrink-0" />
        <span>
          This order was cancelled{timeOf('Cancelled') ? ` on ${formatDate(timeOf('Cancelled'), true)}` : ''}. Reserved stock has been released.
        </span>
      </div>
    );
  }

  const current = STEPS.indexOf(order.status);
  return (
    <ol className="flex">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const at = timeOf(step) || (i === 0 ? order.createdAt : null);
        return (
          <li key={step} className="flex-1 relative text-center">
            {/* grey track, with a gold line that draws itself in step by step */}
            {i > 0 && (
              <span className="absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 bg-parchment">
                {done && (
                  <m.span className="absolute inset-0 bg-vividGold origin-left"
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3, delay: (i - 1) * 0.3 + 0.15, ease: EASE_IN_OUT }} />
                )}
              </span>
            )}
            <m.span
              key={done ? 'done' : 'todo'}
              initial={done ? { scale: 0.95, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...T_STATE, delay: done ? i * 0.3 : 0 }}
              className={`relative z-10 mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-vividGold text-midnight' : 'bg-parchment text-smoke'}`}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
              {/* the current step gently pulses */}
              {i === current && order.status !== 'Delivered' && (
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-vividGold/50 animate-ping [animation-duration:2s]" />
              )}
            </m.span>
            <p className={`text-xs font-semibold mt-2 ${done ? 'text-midnight' : 'text-smoke'}`}>{STEP_LABELS[step]}</p>
            {done && at && <p className="text-[11px] text-smoke mt-0.5">{formatDate(at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ order }) {
  const itemsTotal = order.itemsTotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = order.shippingFee ?? Math.max(0, order.totalAmount - itemsTotal);
  return (
    <>
      <ul className="divide-y divide-parchment">
        {order.items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-3 items-center">
            <img src={item.image} alt="" onError={onImgError} className="w-14 h-14 rounded-xl object-contain bg-warmIvory p-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.productId}`} className="font-medium text-midnight text-sm line-clamp-1 hover:text-vividGold">{item.name}</Link>
              <p className="text-smoke text-xs mt-0.5">{item.quantity} × {formatINR(item.price)}</p>
            </div>
            <p className="font-semibold text-midnight text-sm">{formatINR(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="border-t border-parchment pt-4 mt-1 space-y-2 text-sm">
        <div className="flex justify-between text-smoke"><dt>Subtotal</dt><dd>{formatINR(itemsTotal)}</dd></div>
        <div className="flex justify-between text-smoke"><dt>Shipping</dt><dd>{shippingFee ? formatINR(shippingFee) : 'FREE'}</dd></div>
        <div className="flex justify-between font-bold text-base text-midnight pt-1"><dt>Total</dt><dd>{formatINR(order.totalAmount)}</dd></div>
      </dl>
    </>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  usePageTitle(order ? `Order ${orderNumber(order._id)}` : 'Order');

  const load = () => {
    setStatus('loading');
    api.get(`/orders/${id}`)
      .then(({ data }) => { setOrder(data); setStatus('ready'); })
      .catch((err) => {
        if ([400, 404].includes(err.response?.status)) return setStatus('notfound');
        setError(errorMessage(err));
        setStatus('error');
      });
  };
  useEffect(load, [id]);

  // Arriving straight from checkout: celebrate once. The flag is then cleared
  // from the history entry so a refresh or the back button does not replay it.
  const justPlaced = Boolean(location.state?.justPlaced);
  useEffect(() => {
    if (!justPlaced) return;
    celebrate();
    window.history.replaceState({ ...window.history.state, usr: null }, '');
  }, [justPlaced]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
      showToast('Order cancelled', 'success');
    } catch (err) {
      showToast(errorMessage(err), 'error');
      load(); // the status probably changed under us — show the latest
    } finally {
      setCancelling(false);
    }
  };

  if (status === 'loading') return <PageLoader />;
  if (status === 'notfound') {
    return (
      <div className="container-page py-16 max-w-xl">
        <EmptyState icon={PackageX} title="Order not found" action={<Link to="/orders" className="btn-primary">My orders</Link>} />
      </div>
    );
  }
  if (status === 'error') return <div className="container-page py-16 max-w-xl"><ErrorState message={error} onRetry={load} /></div>;

  const a = order.shippingAddress || {};
  const canCancel = ['Pending', 'Processing'].includes(order.status);

  return (
    <div className="container-page py-8 max-w-3xl">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-smoke hover:text-vividGold mb-5"><ArrowLeft className="w-4 h-4" /> All orders</Link>

      {location.state?.justPlaced && (
        <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={T_STATE}
          className="relative flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-sm mb-6" role="status">
          <BorderBeam size={70} duration={5} colorFrom="#059669" colorTo="#6EE7B7" />
          <m.span initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ ...SPRING_SWAP, delay: 0.1 }}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </m.span>
          <span><strong>Order placed.</strong> Thank you — we'll get it to you soon.</span>
        </m.div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight flex items-center gap-3 flex-wrap">Order {orderNumber(order._id)} <StatusBadge status={order.status} /></h1>
          <p className="text-smoke text-sm mt-1">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        {canCancel && (
          <button onClick={cancel} disabled={cancelling} className="btn-danger">
            {cancelling && <Spinner className="w-4 h-4" />} Cancel order
          </button>
        )}
      </div>

      <div className="space-y-6">
        <section className="card p-6"><OrderTimeline order={order} /></section>

        <section className="card p-6">
          <h2 className="font-bold text-midnight mb-2">Items</h2>
          <OrderItems order={order} />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-6 text-sm">
            <h2 className="font-bold text-midnight mb-2">Delivery address</h2>
            <p className="text-bodyInk font-medium">{a.name}</p>
            <p className="text-smoke">{a.address}</p>
            <p className="text-smoke">{[a.city, a.state].filter(Boolean).join(', ')} {a.pincode}</p>
            <p className="text-smoke mt-1">Phone: {a.phone}</p>
          </div>
          <div className="card p-6 text-sm">
            <h2 className="font-bold text-midnight mb-2">Payment</h2>
            <p className="text-bodyInk font-medium">{order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Paid online (simulated)'}</p>
            <p className="text-smoke">{formatINR(order.totalAmount)}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
