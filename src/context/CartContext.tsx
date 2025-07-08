import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Cart } from '../types';
import { getCart, addToCart as apiAddToCart, updateCartItem, removeFromCart, clearCart } from '../services/api';
import { useAuth } from './AuthContext';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (menuItemId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCartItems: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_CART':
      return { ...state, cart: null };
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartData = await getCart();
      dispatch({ type: 'SET_CART', payload: cartData });
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to fetch cart' });
    }
  }, [isAuthenticated]);

  const addToCartHandler = async (menuItemId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Please log in to add items to cart' });
      return;
    }

    try {
      await apiAddToCart(menuItemId, quantity);
      await refreshCart(); // Refresh cart to get updated state
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to add item to cart' });
    }
  };

  const updateQuantityHandler = async (cartItemId: number, quantity: number) => {
    try {
      await updateCartItem(cartItemId, quantity);
      await refreshCart();
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to update item' });
    }
  };

  const removeItemHandler = async (cartItemId: number) => {
    try {
      await removeFromCart(cartItemId);
      await refreshCart();
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to remove item' });
    }
  };

  const clearCartHandler = async () => {
    try {
      await clearCart();
      await refreshCart();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to clear cart' });
    }
  };

  const getCartItemCount = (): number => {
    return state.cart?.itemCount || 0;
  };

  const getCartTotal = (): number => {
    return state.cart?.total || 0;
  };
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, user, refreshCart]);

  const value: CartContextType = {
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    addToCart: addToCartHandler,
    updateQuantity: updateQuantityHandler,
    removeItem: removeItemHandler,
    clearCartItems: clearCartHandler,
    refreshCart,
    getCartItemCount,
    getCartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
