// ============================================
// Main Page - الصفحة الرئيسية
// تم تحسينها مع Preload و React.memo
// ============================================

'use client';

import { useEffect, Suspense, lazy, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

// ============================================
// وضع Demo - مستخدم افتراضي للتطبيق
// ============================================
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@pos-system.com',
  name: 'مستخدم تجريبي',
  nameAr: 'مستخدم تجريبي',
  role: 'SUPER_ADMIN' as const,
  permissions: [],
  isActive: true,
  branchId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================
// مكون التحميل المؤقت - محسن
// ============================================
const PageSkeleton = memo(function PageSkeleton() {
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
});

// ============================================
// الصفحات الأساسية - دائماً مطلوبة
// مع Preload للصفحات الشائعة
// ============================================
const DashboardPage = lazy(() => 
  import('@/modules/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
const POSPage = lazy(() => 
  import('@/modules/pos/components/POSPage').then(m => ({ default: m.POSPage }))
);
const LoginPage = lazy(() => 
  import('@/modules/auth/components/LoginPage').then(m => ({ default: m.LoginPage }))
);

// ============================================
// مكون الملف الشخصي - محسن مع memo
// ============================================
const ProfilePage = memo(function ProfilePage() {
  const { user } = useAppStore();
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">الملف الشخصي</h1>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name || 'المستخدم'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Preload Functions - تحميل مسبق للصفحات الشائعة
// ============================================
const pageLoaders: Record<string, () => Promise<unknown>> = {
  users: () => import('@/modules/users/components/UsersPage'),
  products: () => import('@/modules/products/components/ProductsPage'),
  categories: () => import('@/modules/products/components/CategoriesPage'),
  customers: () => import('@/modules/customers/components/CustomersPage'),
  invoices: () => import('@/modules/invoices/components/InvoicesPage'),
  reports: () => import('@/modules/reports/components/ReportsPage'),
  settings: () => import('@/modules/settings/components/UnifiedSettingsPage'),
  pos: () => import('@/modules/pos/components/POSPage'),
};

// Preload الصفحات الشائعة في الخلفية
const preloadCommonPages = () => {
  // تأخير التحميل المسبق لعدم التأثير على الأداء الأولي
  setTimeout(() => {
    // تحميل Dashboard و POS أولاً (الأكثر استخداماً)
    import('@/modules/dashboard/components/DashboardPage');
    import('@/modules/pos/components/POSPage');
    
    // تحميل الصفحات الأخرى بعد تأخير أكبر
    setTimeout(() => {
      import('@/modules/products/components/ProductsPage');
      import('@/modules/invoices/components/InvoicesPage');
      import('@/modules/customers/components/CustomersPage');
    }, 2000);
  }, 1000);
};

// ============================================
// مكون تحميل الصفحات الديناميكي - محسن
// ============================================
const DynamicPage = memo(function DynamicPage({ page }: { page: string }) {
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
          case 'payment-gateways':
            loadedModule = await import('@/components/payments/PaymentGatewaySettings');
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
});

// ============================================
// مكون محتوى الصفحة - محسن
// ============================================
function PageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const page = searchParams.get('page');
  const { setPosMode, isAuthenticated, setUser } = useAppStore();

  // تفعيل المستخدم الافتراضي للـ Demo
  useEffect(() => {
    if (!isAuthenticated) {
      setUser(DEMO_USER);
    }
  }, [isAuthenticated, setUser]);

  // تحميل الصفحات الشائعة مسبقاً
  useEffect(() => {
    preloadCommonPages();
  }, []);

  useEffect(() => { 
    setPosMode(mode === 'pos'); 
  }, [mode, setPosMode]);

  // تحديد الصفحة التالية للتحميل المسبق
  useEffect(() => {
    // تحميل الصفحة التالية المحتملة بناءً على الصفحة الحالية
    const nextPageLoader = pageLoaders[page || ''];
    if (nextPageLoader) {
      // تأخير التحميل المسبق
      const timer = setTimeout(() => nextPageLoader(), 500);
      return () => clearTimeout(timer);
    }
  }, [page]);

  // فحص المصادقة
  if (!isAuthenticated && page !== 'login') {
    return (
      <Layout hideSidebar>
        <Suspense fallback={<PageSkeleton />}>
          <LoginPage />
        </Suspense>
      </Layout>
    );
  }

  if (page === 'login') {
    return (
      <Layout hideSidebar>
        <Suspense fallback={<PageSkeleton />}>
          <LoginPage />
        </Suspense>
      </Layout>
    );
  }

  // وضع نقطة البيع
  if (mode === 'pos') {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <POSPage />
        </Suspense>
      </Layout>
    );
  }

  // صفحة الملف الشخصي
  if (page === 'profile' && isAuthenticated) {
    return <Layout><ProfilePage /></Layout>;
  }

  // لوحة التحكم (الافتراضي)
  if (!page) {
    return (
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <DashboardPage />
        </Suspense>
      </Layout>
    );
  }

  // الصفحات الديناميكية
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <DynamicPage page={page} />
      </Suspense>
    </Layout>
  );
}

// ============================================
// المكون الرئيسي
// ============================================
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
      <PageContent />
    </Suspense>
  );
}
