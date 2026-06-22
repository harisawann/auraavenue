import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { trackEvent } from '../utils/analytics';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await cartService.getCart();
      setCart(data.cart);
    } catch {
      // Silently ignore — cart will just appear empty; individual actions
      // (add/update/remove) surface their own errors via toast.
    }
  }, [isAuthenticated]);

  // Load (or clear) the cart whenever auth state changes (login/logout).
  // The cart is always reset to empty here via the `cart` state's own
  // initial value when isAuthenticated flips false — see the early return
  // in refreshCart above, combined with clearing on logout in AuthContext's
  // own logout() function. To keep this effect free of any synchronous
  // setState call, we derive the "logged out" empty cart by simply not
  // fetching, and let the next login's refreshCart populate it again.
  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      return undefined;
    }

    cartService
      .getCart()
      .then((data) => {
        if (!cancelled) setCart(data.cart);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const addItem = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const data = await cartService.addItem(productId, quantity);
      setCart(data.cart);
      trackEvent('add_to_cart', { currency: 'PKR', items: [{ item_id: productId, quantity }] }, 'AddToCart');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not add item to cart' };
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (productId, quantity) => {
    setLoading(true);
    try {
      const data = await cartService.updateItem(productId, quantity);
      setCart(data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not update quantity' };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    setLoading(true);
    try {
      const data = await cartService.removeItem(productId);
      setCart(data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not remove item' };
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const clearLocalCart = () => setCart({ items: [], subtotal: 0 });

  const value = {
    cart,
    itemCount,
    loading,
    addItem,
    updateItem,
    removeItem,
    refreshCart,
    clearLocalCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
