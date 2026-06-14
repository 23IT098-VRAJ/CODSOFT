import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const filled = Math.round(product.rating?.average || 0);
  const stars = Array.from({ length: 5 }, (_, i) => i < filled);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ productId: product._id, name: product.name, price: product.price, quantity: 1, image: product.images?.[0] || '' });
  };

  return (
    <div
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-pureWhite border border-parchment rounded-2xl p-6 group flex flex-col overflow-hidden cursor-pointer hover:shadow-md hover:border-vividGold transition duration-200"
    >
      <div className="relative w-32 h-32 rounded-full bg-parchment flex items-center justify-center mx-auto mb-6">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="w-[70%] h-[70%] object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=400&background=EDE5D0&color=1F2937`; }}
        />
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Low</span>
        )}
        {product.stock === 0 && (
          <span className="absolute -top-2 -right-2 bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Out</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-1 text-center">
        <p className="text-xs text-smoke uppercase font-bold tracking-wider">{product.brand}</p>
        <h3 className="font-semibold text-midnight text-lg line-clamp-1">{product.name}</h3>

        <div className="flex items-center justify-center gap-1.5">
          <div className="flex gap-0.5">
            {stars.map((filled, i) => (
              <svg key={i} className={`w-3 h-3 ${filled ? 'text-vividGold' : 'text-parchment'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-smoke text-xs">({product.rating?.count || 0})</span>
        </div>

        <p className="text-vividGold font-extrabold text-xl mt-2">₹{product.price.toLocaleString('en-IN')}</p>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="bg-midnight text-pureWhite rounded-full w-full py-2.5 mt-4 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
