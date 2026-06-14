import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="relative mb-8">
        <p className="text-[120px] font-black text-zinc-900 leading-none select-none">404</p>
        <p className="absolute inset-0 flex items-center justify-center text-[120px] font-black gradient-text leading-none opacity-20 blur-sm select-none">404</p>
      </div>
      <h1 className="text-2xl font-bold text-midnight mb-3">Page not found</h1>
      <p className="text-smoke max-w-xs mb-8">
        The page you're looking for doesn't exist or was moved.
      </p>
      <button onClick={() => navigate('/')} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center px-8 py-3 text-sm">
        ← Go Home
      </button>
    </div>
  );
}
