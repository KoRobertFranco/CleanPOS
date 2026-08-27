import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Sidebar, type View } from '@/components/Sidebar';
import { PosView } from '@/components/PosView';
import { DashboardView } from '@/components/DashboardView';
import { ProductsView } from '@/components/ProductsView';
import { OrdersView } from '@/components/OrdersView';
import { SalesView } from '@/components/SalesView';
import { ProductSummaryView } from '@/components/ProductSummaryView';
import { UsersView } from '@/components/UsersView';
import { LoginView } from '@/components/LoginView';

function AppContent() {
  const { user, loading, hasPermission } = useAuth();
  const [view, setView] = useState<View>('pos');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
          <p className="text-sm text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginView />;

  const renderView = () => {
    switch (view) {
      case 'pos':
        return hasPermission('pos_checkout') ? <PosView /> : <NoAccess />;
      case 'dashboard':
        return hasPermission('view_dashboard') ? <DashboardView /> : <NoAccess />;
      case 'products':
        return hasPermission('manage_products') ? <ProductsView /> : <NoAccess />;
      case 'orders':
        return hasPermission('view_invoices') ? <OrdersView /> : <NoAccess />;
      case 'sales':
        return hasPermission('view_sales') ? <SalesView /> : <NoAccess />;
      case 'productSummary':
        return hasPermission('view_product_report') ? <ProductSummaryView /> : <NoAccess />;
      case 'users':
        return hasPermission('manage_users') ? <UsersView /> : <NoAccess />;
      default:
        return <NoAccess />;
    }
  };

  return (
    <StoreProvider>
      <div className="flex h-screen overflow-hidden bg-stone-50 font-sans text-stone-900 antialiased">
        <Sidebar view={view} onNavigate={setView} />
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>
    </StoreProvider>
  );
}

function NoAccess() {
  return (
    <div className="flex h-full items-center justify-center bg-stone-50 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-stone-900">Access Denied</h2>
        <p className="mt-1 text-sm text-stone-500">
          You don't have permission to view this page. Contact an administrator.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
