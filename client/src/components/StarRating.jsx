import React from 'react';

export default function StarRating({ rating = 0, size = 'md' }) {
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(rating) ? '★' : '☆'
  );
  const textSize = size === 'sm' ? 'text-sm' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`text-amber-400 ${textSize}`}>{stars.join('')}</span>
      <span className="text-gray-500 text-sm">{rating.toFixed(1)}</span>
    </span>
  );
}
