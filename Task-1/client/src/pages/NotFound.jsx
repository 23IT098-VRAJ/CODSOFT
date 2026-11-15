import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <p className="text-[110px] font-black text-parchment leading-none select-none animate-bob" aria-hidden="true">404</p>
      <h1 className="text-2xl font-bold text-midnight mt-2">Page not found</h1>
      <p className="text-smoke max-w-xs mt-2">The page you're looking for doesn't exist or was moved.</p>
      <div className="flex gap-3 mt-8">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/products" className="btn-outline">Browse products</Link>
      </div>
    </div>
  );
}
