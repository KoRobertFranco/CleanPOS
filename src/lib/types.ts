export type Category = 'Snacks' | 'Beverages' | 'Grocery' | 'Household';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  sku: string;
  stock: number;
  emoji: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card';

export type OrderStatus = 'completed';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: number;
}
