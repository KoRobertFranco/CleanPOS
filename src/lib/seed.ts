import type { Product } from './types';

export const SEED_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Potato Chips', price: 1500, category: 'Snacks', sku: 'SNK-001', stock: 80, emoji: '🥔' },
  { id: 'p2', name: 'Chocolate Bar', price: 1200, category: 'Snacks', sku: 'SNK-002', stock: 100, emoji: '🍫' },
  { id: 'p3', name: 'Pretzels', price: 1800, category: 'Snacks', sku: 'SNK-003', stock: 60, emoji: '🥨' },
  { id: 'p4', name: 'Popcorn', price: 1400, category: 'Snacks', sku: 'SNK-004', stock: 50, emoji: '🍿' },
  { id: 'p5', name: 'Cookies', price: 2400, category: 'Snacks', sku: 'SNK-005', stock: 40, emoji: '🍪' },
  { id: 'p6', name: 'Mixed Nuts', price: 2800, category: 'Snacks', sku: 'SNK-006', stock: 35, emoji: '🥜' },
  { id: 'p7', name: 'Cola 500ml', price: 1000, category: 'Beverages', sku: 'BEV-001', stock: 120, emoji: '🥤' },
  { id: 'p8', name: 'Orange Juice', price: 2000, category: 'Beverages', sku: 'BEV-002', stock: 45, emoji: '🧃' },
  { id: 'p9', name: 'Bottled Water', price: 800, category: 'Beverages', sku: 'BEV-003', stock: 200, emoji: '💧' },
  { id: 'p10', name: 'Energy Drink', price: 2400, category: 'Beverages', sku: 'BEV-004', stock: 55, emoji: '⚡' },
  { id: 'p11', name: 'Milk 1L', price: 1500, category: 'Beverages', sku: 'BEV-005', stock: 30, emoji: '🥛' },
  { id: 'p12', name: 'Coffee 6pk', price: 3600, category: 'Beverages', sku: 'BEV-006', stock: 25, emoji: '☕' },
  { id: 'p13', name: 'White Bread', price: 1000, category: 'Grocery', sku: 'GRO-001', stock: 20, emoji: '🍞' },
  { id: 'p14', name: 'Eggs (dozen)', price: 2600, category: 'Grocery', sku: 'GRO-002', stock: 18, emoji: '🥚' },
  { id: 'p15', name: 'Rice 1kg', price: 2200, category: 'Grocery', sku: 'GRO-003', stock: 40, emoji: '🍚' },
  { id: 'p16', name: 'Pasta 500g', price: 1100, category: 'Grocery', sku: 'GRO-004', stock: 50, emoji: '🍝' },
  { id: 'p17', name: 'Canned Beans', price: 700, category: 'Grocery', sku: 'GRO-005', stock: 70, emoji: '🫘' },
  { id: 'p18', name: 'Banana (lb)', price: 500, category: 'Grocery', sku: 'GRO-006', stock: 60, emoji: '🍌' },
  { id: 'p19', name: 'Toothpaste', price: 2000, category: 'Household', sku: 'HSH-001', stock: 25, emoji: '🪥' },
  { id: 'p20', name: 'Soap Bar', price: 900, category: 'Household', sku: 'HSH-002', stock: 40, emoji: '🧼' },
  { id: 'p21', name: 'Toilet Paper 4pk', price: 3000, category: 'Household', sku: 'HSH-003', stock: 22, emoji: '🧻' },
  { id: 'p22', name: 'Dish Soap', price: 1800, category: 'Household', sku: 'HSH-004', stock: 28, emoji: '🧴' },
  { id: 'p23', name: 'Trash Bags', price: 2600, category: 'Household', sku: 'HSH-005', stock: 20, emoji: '🗑️' },
  { id: 'p24', name: 'D Batteries 2pk', price: 2300, category: 'Household', sku: 'HSH-006', stock: 15, emoji: '🔋' },
];

export const TAX_RATE = 0.05;
