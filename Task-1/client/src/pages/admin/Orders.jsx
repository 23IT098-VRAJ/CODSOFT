import React, { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useToast } from '../../components/Toast';
import { ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { OrderItems, OrderTimeline } from '../OrderDetail';
import api, { errorMessage } from '../../lib/axios';
import { formatDate, formatINR, orderNumber } from '../../lib/format';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Mirrors STATUS_TRANSITIONS on the server: the only moves an admin may make.
const NEXT = {
  Pending: [{ status: 'Processing', label: 'Start processing' }, { status: 'Cancelled', label: 'Cancel', danger: true }],
  Processing: [{ status: 'Shipped', label: 'Mark shipped' }, { status: 'Cancelled', label: 'Cancel', danger: true }],
  Shipped: [{ status: 'Delivered', label: 'Mark delivered' }],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrders() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ orders: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/orders', { params: { status: filter || undefined, page, limit: 10 }, signal: controller.signal })
      .then(({ data }) => { setResult(data); setLoading(false); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const changeFilter = (status) => { setFilter(status); setPage(1); setExpanded(null); };

  const move = async (order, status) => {
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${orderNumber(order._id)}? Stock will be returned.`)) return;
    setUpdating(order._id);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status });
      setResult((r) => ({ ...r, orders: r.orders.map((o) => (o._id === data._id ? data : o)) }));
      showToast(`Order ${orderNumber(order._id)} is now ${status.toLowerCase()}`, 'success');
    } catch (err) {
      showToast(errorMessage(err), 'error');
      setReload((n) => n + 1); // someone else may have changed it — refetch
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout title="Orders" subtitle={`${result.total} order${result.total === 1 ? '' : 's'}${filter ? ` · ${filter.toLowerCase()}` : ''}`}>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none" role="tablist" aria-label="Filter by status">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} role="tab" aria-selected={filter === s} onClick={() => changeFilter(s)}
            className={`btn !py-1.5 !px-4 whitespace-nowrap ${filter === s ? 'bg-midnight text-pureWhite' : 'bg-pureWhite border border-parchment text-smoke hover:border-vividGold'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>{['Order', 'Customer', 'Date', 'Total', 'Status', 'Action', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr>
              </thead>
              <tbody className={`divide-y divide-parchment ${loading ? 'opacity-50' : ''}`}>
                {loading && !result.orders.length
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="table-cell"><div className="h-10 skeleton" /></td></tr>)
                  : result.orders.map((o) => {
                    const open = expanded === o._id;
                    const a = o.shippingAddress || {};
                    return (
                      <Fragment key={o._id}>
                        <tr className="hover:bg-warmIvory/60">
                          <td className="table-cell font-mono text-xs font-semibold text-midnight">{orderNumber(o._id)}</td>
                          <td className="table-cell">
                            <p className="font-medium text-midnight">{o.userId?.name || 'Deleted user'}</p>
                            <p className="text-smoke text-xs">{o.userId?.email}</p>
                          </td>
                          <td className="table-cell text-smoke text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                          <td className="table-cell font-semibold text-midnight whitespace-nowrap">
                            {formatINR(o.totalAmount)} <span className="badge-gray !py-0.5 ml-1">{o.paymentMethod}</span>
                          </td>
                          <td className="table-cell"><StatusBadge status={o.status} /></td>
                          <td className="table-cell">
                            {updating === o._id ? <Spinner className="w-4 h-4 text-vividGold" /> : (
                              <div className="flex gap-2">
                                {NEXT[o.status]?.map((n) => (
                                  <button key={n.status} onClick={() => move(o, n.status)}
                                    className={`${n.danger ? 'btn-danger' : 'btn-dark'} !py-1.5 !px-3 !text-xs whitespace-nowrap`}>{n.label}</button>
                                ))}
                                {!NEXT[o.status]?.length && <span className="text-smoke text-xs">—</span>}
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <button onClick={() => setExpanded(open ? null : o._id)} aria-expanded={open} aria-label="Order details" className="p-1.5 text-smoke hover:text-midnight rounded-lg hover:bg-parchment/50">
                              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={7} className="bg-warmIvory/60 px-5 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="card p-5"><OrderItems order={o} /></div>
                                <div className="space-y-4">
                                  <div className="card p-5"><OrderTimeline order={o} /></div>
                                  <div className="card p-5 text-sm">
                                    <p className="font-bold text-midnight mb-1">Ship to</p>
                                    <p className="text-bodyInk">{a.name} · {a.phone}</p>
                                    <p className="text-smoke">{[a.address, a.city, a.state].filter(Boolean).join(', ')} {a.pincode}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                {!loading && !result.orders.length && (
                  <tr><td colSpan={7} className="table-cell text-center text-smoke py-10">No orders{filter ? ` with status "${filter}"` : ''}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={page} pages={result.pages} onChange={(p) => { setPage(p); setExpanded(null); }} />
    </AdminLayout>
  );
}
