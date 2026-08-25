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

export interface ReturnedItem {
  product: Product;
  quantity: number;
}

export type ReturnReason = 'defective' | 'wrong_item' | 'customer_change' | 'expired';

export interface SaleReturn {
  id: string;
  orderId: string;
  items: ReturnedItem[];
  total: number;
  tax: number;
  refundTotal: number;
  reason: ReturnReason;
  createdAt: number;
}

export interface ProductSummary {
  product: Product;
  qtySold: number;
  qtyReturned: number;
  netQty: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
}
