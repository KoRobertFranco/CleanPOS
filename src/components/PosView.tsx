import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, X, CheckCircle2, ScanLine, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/format';
import type { Category, Order, PaymentMethod } from '@/lib/types';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

const CATEGORIES: (Category | 'All')[] = ['All', 'Snacks', 'Beverages', 'Grocery', 'Household'];

export function PosView() {
  const {
    products,
    cart,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    cartCount,
    checkout,
  } = useStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code) return;

    const product = products.find((p) => p.sku.toLowerCase() === code.toLowerCase());
    if (product) {
      if (product.stock === 0) {
        setScanError(`"${product.name}" is out of stock`);
      } else {
        addToCart(product);
        setScanError('');
      }
    } else {
      setScanError(`No product found for "${code}"`);
    }
    setScanInput('');
    scanRef.current?.focus();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const order = checkout(payment);
    setLastOrder(order);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-stone-200 bg-white px-6 pb-4 pt-5">
          <form onSubmit={handleScan} className="mb-3 flex items-center gap-3">
            <div className="relative flex-1">
              <ScanLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                ref={scanRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan or type SKU (e.g. SNK-001)..."
                className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              <Plus size={16} /> Add
            </Button>
          </form>
          {scanError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={15} /> {scanError}
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
                  activeCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const out = product.stock === 0;
              return (
                <button
                  key={product.id}
                  disabled={out}
                  onClick={() => {
                    addToCart(product);
                    setScanError('');
                  }}
                  className={cn(
                    'group relative flex flex-col items-center rounded-2xl border bg-white p-4 text-center transition-all duration-150',
                    out
                      ? 'cursor-not-allowed border-stone-100 opacity-40'
                      : 'border-stone-200 hover:border-stone-300 hover:shadow-md active:scale-[.97]',
                  )}
                >
                  {inCart && (
                    <span className="absolute right-2 top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
                      {inCart.quantity}
                    </span>
                  )}
                  <span className="mb-2 text-4xl">{product.emoji}</span>
                  <p className="text-sm font-semibold leading-tight text-stone-900">{product.name}</p>
                  <p className="mt-1 text-sm font-bold text-stone-700">{formatCurrency(product.price)}</p>
                  <p className={cn('mt-0.5 text-[11px]', out ? 'text-red-500' : 'text-stone-400')}>
                    {out ? 'Out of stock' : `${product.stock} left`}
                  </p>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex h-48 items-center justify-center text-sm text-stone-400">
              No products found
            </div>
          )}
        </div>
      </div>

      <div className="flex w-[380px] flex-col border-l border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Current Order</h2>
            <p className="text-xs text-stone-500">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-stone-400 hover:text-red-500">
              <Trash2 size={15} /> Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-300">
                <Plus size={28} />
              </div>
              <p className="text-sm font-medium text-stone-400">Cart is empty</p>
              <p className="mt-1 text-xs text-stone-400">Tap products or scan a SKU</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-2.5"
                >
                  <span className="text-2xl">{item.product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">{item.product.name}</p>
                    <p className="text-xs text-stone-500">{formatCurrency(item.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => decrementFromCart(item.product.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm transition hover:bg-stone-100 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-stone-900">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item.product)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm transition hover:bg-stone-100 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="w-16 text-right">
                    <p className="text-sm font-bold text-stone-900">{formatCurrency(item.product.price * item.quantity)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-300 transition hover:text-red-500"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Tax (5%)</span>
              <span>{formatCurrency(cartTax)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 text-lg font-bold text-stone-900">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayment('card')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition',
                payment === 'card'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50',
              )}
            >
              <CreditCard size={16} /> Card
            </button>
            <button
              onClick={() => setPayment('cash')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition',
                payment === 'cash'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50',
              )}
            >
              <Banknote size={16} /> Cash
            </button>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            size="lg"
            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Charge {formatCurrency(cartTotal)}
          </Button>
        </div>
      </div>

      {lastOrder && (
        <ReceiptModal order={lastOrder} onClose={() => setLastOrder(null)} />
      )}
    </div>
  );
}

function ReceiptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[340px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-stone-900">Payment Complete</h3>
          <p className="text-sm text-stone-500">Order {order.id}</p>
        </div>

        <div className="my-4 space-y-1.5 border-y border-stone-100 py-3">
          {order.items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm text-stone-600">
              <span>{item.quantity}× {item.product.name}</span>
              <span>{formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Tax</span><span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-stone-900">
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between pt-1 text-xs text-stone-400">
            <span>Paid via</span><span className="capitalize">{order.paymentMethod}</span>
          </div>
        </div>

        <Button onClick={onClose} className="mt-5 w-full">
          New Order
        </Button>
      </Card>
    </div>
  );
}
