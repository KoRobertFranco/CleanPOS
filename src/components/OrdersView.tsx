import { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronUp, Receipt, FileText, X, RotateCcw,
  CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Search,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { Button, Card } from '@/components/ui';
import { DataGrid, type Column } from '@/components/DataGrid';
import { FilterBar } from '@/components/FilterBar';
import { cn } from '@/lib/utils';
import type { Order, ReturnedItem, ReturnReason, SaleReturn } from '@/lib/types';

const REASONS: { id: ReturnReason; label: string }[] = [
  { id: 'defective', label: 'Defective' },
  { id: 'wrong_item', label: 'Wrong Item' },
  { id: 'customer_change', label: 'Customer Changed Mind' },
  { id: 'expired', label: 'Expired' },
];

const REASON_LABEL: Record<ReturnReason, string> = {
  defective: 'Defective',
  wrong_item: 'Wrong Item',
  customer_change: 'Customer Changed Mind',
  expired: 'Expired',
};

const REASON_BADGE: Record<ReturnReason, string> = {
  defective: 'bg-red-100 text-red-600',
  wrong_item: 'bg-amber-100 text-amber-700',
  customer_change: 'bg-blue-100 text-blue-600',
  expired: 'bg-stone-100 text-stone-600',
};

type Tab = 'invoices' | 'returns';

export function OrdersView() {
  const { orders, returns } = useStore();
  const [tab, setTab] = useState<Tab>('invoices');

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Invoices</h1>
        <p className="text-sm text-stone-500">
          {tab === 'invoices'
            ? `${orders.length} invoices`
            : `${returns.length} returns processed`}
        </p>
      </div>

      <div className="mb-5 inline-flex rounded-xl bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab('invoices')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition',
            tab === 'invoices' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900',
          )}
        >
          <FileText size={15} className="mr-1.5 inline" /> Invoices ({orders.length})
        </button>
        <button
          onClick={() => setTab('returns')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition',
            tab === 'returns' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900',
          )}
        >
          <RotateCcw size={15} className="mr-1.5 inline" /> Returns ({returns.length})
        </button>
      </div>

      {tab === 'invoices' ? <InvoicesTab /> : <ReturnsTab />}
    </div>
  );
}

// ---------- Invoices Tab ----------

function InvoicesTab() {
  const { orders } = useStore();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [lastReturn, setLastReturn] = useState<SaleReturn | null>(null);

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="mb-5 relative max-w-sm">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice ID..."
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-400"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex h-48 items-center justify-center">
          <div className="text-center">
            <Receipt size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm text-stone-400">No invoices found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => (
            <InvoiceRow
              key={order.id}
              order={order}
              isExpanded={expanded === order.id}
              onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
              onViewInvoice={() => setInvoiceOrder(order)}
              onReturn={() => setReturnOrder(order)}
            />
          ))}
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {returnOrder && (
        <ReturnForm
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onComplete={(ret) => {
            setLastReturn(ret);
            setReturnOrder(null);
          }}
        />
      )}

      {lastReturn && (
        <ReturnReceiptModal saleReturn={lastReturn} onClose={() => setLastReturn(null)} />
      )}
    </>
  );
}

function InvoiceRow({
  order,
  isExpanded,
  onToggle,
  onViewInvoice,
  onReturn,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onViewInvoice: () => void;
  onReturn: () => void;
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
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onReturn}>
              <RotateCcw size={15} /> Return
            </Button>
            <Button variant="outline" size="sm" onClick={onViewInvoice}>
              <FileText size={15} /> View Invoice
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- Returns Tab ----------

function ReturnsTab() {
  const { returns, orders } = useStore();
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return returns.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.orderId.toLowerCase().includes(search.toLowerCase());
      const matchReason = reasonFilter === 'all' || r.reason === reasonFilter;
      return matchSearch && matchReason;
    });
  }, [returns, search, reasonFilter]);

  const totalRefunded = filtered.reduce((s, r) => s + r.refundTotal, 0);
  const totalItems = filtered.reduce(
    (s, r) => s + r.items.reduce((si, i) => si + i.quantity, 0),
    0,
  );

  const columns: Column<SaleReturn>[] = [
    {
      key: 'id',
      header: 'Return ID',
      render: (r) => <span className="font-bold text-stone-900">{r.id}</span>,
    },
    {
      key: 'orderId',
      header: 'Invoice',
      render: (r) => <span className="font-medium text-stone-600">{r.orderId}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      render: (r) => (
        <span className="text-stone-600">
          {r.items.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => (
        <span className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', REASON_BADGE[r.reason])}>
          {REASON_LABEL[r.reason]}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => (
        <span className="text-xs text-stone-400">
          {formatDate(r.createdAt)} · {formatTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: 'refund',
      header: 'Refund',
      align: 'right',
      render: (r) => <span className="font-bold text-red-600">-{formatCurrency(r.refundTotal)}</span>,
    },
  ];

  const reasonFilters = [{ id: 'all', label: 'All Reasons' }, ...REASONS];

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Total Refunded</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(totalRefunded)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Items Returned</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{totalItems}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Return Rate</p>
          <p className="mt-1 text-xl font-bold text-stone-900">
            {orders.length > 0 ? Math.round((returns.length / orders.length) * 100) : 0}%
          </p>
        </Card>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by return or invoice ID..."
        filters={reasonFilters}
        activeFilter={reasonFilter}
        onFilterChange={setReasonFilter}
      />

      <DataGrid
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyMessage="No returns found"
      />
    </>
  );
}

// ---------- Return Form (pre-filled from invoice) ----------

function ReturnForm({
  order,
  onClose,
  onComplete,
}: {
  order: Order;
  onClose: () => void;
  onComplete: (ret: SaleReturn) => void;
}) {
  const { processReturn } = useStore();
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>('defective');
  const [error, setError] = useState('');

  const setQty = (productId: string, qty: number, max: number) => {
    setReturnQtys((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(qty, max)),
    }));
  };

  const itemsToReturn: ReturnedItem[] = order.items
    .filter((i) => (returnQtys[i.product.id] ?? 0) > 0)
    .map((i) => ({
      product: i.product,
      quantity: returnQtys[i.product.id] ?? 0,
    }));

  const refundTotal = itemsToReturn.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const refundTax = refundTotal * 0.05;
  const refundGrand = refundTotal + refundTax;

  const handleSubmit = () => {
    if (itemsToReturn.length === 0) {
      setError('Select at least one item to return');
      return;
    }
    const ret = processReturn(order.id, itemsToReturn, reason);
    onComplete(ret);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[520px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw size={20} className="text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900">Return Items</h3>
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
              {order.id}
            </span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Return Reason</label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    reason === r.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Items to Return
            </label>
            <div className="space-y-2">
              {order.items.map((item) => {
                const qty = returnQtys[item.product.id] ?? 0;
                return (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-2.5"
                  >
                    <span className="text-2xl">{item.product.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">{item.product.name}</p>
                      <p className="text-xs text-stone-400">
                        {formatCurrency(item.product.price)} · Purchased: {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQty(item.product.id, qty - 1, item.quantity)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm transition hover:bg-stone-100 active:scale-95"
                      >
                        <span className="text-sm">−</span>
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={qty}
                        onChange={(e) => setQty(item.product.id, parseInt(e.target.value, 10) || 0, item.quantity)}
                        className="w-12 rounded-lg border border-stone-200 bg-white py-1 text-center text-sm font-bold text-stone-900 outline-none focus:border-stone-400"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(item.product.id, qty + 1, item.quantity)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 shadow-sm transition hover:bg-stone-100 active:scale-95"
                      >
                        <span className="text-sm">+</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Refund Subtotal</span>
                <span>{formatCurrency(refundTotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Tax Refund (5%)</span>
                <span>{formatCurrency(refundTax)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-1.5 text-base font-bold text-stone-900">
                <span>Total Refund</span>
                <span className="text-red-600">-{formatCurrency(refundGrand)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-red-600 hover:bg-red-700">
              <RotateCcw size={16} /> Process Return
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Return Receipt ----------

function ReturnReceiptModal({ saleReturn, onClose }: { saleReturn: SaleReturn; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-[360px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-stone-900">Return Processed</h3>
          <p className="text-sm text-stone-500">Return {saleReturn.id} · Invoice {saleReturn.orderId}</p>
        </div>

        <div className="my-4 space-y-1.5 border-y border-stone-100 py-3">
          {saleReturn.items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm text-stone-600">
              <span>{item.quantity}× {item.product.name}</span>
              <span>-{formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Refund Subtotal</span>
            <span>-{formatCurrency(saleReturn.total)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Tax Refund</span>
            <span>-{formatCurrency(saleReturn.tax)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-stone-900">
            <span>Total Refunded</span>
            <span className="text-red-600">-{formatCurrency(saleReturn.refundTotal)}</span>
          </div>
          <div className="flex justify-between pt-1 text-xs text-stone-400">
            <span>Reason</span>
            <span>{REASON_LABEL[saleReturn.reason]}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Returned items have been added back to inventory.
        </p>

        <Button onClick={onClose} className="mt-5 w-full">
          Done
        </Button>
      </Card>
    </div>
  );
}

// ---------- Invoice Modal ----------

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
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Invoice ID</p>
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
