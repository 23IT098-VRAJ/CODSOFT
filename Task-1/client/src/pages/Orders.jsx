import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PackageOpen } from 'lucide-react';
import { EmptyState, ErrorState, StatusBadge } from '../components/ui';
import api, { errorMessage } from '../lib/axios';
import { usePageTitle } from '../hooks';
import { formatDate, formatINR, onImgError, orderNumber } from '../lib/format';

export default function Orders() {
  usePageTitle('My orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-midnight mb-8">My orders</h1>

      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState icon={PackageOpen} title="No orders yet" message="When you place an order it will show up here."
          action={<Link to="/products" className="btn-primary">Start shopping</Link>} />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id}>
              <Link to={`/orders/${order._id}`} className="card p-5 flex items-center gap-4 hover:border-vividGold hover:shadow-md transition">
                <div className="flex -space-x-3 shrink-0">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img key={i} src={item.image} alt="" onError={onImgError} className="w-12 h-12 rounded-full object-contain bg-warmIvory border-2 border-pureWhite p-1" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-mono text-sm font-semibold text-midnight">{orderNumber(order._id)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-smoke text-xs mt-1 truncate">
                    {formatDate(order.createdAt)} · {order.items.map((i) => i.name).join(', ')}
                  </p>
                  <p className="font-bold text-midnight mt-1.5">
                    {formatINR(order.totalAmount)}
                    <span className="font-normal text-xs text-smoke"> · {order.items.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-smoke shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
