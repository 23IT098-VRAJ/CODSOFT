import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MAX_QTY_PER_ITEM } from '../lib/format';

const CartContext = createContext(null);

const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('cart'));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

// The most of one product a customer may hold: limited by stock and by the
// per-item cap. Items saved before stock was tracked fall back to the cap.
export const maxQtyFor = (item) => Math.max(1, Math.min(item.stock ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM));

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Adds a product and reports whether the full quantity fitted:
  // { added: number, limited: boolean }
  const addToCart = useCallback(
    (product, quantity = 1) => {
      const existing = cartItems.find((i) => i.productId === product._id);
      const max = maxQtyFor(product);
      const nextQty = Math.min((existing?.quantity || 0) + quantity, max);
      const added = nextQty - (existing?.quantity || 0);

      setCartItems((prev) => {
        const line = {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
          stock: product.stock,
          quantity: nextQty,
        };
        return prev.some((i) => i.productId === product._id)
          ? prev.map((i) => (i.productId === product._id ? line : i))
          : [...prev, line];
      });
      return { added, limited: added < quantity };
    },
    [cartItems]
  );

  const removeFromCart = useCallback(
    (productId) => setCartItems((prev) => prev.filter((i) => i.productId !== productId)),
    []
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      setCartItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, maxQtyFor(i))) } : i))
      ),
    []
  );

  const clearCart = useCallback(() => setCartItems([]), []);

  // Bring the cart in line with the live catalogue: `latest` maps product id
  // to the current product, or to null if it no longer exists. Prices and
  // stock are refreshed; a line for a deleted product is dropped.
  const syncCart = useCallback(
    (latest) =>
      setCartItems((prev) =>
        prev
          .filter((i) => latest[i.productId] !== null)
          .map((i) => {
            const p = latest[i.productId];
            return p ? { ...i, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0] || i.image } : i;
          })
      ),
    []
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCart,
      cartCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      cartTotal: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, syncCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
