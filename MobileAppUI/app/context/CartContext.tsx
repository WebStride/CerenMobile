import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCart, addToCartApi, updateCartApi, removeCartApi } from "../../services/api";

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  image: any;
  productUnits: number;
  unitsOfMeasurement: string;
  quantity: number;
}

export interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  increase: (productId: number) => void;
  decrease: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be within <CartProvider />");
  return ctx;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await getCart();
        if (mounted && res?.success) {
          setCart(res.cart || []);
          // Save to AsyncStorage as backup
          await AsyncStorage.setItem('cart', JSON.stringify(res.cart || []));
          return;
        }
      } catch (err) {
        console.error('Failed to load cart from server', err);
      }

      // Fallback: load from AsyncStorage
      try {
        const localCart = await AsyncStorage.getItem('cart');
        if (localCart && mounted) {
          setCart(JSON.parse(localCart));
        }
      } catch (e) {
        console.error('Failed to load cart from AsyncStorage', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setCart(prev => {
      const found = prev.find(x => x.productId === item.productId);
      let newCart;
      if (found) {
        newCart = prev.map(x =>
          x.productId === item.productId
            ? { ...x, quantity: x.quantity + quantity }
            : x
        );
      } else {
        newCart = [...prev, { ...item, quantity }];
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(newCart)).catch(err => 
        console.error('Failed to save cart to AsyncStorage', err)
      );
      
      return newCart;
    });

    // persist to server - send the actual quantity
    addToCartApi({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      image: typeof item.image === 'number' ? '' : item.image,
      productUnits: item.productUnits,
      unitsOfMeasurement: item.unitsOfMeasurement,
      quantity: quantity, // Send the actual quantity instead of hardcoded 1
      minOrderQuantity: quantity // Use the actual quantity as minOrderQuantity
    }).catch(err => console.error('addToCartApi failed', err));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = prev.filter(x => x.productId !== productId);
      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(newCart)).catch(err => 
        console.error('Failed to save cart to AsyncStorage', err)
      );
      return newCart;
    });
    // persist removal
    removeCartApi(productId).catch(err => console.error('removeCartApi failed', err));
  };

  const increase = (productId: number) => {
    let newQty = 0;
    setCart(prev => {
      const newCart = prev.map(x => {
        if (x.productId === productId) {
          newQty = x.quantity + 1;
          return { ...x, quantity: newQty };
        }
        return x;
      });
      
      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(newCart)).catch(err => 
        console.error('Failed to save cart to AsyncStorage', err)
      );
      
      return newCart;
    });
    
    if (newQty > 0) updateCartApi(productId, newQty).catch(err => console.error('updateCartApi failed', err));
  };

  const decrease = (productId: number) => {
    let newQty = NaN;
    setCart(prev => {
      const found = prev.find(x => x.productId === productId);
      if (!found) return prev;
      newQty = found.quantity - 1;
      let newCart;
      if (newQty <= 0) {
        newCart = prev.filter(x => x.productId !== productId);
      } else {
        newCart = prev.map(x => x.productId === productId ? { ...x, quantity: newQty } : x);
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(newCart)).catch(err => 
        console.error('Failed to save cart to AsyncStorage', err)
      );
      
      return newCart;
    });

    if (isNaN(newQty)) return;
    if (newQty <= 0) {
      removeCartApi(productId).catch(err => console.error('removeCartApi failed', err));
      return;
    }
    updateCartApi(productId, newQty).catch(err => console.error('updateCartApi failed', err));
  };

  const clearCart = () => {
    setCart([]);
    // Save empty cart to AsyncStorage
    AsyncStorage.setItem('cart', JSON.stringify([])).catch(err => 
      console.error('Failed to save cart to AsyncStorage', err)
    );
    // clear server cart in background
    // lazy import to avoid cycle at module load
    import('../../services/api').then(({ clearCartApi }) => {
      clearCartApi().catch(err => console.error('clearCartApi failed', err));
    }).catch(() => {});
  };
  const cartCount = useMemo(
    () => cart.reduce((acc, cur) => acc + cur.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((acc, cur) => acc + cur.price * cur.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, increase, decrease, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};
