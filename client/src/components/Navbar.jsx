import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, clearCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearCart();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-midnight shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-vividGold font-bold text-xl tracking-tight hover:opacity-90 transition"
        >
          ShopIndi
        </button>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/products" className={({ isActive }) =>
            `text-sm font-medium transition-all duration-200 ${isActive ? 'text-vividGold' : 'text-smoke hover:text-vividGold'}`
          }>
            Products
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) =>
              `text-sm font-medium transition-all duration-200 ${isActive ? 'text-vividGold' : 'text-smoke hover:text-vividGold'}`
            }>
              Admin
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={({ isActive }) =>
              `text-sm font-medium transition-all duration-200 ${isActive ? 'text-vividGold' : 'text-smoke hover:text-vividGold'}`
            }>
              Orders
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-smoke hover:text-vividGold transition-all duration-200"
          >
            <span className="text-sm font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="bg-vividGold text-midnight rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm text-smoke font-medium">
                {user.name.slice(0, 12)}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-pureWhite hover:text-vividGold transition-all duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-vividGold text-midnight rounded-full px-5 py-1.5 font-semibold text-sm hover:opacity-90 transition"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
