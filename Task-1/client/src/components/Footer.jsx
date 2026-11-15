import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../lib/format';

export default function Footer() {
  return (
    <footer className="bg-midnight text-gray-400 mt-16">
      <div className="container-page py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2">
          <p className="text-vividGold font-extrabold text-xl">ShopIndi</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            A full-stack e-commerce store built with React, Express and MongoDB for the CodSoft web development internship.
          </p>
        </div>
        <div>
          <p className="text-pureWhite font-semibold mb-3">Shop</p>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}><Link to={`/products?category=${c}`} className="hover:text-vividGold transition">{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-pureWhite font-semibold mb-3">Account</p>
          <ul className="space-y-2">
            <li><Link to="/orders" className="hover:text-vividGold transition">My orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-vividGold transition">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-vividGold transition">Cart</Link></li>
            <li><Link to="/profile" className="hover:text-vividGold transition">Profile</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} ShopIndi · Demo project — no real payments are processed
      </div>
    </footer>
  );
}
