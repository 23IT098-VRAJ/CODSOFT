// Small presentational building blocks shared across pages.
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, Star } from 'lucide-react';

export function Spinner({ className = 'w-5 h-5' }) {
  return <Loader2 className={`${className} animate-spin`} aria-label="Loading" />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-vividGold">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

// Read-only by default; pass onRate to make it an input.
export function StarRating({ rating = 0, size = 'w-4 h-4', onRate }) {
  const filled = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5" role={onRate ? 'radiogroup' : 'img'} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Star className={`${size} ${n <= filled ? 'fill-vividGold text-vividGold' : 'fill-parchment text-parchment'}`} />;
        return onRate ? (
          <button key={n} type="button" onClick={() => onRate(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-checked={n === filled} role="radio" className="p-0.5 hover:scale-110 active:scale-[0.98] transition-transform">
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

export function QuantityStepper({ value, max, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'p-1.5' : 'p-3';
  return (
    <div className="inline-flex items-center bg-pureWhite border border-parchment rounded-xl overflow-hidden">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity" className={`${pad} text-smoke hover:text-midnight hover:bg-warmIvory disabled:opacity-30 transition`}>
        <Minus className="w-4 h-4" />
      </button>
      <span className="min-w-[2.25rem] text-center text-sm font-semibold text-midnight" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity" className={`${pad} text-smoke hover:text-midnight hover:bg-warmIvory disabled:opacity-30 transition`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card p-10 sm:p-14 text-center flex flex-col items-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-warmIvory border border-parchment flex items-center justify-center mb-5 animate-bob">
          <Icon className="w-7 h-7 text-vividGold" />
        </div>
      )}
      <h2 className="text-lg font-bold text-midnight">{title}</h2>
      {message && <p className="text-smoke text-sm mt-1.5 max-w-sm">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Shown when a request fails, with a way to try again.
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-semibold text-midnight">Couldn't load this</p>
      <p className="text-smoke text-sm mt-1">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-5">Try again</button>}
    </div>
  );
}

// Page-number pagination: 1 … 4 5 [6] 7 8 … 20
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const numbers = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) numbers.push(n);
    else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
  }
  const base = 'min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-semibold transition flex items-center justify-center';

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="Pagination">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className={`${base} border border-parchment bg-pureWhite disabled:opacity-40 hover:border-vividGold`}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      {numbers.map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-smoke">…</span>
        ) : (
          <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
            className={`${base} ${n === page ? 'bg-midnight text-pureWhite' : 'border border-parchment bg-pureWhite text-bodyInk hover:border-vividGold'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page" className={`${base} border border-parchment bg-pureWhite disabled:opacity-40 hover:border-vividGold`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

const STATUS_BADGE = {
  Pending: 'badge-warning',
  Processing: 'badge-info',
  Shipped: 'badge-purple',
  Delivered: 'badge-success',
  Cancelled: 'badge-danger',
};

export function StatusBadge({ status }) {
  return (
    <span className={STATUS_BADGE[status] || 'badge-gray'}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

// A labelled form field with an inline error message.
export function Field({ label, error, className = '', children, hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="text-xs text-smoke mt-1">{hint}</p> : null}
    </label>
  );
}

// React Router keeps the scroll position between pages; reset it on navigation.
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
