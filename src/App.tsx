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
import { LoginView } from '@/components/LoginView';

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('pos');

  if (!user) return <LoginView />;

  return (
    <StoreProvider>
      <div className="flex h-screen overflow-hidden bg-stone-50 font-sans text-stone-900 antialiased">
        <Sidebar view={view} onNavigate={setView} />
        <main className="flex-1 overflow-hidden">
          {view === 'pos' && <PosView />}
          {view === 'dashboard' && <DashboardView />}
          {view === 'products' && <ProductsView />}
          {view === 'orders' && <OrdersView />}
          {view === 'sales' && <SalesView />}
          {view === 'productSummary' && <ProductSummaryView />}
        </main>
      </div>
    </StoreProvider>
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
