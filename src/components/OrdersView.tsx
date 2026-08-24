import { useState } from 'react';
import { ChevronDown, ChevronUp, Receipt, Search, FileText, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/types';

export function OrdersView() {
  const { orders } = useStore();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <p className="text-sm text-stone-500">{orders.length} completed orders</p>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID..."
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex h-48 items-center justify-center">
          <div className="text-center">
            <Receipt size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm text-stone-400">No orders found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expanded === order.id}
              onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
              onViewInvoice={() => setInvoiceOrder(order)}
            />
          ))}
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
}

function OrderRow({
  order,
  isExpanded,
  onToggle,
  onViewInvoice,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onViewInvoice: () => void;
}) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Card className={cn('overflow-hidden transition-all', isExpanded && 'ring-1 ring-stone-300')}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-stone-50/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
            <Receipt size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900">{order.id}</span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                {order.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-400">
              {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-stone-900">{formatCurrency(order.total)}</p>
            <p className="text-xs text-stone-400">{itemCount} items · {order.paymentMethod}</p>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50/30 p-4">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5">
                <span className="text-xl">{item.product.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{item.product.name}</p>
                  <p className="text-xs text-stone-400">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stone-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Tax</span><span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-stone-900">
              <span>Total</span><span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={onViewInvoice}>
              <FileText size={15} /> View Invoice
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[460px] max-h-[90vh] overflow-y-auto p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-stone-400" />
            <h3 className="text-base font-bold text-stone-900">Invoice</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 transition hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-stone-100 px-6 py-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white">
              <span className="text-lg font-bold">M</span>
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">MiniMart</p>
              <p className="text-xs text-stone-400">123 Main Street · Tel: (555) 010-2030</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 rounded-xl bg-stone-50 p-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Order ID</p>
              <p className="font-semibold text-stone-900">{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Status</p>
              <p className="font-semibold capitalize text-emerald-600">{order.status}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Date</p>
              <p className="font-semibold text-stone-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Time</p>
              <p className="font-semibold text-stone-900">{formatTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Payment</p>
              <p className="font-semibold capitalize text-stone-900">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Cashier</p>
              <p className="font-semibold text-stone-900">Alex Morgan</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.product.id} className="border-b border-stone-50">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.product.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{item.product.name}</p>
                        <p className="text-[11px] text-stone-400">{item.product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-sm text-stone-600">{item.quantity}</td>
                  <td className="py-2.5 text-right text-sm text-stone-600">{formatCurrency(item.product.price)}</td>
                  <td className="py-2.5 text-right text-sm font-semibold text-stone-900">
                    {formatCurrency(item.product.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-5">
          <div className="ml-auto max-w-[220px] space-y-1.5">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Items</span><span>{itemCount}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Tax (5%)</span><span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
              <span>Total</span><span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-stone-400">Thank you for shopping at MiniMart!</p>
        </div>
      </Card>
    </div>
  );
}
