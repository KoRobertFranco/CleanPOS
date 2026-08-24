import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Order, PaymentMethod, Product } from './types';
import { SEED_PRODUCTS, TAX_RATE } from './seed';

interface StoreValue {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product) => void;
  decrementFromCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartCount: number;
  checkout: (paymentMethod: PaymentMethod) => Order;
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let orderCounter = 1000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const decrementFromCart = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cart],
  );
  const cartTax = useMemo(() => cartSubtotal * TAX_RATE, [cartSubtotal]);
  const cartTotal = useMemo(() => cartSubtotal + cartTax, [cartSubtotal, cartTax]);
  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const checkout = (paymentMethod: PaymentMethod): Order => {
    const order: Order = {
      id: `ORD-${++orderCounter}`,
      items: cart,
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      paymentMethod,
      status: 'completed',
      createdAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        const item = cart.find((i) => i.product.id === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      }),
    );
    setCart([]);
    return order;
  };

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const value: StoreValue = {
    products,
    cart,
    orders,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    cartCount,
    checkout,
    updateProduct,
    addProduct,
    deleteProduct,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
