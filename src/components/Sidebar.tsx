import { cn } from '@/lib/utils';
import { LayoutDashboard, ShoppingCart, Package, Receipt, BarChart3, LogOut } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

export type View = 'pos' | 'dashboard' | 'products' | 'orders' | 'sales';

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
}

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'pos', label: 'Checkout', icon: ShoppingCart },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: Receipt },
];

export function Sidebar({ view, onNavigate }: SidebarProps) {
  const { cartCount } = useStore();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-20 flex-col items-center border-r border-stone-200 bg-white py-5 lg:w-60">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white">
          <span className="text-lg font-bold">M</span>
        </div>
        <span className="hidden text-lg font-bold tracking-tight text-stone-900 lg:block">
          MiniMart
        </span>
      </div>

      <nav className="flex w-full flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
              {item.id === 'pos' && cartCount > 0 && (
                <span className="absolute right-2 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white lg:right-3 lg:top-3">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="w-full px-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
            {user?.initials ?? 'A'}
          </div>
          <div className="hidden flex-1 lg:block">
            <p className="text-xs font-semibold text-stone-900">{user?.name ?? 'Alex Morgan'}</p>
            <p className="text-[11px] text-stone-500">{user?.role ?? 'Cashier'}</p>
          </div>
          <button
            onClick={logout}
            className="text-stone-400 transition hover:text-red-500 lg:ml-auto"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
