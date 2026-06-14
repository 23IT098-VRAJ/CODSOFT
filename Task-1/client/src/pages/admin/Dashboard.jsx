import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../lib/axios';

export const AdminNav = () => (
  <div className="flex gap-1 mb-8 bg-pureWhite border border-parchment rounded-2xl p-1.5">
    {[['🏠 Dashboard', '/admin'], ['📦 Products', '/admin/products'], ['🛒 Orders', '/admin/orders']].map(([label, path]) => (
      <NavLink key={path} to={path} end={path === '/admin'}
        className={({ isActive }) =>
          `flex-1 text-center py-2 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
            isActive
              ? 'bg-warmIvory text-white shadow-lg shadow-violet-500/25'
              : 'text-smoke hover:text-midnight hover:bg-warmIvory'
          }`
        }>{label}</NavLink>
    ))}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/stats').then(({ data }) => setStats(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: '📦', label: 'Total Products', value: stats?.totalProducts, color: 'from-violet-600/20 to-purple-600/10 border-violet-500/40/20' },
    { icon: '🛒', label: 'Total Orders', value: stats?.totalOrders, color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/20' },
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers, color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-midnight">Dashboard</h1>
        <p className="text-smoke text-sm mt-1">Welcome back, Admin 👋</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className={`bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm bg-gradient-to-br ${c.color} p-6 hover:scale-[1.02] transition-transform duration-200`}>
            <p className="text-4xl mb-4">{c.icon}</p>
            <p className={`text-5xl font-extrabold mb-1 ${loading ? 'skeleton h-12 w-20 rounded' : 'gradient-text'}`}>
              {loading ? '' : c.value}
            </p>
            <p className="text-smoke text-sm font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <NavLink to="/admin/products" className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-5 flex items-center gap-4 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group">
          <div className="w-12 h-12 bg-violet-500/15 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📦</div>
          <div>
            <p className="font-semibold text-midnight">Manage Products</p>
            <p className="text-smoke text-xs mt-0.5">Add, edit, or remove products</p>
          </div>
          <svg className="ml-auto text-smoke group-hover:text-vividGold transition w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </NavLink>
        <NavLink to="/admin/orders" className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm p-5 flex items-center gap-4 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group">
          <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛒</div>
          <div>
            <p className="font-semibold text-midnight">Manage Orders</p>
            <p className="text-smoke text-xs mt-0.5">Update order status in realtime</p>
          </div>
          <svg className="ml-auto text-smoke group-hover:text-vividGold transition w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </NavLink>
      </div>
    </div>
  );
}
