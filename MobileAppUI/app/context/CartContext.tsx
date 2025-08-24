import React, { createContext, useContext, useState, useMemo } from "react";

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
  addToCart: (item: Omit<CartItem, "quantity">) => void;
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

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCart(prev => {
      const found = prev.find(x => x.productId === item.productId);
      if (found) {
        return prev.map(x =>
          x.productId === item.productId
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(x => x.productId !== productId));
  };

  const increase = (productId: number) => {
    setCart(prev =>
      prev.map(x =>
        x.productId === productId
          ? { ...x, quantity: x.quantity + 1 }
          : x
      )
    );
  };

  const decrease = (productId: number) => {
    setCart(prev =>
      prev
        .map(x =>
          x.productId === productId && x.quantity > 1
            ? { ...x, quantity: x.quantity - 1 }
            : x
        )
        .filter(x => x.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

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
