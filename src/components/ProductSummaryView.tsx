import { useMemo, useState } from 'react';
import { Download, TrendingUp, Package, RotateCcw, DollarSign } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/format';
import { Card, Button } from '@/components/ui';
import { DataGrid, type Column } from '@/components/DataGrid';
import { FilterBar } from '@/components/FilterBar';
import { cn } from '@/lib/utils';
import type { Category, ProductSummary } from '@/lib/types';

type Period = 'today' | '7d' | '30d' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'Snacks', label: 'Snacks' },
  { id: 'Beverages', label: 'Beverages' },
  { id: 'Grocery', label: 'Grocery' },
  { id: 'Household', label: 'Household' },
];

type SortKey = 'name' | 'qtySold' | 'qtyReturned' | 'netQty' | 'revenue' | 'refunds' | 'netRevenue';

export function ProductSummaryView() {
  const { products, orders, returns } = useStore();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('netRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const periodOrders = useMemo(() => {
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

  const periodReturns = useMemo(() => {
    if (period === 'all') return returns;
    const now = Date.now();
    const ranges: Record<Period, number> = {
      today: 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };
    const cutoff = now - ranges[period];
    return returns.filter((r) => r.createdAt >= cutoff);
  }, [returns, period]);

  const summaries = useMemo<ProductSummary[]>(() => {
    const map = new Map<string, ProductSummary>();

    products.forEach((p) => {
      map.set(p.id, {
        product: p,
        qtySold: 0,
        qtyReturned: 0,
        netQty: 0,
        revenue: 0,
        refunds: 0,
        netRevenue: 0,
      });
    });

    periodOrders.forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.product.id);
        if (!cur) return;
        cur.qtySold += i.quantity;
        cur.revenue += i.product.price * i.quantity;
      }),
    );

    periodReturns.forEach((r) =>
      r.items.forEach((i) => {
        const cur = map.get(i.product.id);
        if (!cur) return;
        cur.qtyReturned += i.quantity;
        cur.refunds += i.product.price * i.quantity;
      }),
    );

    map.forEach((v) => {
      v.netQty = v.qtySold - v.qtyReturned;
      v.netRevenue = v.revenue - v.refunds;
    });

    return [...map.values()];
  }, [products, periodOrders, periodReturns]);

  const filtered = useMemo(() => {
    const result = summaries.filter((s) => {
      const matchCat = categoryFilter === 'all' || s.product.category === categoryFilter;
      const matchSearch = s.product.name.toLowerCase().includes(search.toLowerCase()) ||
        s.product.sku.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    result.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === 'name') {
        av = a.product.name;
        bv = b.product.name;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [summaries, categoryFilter, search, sortKey, sortDir]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.revenue,
        refunds: acc.refunds + s.refunds,
        netRevenue: acc.netRevenue + s.netRevenue,
        qtySold: acc.qtySold + s.qtySold,
        qtyReturned: acc.qtyReturned + s.qtyReturned,
      }),
      { revenue: 0, refunds: 0, netRevenue: 0, qtySold: 0, qtyReturned: 0 },
    );
  }, [filtered]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const columns: Column<ProductSummary>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{s.product.emoji}</span>
          <div>
            <p className="font-medium text-stone-900">{s.product.name}</p>
            <p className="text-[11px] text-stone-400">{s.product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (s) => (
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
          {s.product.category}
        </span>
      ),
    },
    {
      key: 'qtySold',
      header: 'Sold',
      align: 'right',
      sortable: true,
      render: (s) => <span className="font-medium text-stone-900">{s.qtySold}</span>,
    },
    {
      key: 'qtyReturned',
      header: 'Returned',
      align: 'right',
      sortable: true,
      render: (s) => (
        <span className={cn(s.qtyReturned > 0 ? 'text-red-600' : 'text-stone-400')}>
          {s.qtyReturned}
        </span>
      ),
    },
    {
      key: 'netQty',
      header: 'Net Qty',
      align: 'right',
      sortable: true,
      render: (s) => <span className="font-medium text-stone-700">{s.netQty}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      sortable: true,
      render: (s) => <span className="font-semibold text-stone-900">{formatCurrency(s.revenue)}</span>,
    },
    {
      key: 'refunds',
      header: 'Refunds',
      align: 'right',
      sortable: true,
      render: (s) => (
        <span className={cn(s.refunds > 0 ? 'text-red-600' : 'text-stone-400')}>
          {formatCurrency(s.refunds)}
        </span>
      ),
    },
    {
      key: 'netRevenue',
      header: 'Net Revenue',
      align: 'right',
      sortable: true,
      render: (s) => <span className="font-bold text-stone-900">{formatCurrency(s.netRevenue)}</span>,
    },
  ];

  const statCards = [
    { label: 'Gross Revenue', value: formatCurrency(totals.revenue), icon: DollarSign, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Refunds', value: formatCurrency(totals.refunds), icon: RotateCcw, accent: 'bg-red-50 text-red-600' },
    { label: 'Net Revenue', value: formatCurrency(totals.netRevenue), icon: TrendingUp, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Items Sold', value: totals.qtySold, icon: Package, accent: 'bg-amber-50 text-amber-600' },
  ];

  const handleExport = () => {
    const header = 'Product,SKU,Category,Sold,Returned,Net Qty,Revenue,Refunds,Net Revenue\n';
    const rows = filtered
      .map((s) => `${s.product.name},${s.product.sku},${s.product.category},${s.qtySold},${s.qtyReturned},${s.netQty},${s.revenue.toFixed(2)},${s.refunds.toFixed(2)},${s.netRevenue.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-summary-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Product Summary</h1>
        <p className="text-sm text-stone-500">Sales and returns performance per product</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', stat.accent)}>
                <Icon size={18} />
              </div>
              <p className="mt-2.5 text-xl font-bold text-stone-900">{stat.value}</p>
              <p className="text-xs text-stone-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or SKU..."
        filters={CATEGORY_FILTERS}
        activeFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
        right={
          <>
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
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={16} /> Export
            </Button>
          </>
        }
      />

      <DataGrid
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.product.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key) => handleSort(key as SortKey)}
        emptyMessage="No products match your filters"
      />

      <p className="mt-3 text-xs text-stone-400">
        Click column headers to sort. {filtered.length} products shown.
      </p>
    </div>
  );
}
