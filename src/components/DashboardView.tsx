import { TrendingUp, ShoppingBag, Receipt, Package, ArrowUpRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/format';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export function DashboardView() {
  const { orders, products } = useStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lowStock = products.filter((p) => p.stock < 15);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Orders', value: orders.length, icon: Receipt, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Items Sold', value: totalItems, icon: ShoppingBag, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Avg Order', value: formatCurrency(avgOrder), icon: ArrowUpRight, accent: 'bg-stone-100 text-stone-600' },
  ];

  const topProducts = (() => {
    const map = new Map<string, { name: string; emoji: string; qty: number; revenue: number }>();
    orders.forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.product.id) ?? { name: i.product.name, emoji: i.product.emoji, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.product.price * i.quantity;
        map.set(i.product.id, cur);
      }),
    );
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

  const maxRevenue = topProducts[0]?.revenue ?? 1;

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Sales overview and performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.accent)}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">{stat.value}</p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-stone-900">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-stone-400">
              No sales yet — complete an order to see data
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-stone-400">{idx + 1}</span>
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-stone-900">{p.name}</span>
                      <span className="text-stone-500">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-900 transition-all duration-500"
                        style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-stone-400">{p.qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package size={18} className="text-stone-400" />
            <h2 className="text-base font-bold text-stone-900">Low Stock</h2>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-stone-400">
              All products well stocked
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-2.5">
                  <span className="text-xl">{p.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-stone-900">{p.name}</span>
                  <span
                    className={cn(
                      'rounded-lg px-2 py-0.5 text-xs font-bold',
                      p.stock === 0
                        ? 'bg-red-100 text-red-600'
                        : p.stock < 10
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-500',
                    )}
                  >
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-base font-bold text-stone-900">Recent Orders</h2>
        {orders.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-stone-400">
            No orders yet
          </div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-stone-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">{o.id}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items · {o.paymentMethod}
                    </p>
                    <p className="text-xs text-stone-400">{formatTime(o.createdAt)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-stone-900">{formatCurrency(o.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
