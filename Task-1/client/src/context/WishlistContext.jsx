import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../lib/axios';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';

const WishlistContext = createContext(null);

// The wishlist is stored on the user's account (not in the browser), so it
// follows them across devices. The ids live on the user object.
export function WishlistProvider({ children }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const ids = useMemo(() => new Set((user?.wishlist || []).map(String)), [user]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) {
        showToast('Log in to save items to your wishlist', 'info');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      const wasSaved = ids.has(productId);
      const previous = user.wishlist || [];

      // Optimistic update: flip the heart immediately, roll back on failure.
      updateUser({ ...user, wishlist: wasSaved ? previous.filter((id) => id !== productId) : [...previous, productId] });
      try {
        const { data } = await api.post(`/wishlist/${productId}`);
        updateUser({ ...user, wishlist: data.wishlist });
        showToast(data.saved ? 'Saved to wishlist' : 'Removed from wishlist', 'success');
      } catch (err) {
        updateUser({ ...user, wishlist: previous });
        showToast(errorMessage(err), 'error');
      }
    },
    [user, ids, updateUser, showToast, navigate, location]
  );

  const value = useMemo(() => ({ has: (id) => ids.has(id), count: ids.size, toggle }), [ids, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
