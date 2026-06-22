import { createContext, useContext, useState, useEffect } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [productIds, setProductIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      return undefined;
    }

    wishlistService
      .getWishlist()
      .then((data) => {
        if (!cancelled) {
          setProductIds(new Set(data.wishlist.products.map((p) => p._id)));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isWishlisted = (productId) => productIds.has(productId);

  const toggleWishlist = async (productId) => {
    if (isWishlisted(productId)) {
      try {
        await wishlistService.removeItem(productId);
        setProductIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return { success: true, added: false };
      } catch (err) {
        return { success: false, message: err.response?.data?.message };
      }
    } else {
      try {
        await wishlistService.addItem(productId);
        setProductIds((prev) => new Set(prev).add(productId));
        return { success: true, added: true };
      } catch (err) {
        return { success: false, message: err.response?.data?.message };
      }
    }
  };

  const clearLocalWishlist = () => setProductIds(new Set());

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggleWishlist, clearLocalWishlist, count: productIds.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
