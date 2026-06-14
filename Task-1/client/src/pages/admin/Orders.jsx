import React, { useEffect, useState } from 'react';
import { AdminNav } from './Dashboard';
import api from '../../lib/axios';

const statusConfig = {
  Pending:    { cls: 'badge-warning', dot: 'bg-amber-400' },
  Processing: { cls: 'badge-info',    dot: 'bg-blue-400' },
  Delivered:  { cls: 'badge-success', dot: 'bg-emerald-400' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-midnight">All Orders</h1>
        <span className="badge badge-gray">{orders.length}</span>
      </div>

      <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-parchment bg-warmIvory">
                {['Order', 'Customer', 'Date', 'Total', 'Payment', 'Status', 'Update'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-smoke">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-10 skeleton rounded-xl" /></td></tr>
                ))
                : orders.map((o) => {
                    const sc = statusConfig[o.status] || { cls: 'badge-gray', dot: 'bg-zinc-400' };
                    return (
                      <tr key={o._id} className="hover:bg-warmIvory transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-smoke font-semibold">
                          #{o._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-midnight text-sm">{o.userId?.name}</p>
                          <p className="text-smoke text-xs">{o.userId?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-smoke text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-vividGold font-extrabold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-gray text-[10px]">{o.paymentMethod}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${sc.cls} flex items-center gap-1.5 w-fit`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {updating === o._id ? (
                            <span className="text-smoke text-xs">Updating…</span>
                          ) : (
                            <select
                              defaultValue={o.status}
                              onChange={(e) => handleStatusChange(o._id, e.target.value)}
                              className="bg-warmIvory border border-parchment text-midnight text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer hover:border-parchment transition"
                            >
                              {['Pending', 'Processing', 'Delivered'].map((s) => <option key={s}>{s}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
