import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users } from 'lucide-react';
import { usePageTitle } from '../../hooks';

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
];

// Shared frame for every admin page: tab bar, title and an actions slot.
export default function AdminLayout({ title, subtitle, actions, children }) {
  usePageTitle(`Admin · ${title}`);
  return (
    <div className="container-page py-8">
      <nav className="card p-1.5 flex gap-1 mb-8 overflow-x-auto scrollbar-none" aria-label="Admin">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl whitespace-nowrap transition ${
                isActive ? 'bg-midnight text-pureWhite' : 'text-smoke hover:text-midnight hover:bg-warmIvory'
              }`
            }>
            <Icon className="w-4 h-4" /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight">{title}</h1>
          {subtitle && <p className="text-smoke text-sm mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
