import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const statusConfig = {
  Pending:    { cls: 'badge-warning', dot: 'bg-amber-400',  label: 'Pending' },
  Processing: { cls: 'badge-info',    dot: 'bg-blue-400',   label: 'Processing' },
  Delivered:  { cls: 'badge-success', dot: 'bg-emerald-400', label: 'Delivered' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [banner, setBanner] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.success) { setBanner(true); setTimeout(() => setBanner(false), 4000); }
    api.get('/orders/mine').then(({ data }) => setOrders(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl skeleton" />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {banner && (
        <div className="mb-6 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl px-5 py-4 font-medium flex items-center gap-3">
          <span className="text-2xl">🎉</span> Order placed successfully! We'll get it to you soon.
        </div>
      )}

      <h1 className="text-3xl font-bold text-midnight mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-smoke text-lg mb-6">No orders yet</p>
          <button onClick={() => navigate('/products')} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center px-8 py-3 text-sm">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const sc = statusConfig[order.status] || { cls: 'badge-gray', dot: 'bg-zinc-400', label: order.status };
            return (
              <div key={order._id} className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-mono text-sm text-smoke font-semibold">
                          #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <span className={`badge ${sc.cls} flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-smoke text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-vividGold font-extrabold text-xl mt-2">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right text-xs text-smoke">
                      <p>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                      <p className="capitalize">{order.paymentMethod}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    className="text-vividGold hover:text-vividGold text-xs font-semibold mt-3 flex items-center gap-1 transition"
                  >
                    {expandedId === order._id ? '↑ Hide Items' : '↓ View Items'}
                  </button>
                </div>

                {expandedId === order._id && (
                  <div className="border-t border-parchment bg-warmIvory px-5 py-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-warmIvory"
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=56&background=27272a&color=a78bfa`; }} />
                        <div>
                          <p className="font-medium text-midnight text-sm">{item.name}</p>
                          <p className="text-smoke text-xs mt-0.5">Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
