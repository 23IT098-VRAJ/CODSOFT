import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, IndianRupee, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import AdminLayout from './AdminLayout';
import Reveal from '../../components/motion/Reveal';
import CountUp from '../../components/motion/CountUp';
import { STAGGER_LIST } from '../../lib/motion';
import { ErrorState, StatusBadge } from '../../components/ui';
import api, { errorMessage } from '../../lib/axios';
import { formatCompactINR, formatDate, formatINR, onImgError, orderNumber } from '../../lib/format';

const GOLD = '#D4A017';
const INK = '#0B1120';
const STATUS_COLORS = { Pending: '#F59E0B', Processing: '#3B82F6', Shipped: '#6366F1', Delivered: '#10B981', Cancelled: '#EF4444' };
const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Each figure counts up from zero when the dashboard loads (React Bits CountUp).
function StatCard({ icon: Icon, label, value, format, loading, index = 0 }) {
  return (
    <Reveal delay={index * STAGGER_LIST} className="card p-5 group hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="flex items-center justify-between">
        <p className="text-smoke text-xs font-semibold uppercase tracking-wider">{label}</p>
        <Icon className="w-5 h-5 text-vividGold transition-transform group-hover:scale-110" />
      </div>
      {loading ? <div className="h-8 w-24 skeleton mt-3" /> : (
        <p className="text-2xl sm:text-3xl font-extrabold text-midnight mt-2 tabular-nums"><CountUp end={value || 0} format={format} /></p>
      )}
    </Reveal>
  );
}

function Panel({ title, children, className = '', action }) {
  return (
    <Reveal as="section" className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-midnight">{title}</h2>
        {action}
      </div>
      {children}
    </Reveal>
  );
}

const tooltipStyle = { borderRadius: 12, border: '1px solid #EDE5D0', fontSize: 12 };
const Empty = ({ children }) => <p className="text-smoke text-sm py-8 text-center">{children}</p>;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch((err) => setError(errorMessage(err)));
  };
  useEffect(load, []);

  const loading = !stats;
  const hasOrders = stats?.totalOrders > 0;

  return (
    <AdminLayout title="Dashboard" subtitle="Store performance at a glance">
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard index={0} icon={IndianRupee} label="Revenue" value={stats?.totalRevenue} format={formatINR} loading={loading} />
            <StatCard index={1} icon={ShoppingBag} label="Orders" value={stats?.totalOrders} loading={loading} />
            <StatCard index={2} icon={TrendingUp} label="Avg. order" value={stats?.averageOrderValue} format={formatINR} loading={loading} />
            <StatCard index={3} icon={Package} label="Products" value={stats?.totalProducts} loading={loading} />
            <StatCard index={4} icon={Users} label="Users" value={stats?.totalUsers} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title="Revenue — last 14 days" className="lg:col-span-2">
              {loading ? <div className="h-64 skeleton" /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D0" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 11, fill: '#4B5563' }} tickLine={false} axisLine={false} minTickGap={20} />
                      <YAxis tickFormatter={formatCompactINR} tick={{ fontSize: 11, fill: '#4B5563' }} tickLine={false} axisLine={false} width={50} />
                      <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay}
                        formatter={(value, name) => (name === 'revenue' ? [formatINR(value), 'Revenue'] : [value, 'Orders'])} />
                      <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} fill="url(#revenueFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Orders by status">
              {loading ? <div className="h-64 skeleton" /> : !hasOrders ? <Empty>No orders yet</Empty> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ordersByStatus} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#4B5563' }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#FAF7F2' }} formatter={(v) => [v, 'Orders']} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} label={{ position: 'right', fontSize: 12, fill: INK }}>
                        {stats.ordersByStatus.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title="Sales by category">
              {loading ? <div className="h-56 skeleton" /> : !stats.categorySales.length ? <Empty>No sales yet</Empty> : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categorySales} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D0" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#4B5563' }} tickLine={false} axisLine={false} interval={0} />
                      <YAxis tickFormatter={formatCompactINR} tick={{ fontSize: 11, fill: '#4B5563' }} tickLine={false} axisLine={false} width={50} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#FAF7F2' }} formatter={(v) => [formatINR(v), 'Revenue']} />
                      <Bar dataKey="revenue" fill={INK} radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Best sellers">
              {loading ? <div className="h-56 skeleton" /> : !stats.topProducts.length ? <Empty>No sales yet</Empty> : (
                <ol className="space-y-3">
                  {stats.topProducts.map((p, i) => (
                    <li key={p._id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-smoke font-semibold">{i + 1}</span>
                      <img src={p.image} alt="" onError={onImgError} className="w-9 h-9 rounded-lg object-contain bg-warmIvory p-0.5" />
                      <span className="flex-1 min-w-0 truncate text-midnight font-medium">{p.name}</span>
                      <span className="text-smoke text-xs whitespace-nowrap">{p.unitsSold} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title="Low stock" action={<Link to="/admin/products" className="text-xs font-semibold text-smoke hover:text-vividGold">Manage</Link>}>
              {loading ? <div className="h-56 skeleton" /> : !stats.lowStock.length ? <Empty>Everything is well stocked</Empty> : (
                <ul className="space-y-3">
                  {stats.lowStock.map((p) => (
                    <li key={p._id} className="flex items-center gap-3 text-sm">
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="flex-1 min-w-0 truncate text-midnight font-medium">{p.name}</span>
                      <span className={p.stock === 0 ? 'badge-danger' : 'badge-warning'}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Recent orders" action={<Link to="/admin/orders" className="text-xs font-semibold text-smoke hover:text-vividGold">View all</Link>}>
            {loading ? <div className="h-40 skeleton" /> : !stats.recentOrders.length ? <Empty>No orders yet</Empty> : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-parchment">
                    {stats.recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="table-cell pl-5 font-mono text-xs font-semibold text-midnight">{orderNumber(o._id)}</td>
                        <td className="table-cell text-bodyInk">{o.userId?.name || 'Deleted user'}</td>
                        <td className="table-cell text-smoke text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                        <td className="table-cell"><StatusBadge status={o.status} /></td>
                        <td className="table-cell pr-5 text-right font-semibold text-midnight">{formatINR(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
}
