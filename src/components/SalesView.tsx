import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, CreditCard, Banknote, Calendar, Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, Button } from '@/components/ui';
import { DataGrid, type Column } from '@/components/DataGrid';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

type Period = 'today' | '7d' | '30d' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

export function SalesView() {
  const { orders } = useStore();
  const [period, setPeriod] = useState<Period>('all');

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const now = Date.now();
    const ranges: Record<Period, number> = {
      today: 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };
    const cutoff = now - ranges[period];
    return orders.filter((o) => o.createdAt >= cutoff);
  }, [orders, period]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalTax = filteredOrders.reduce((s, o) => s + o.tax, 0);
  const totalItems = filteredOrders.reduce(
    (s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0),
    0,
  );
  const cardRevenue = filteredOrders
    .filter((o) => o.paymentMethod === 'card')
    .reduce((s, o) => s + o.total, 0);
  const cashRevenue = filteredOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((s, o) => s + o.total, 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<Category, { revenue: number; qty: number }>();
    filteredOrders.forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.product.category) ?? { revenue: 0, qty: 0 };
        cur.revenue += i.product.price * i.quantity;
        cur.qty += i.quantity;
        map.set(i.product.category, cur);
      }),
    );
    return [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredOrders]);

  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number; items: number }>();
    filteredOrders.forEach((o) => {
      const dayKey = formatDate(o.createdAt);
      const cur = map.get(dayKey) ?? { revenue: 0, orders: 0, items: 0 };
      cur.revenue += o.total;
      cur.orders += 1;
      cur.items += o.items.reduce((s, i) => s + i.quantity, 0);
      map.set(dayKey, cur);
    });
    return [...map.entries()].reverse();
  }, [filteredOrders]);

  const maxCatRevenue = categoryBreakdown[0]?.[1].revenue ?? 1;
  const maxDailyRevenue = Math.max(...dailyBreakdown.map((d) => d[1].revenue), 1);

  type DailyRow = { date: string; orders: number; items: number; revenue: number; sharePct: number; shareWidth: number };

  const dailyRows: DailyRow[] = dailyBreakdown.map(([date, data]) => ({
    date,
    orders: data.orders,
    items: data.items,
    revenue: data.revenue,
    sharePct: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    shareWidth: (data.revenue / maxDailyRevenue) * 100,
  }));

  const dailyColumns: Column<DailyRow>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="font-medium text-stone-900">{r.date}</span>,
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      render: (r) => <span className="text-stone-600">{r.orders}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      render: (r) => <span className="text-stone-600">{r.items}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (r) => <span className="font-bold text-stone-900">{formatCurrency(r.revenue)}</span>,
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-stone-700"
              style={{ width: `${r.shareWidth}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-stone-400">{r.sharePct}%</span>
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Sales', value: formatCurrency(totalRevenue), icon: DollarSign, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Net Revenue', value: formatCurrency(totalRevenue - totalTax), icon: TrendingUp, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Tax Collected', value: formatCurrency(totalTax), icon: Calendar, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Items Sold', value: totalItems, icon: TrendingUp, accent: 'bg-stone-100 text-stone-600' },
  ];

  const handleExport = () => {
    const header = 'Order ID,Date,Time,Items,Subtotal,Tax,Total,Payment\n';
    const rows = filteredOrders
      .map((o) => {
        const d = new Date(o.createdAt);
        const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
        return `${o.id},${d.toLocaleDateString()},${d.toLocaleTimeString()},${itemCount},${o.subtotal.toFixed(2)},${o.tax.toFixed(2)},${o.total.toFixed(2)},${o.paymentMethod}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Sales Report</h1>
          <p className="text-sm text-stone-500">Track revenue and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-white p-1 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  period === p.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-900',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="md" onClick={handleExport} disabled={filteredOrders.length === 0}>
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.accent)}>
                <Icon size={20} />
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">{stat.value}</p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-stone-900">Revenue by Category</h2>
          {categoryBreakdown.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-stone-400">
              No sales data for this period
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(([category, data]) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-medium text-stone-700">{category}</span>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-900 transition-all duration-500"
                        style={{ width: `${(data.revenue / maxCatRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-stone-900">{formatCurrency(data.revenue)}</span>
                  <span className="w-14 text-right text-xs text-stone-400">{data.qty} qty</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-stone-900">Payment Methods</h2>
          {filteredOrders.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-stone-400">
              No sales data for this period
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white">
                  <CreditCard size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-600">Card Payments</p>
                  <p className="text-xs text-stone-400">
                    {filteredOrders.filter((o) => o.paymentMethod === 'card').length} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-stone-900">{formatCurrency(cardRevenue)}</p>
                  <p className="text-xs text-stone-400">
                    {totalRevenue > 0 ? Math.round((cardRevenue / totalRevenue) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Banknote size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-600">Cash Payments</p>
                  <p className="text-xs text-stone-400">
                    {filteredOrders.filter((o) => o.paymentMethod === 'cash').length} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-stone-900">{formatCurrency(cashRevenue)}</p>
                  <p className="text-xs text-stone-400">
                    {totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-bold text-stone-900">Daily Sales Breakdown</h2>
        </div>
        {dailyRows.length === 0 ? (
          <Card className="flex h-40 items-center justify-center text-sm text-stone-400">
            No sales data for this period
          </Card>
        ) : (
          <DataGrid
            columns={dailyColumns}
            rows={dailyRows}
            rowKey={(r) => r.date}
            emptyMessage="No sales data for this period"
          />
        )}
      </div>
    </div>
  );
}
