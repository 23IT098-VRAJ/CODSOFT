import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm overflow-hidden">
      <div className="aspect-square skeleton rounded-none" />
      <div className="p-3 space-y-2.5">
        <div className="h-2.5 skeleton rounded w-1/3" />
        <div className="h-3.5 skeleton rounded w-5/6" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-8 skeleton rounded-full mt-1" />
      </div>
    </div>
  );
}
