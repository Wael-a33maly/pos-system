'use client';

import { useEffect, Suspense, lazy, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

// Core Pages - Always needed
const DashboardPage = lazy(() => import('@/modules/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })));
const POSPage = lazy(() => import('@/modules/pos/components/POSPage').then(m => ({ default: m.POSPage })));
const LoginPage = lazy(() => import('@/modules/auth/components/LoginPage').then(m => ({ default: m.LoginPage })));

function ProfilePage() {
  const { user } = useAppStore();
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">الملف الشخصي</h1>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name || 'المستخدم'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic page loader component
function DynamicPage({ page }: { page: string }) {
  const [PageComponent, setPageComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const loadPage = async () => {
      try {
        let loadedModule;
        switch (page) {
          case 'users':
            loadedModule = await import('@/modules/users/components/UsersPage');
            break;
          case 'roles':
          case 'permissions':
            loadedModule = await import('@/modules/roles/components/RolesPage');
            break;
          case 'shifts':
          case 'shift-close':
          case 'shift-closures':
            loadedModule = await import('@/modules/shifts/components/ShiftManagementPage');
            break;
          case 'audit-logs':
            loadedModule = await import('@/modules/shifts/components/AuditLogsPage');
            break;
          case 'products':
            loadedModule = await import('@/modules/products/components/ProductsPage');
            break;
          case 'categories':
            loadedModule = await import('@/modules/products/components/CategoriesPage');
            break;
          case 'brands':
            loadedModule = await import('@/modules/products/components/BrandsPage');
            break;
          case 'customers':
            loadedModule = await import('@/modules/customers/components/CustomersPage');
            break;
          case 'suppliers':
          case 'supplier-companies':
            loadedModule = await import('@/modules/suppliers/components/SuppliersPage');
            break;
          case 'invoices':
            loadedModule = await import('@/modules/invoices/components/InvoicesPage');
            break;
          case 'returns':
            loadedModule = await import('@/modules/returns/components/ReturnsPage');
            break;
          case 'expenses':
          case 'expense-categories':
            loadedModule = await import('@/modules/expenses/components/ExpensesPage');
            break;
          case 'accounts':
            loadedModule = await import('@/modules/accounts/components/AccountsPage');
            break;
          case 'chart-of-accounts':
            loadedModule = await import('@/modules/accounts/components/ChartOfAccountsPage');
            break;
          case 'journal-entries':
            loadedModule = await import('@/modules/accounts/components/JournalEntriesPage');
            break;
          case 'financial-reports':
            loadedModule = await import('@/modules/accounts/components/FinancialReportsPage');
            break;
          case 'reports':
            loadedModule = await import('@/modules/reports/components/ReportsPage');
            break;
          case 'settings':
            loadedModule = await import('@/modules/settings/components/UnifiedSettingsPage');
            break;
          case 'barcode':
            loadedModule = await import('@/modules/products/components/BarcodePrintPage');
            break;
          case 'import':
            loadedModule = await import('@/modules/products/components/ImportProductsPage');
            break;
          case 'printing':
            loadedModule = await import('@/modules/printing/components/PrinterSelector');
            break;
          case 'transfers':
            loadedModule = await import('@/modules/transfers/components/TransfersPage');
            break;
          case 'loyalty':
            loadedModule = await import('@/modules/loyalty/components/LoyaltyPage');
            break;
          case 'scheduled-reports':
            loadedModule = await import('@/modules/scheduled-reports/components/ScheduledReportsPage');
            break;
          case 'offers':
            loadedModule = await import('@/modules/offers/components/OffersPage');
            break;
          case 'inventory':
            loadedModule = await import('@/modules/inventory/components/InventoryPage');
            break;
          case 'purchases':
            loadedModule = await import('@/modules/purchases/components/PurchasesPage');
            break;
          default:
            loadedModule = await import('@/modules/dashboard/components/DashboardPage');
        }
        setPageComponent(() => loadedModule.default);
      } catch (error) {
        console.error('Failed to load page:', error);
        const fallbackModule = await import('@/modules/dashboard/components/DashboardPage');
        setPageComponent(() => fallbackModule.default);
      }
      setLoading(false);
    };

    loadPage();
  }, [page]);

  if (loading || !PageComponent) {
    return <PageSkeleton />;
  }

  return <PageComponent />;
}

function PageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const page = searchParams.get('page');
  const { setPosMode, isAuthenticated } = useAppStore();

  useEffect(() => { setPosMode(mode === 'pos'); }, [mode, setPosMode]);

  // Auth check
  if (!isAuthenticated && page !== 'login') {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <LoginPage />
        </Suspense>
      </Layout>
    );
  }

  if (page === 'login') {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <LoginPage />
        </Suspense>
      </Layout>
    );
  }

  // POS mode
  if (mode === 'pos') {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <POSPage />
        </Suspense>
      </Layout>
    );
  }

  // Profile page
  if (page === 'profile' && isAuthenticated) {
    return <Layout><ProfilePage /></Layout>;
  }

  // Dashboard (default)
  if (!page) {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <DashboardPage />
        </Suspense>
      </Layout>
    );
  }

  // Dynamic pages
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <DynamicPage page={page} />
      </Suspense>
    </Layout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
      <PageContent />
    </Suspense>
  );
}
