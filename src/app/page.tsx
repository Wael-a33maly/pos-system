'use client';

import { useEffect, Suspense, lazy, useMemo } from 'react';
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

// Dashboard Module
const DashboardPage = lazy(() => import('@/modules/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })));
// POS Module
const POSPage = lazy(() => import('@/modules/pos/components/POSPage').then(m => ({ default: m.POSPage })));
// Products Module
const ProductsPage = lazy(() => import('@/modules/products/components/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CategoriesPage = lazy(() => import('@/modules/products/components/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const BrandsPage = lazy(() => import('@/modules/products/components/BrandsPage').then(m => ({ default: m.BrandsPage })));
const BarcodePrintPage = lazy(() => import('@/modules/products/components/BarcodePrintPage').then(m => ({ default: m.BarcodePrintPage })));
const ImportProductsPage = lazy(() => import('@/modules/products/components/ImportProductsPage').then(m => ({ default: m.ImportProductsPage })));
// Customers Module
const CustomersPage = lazy(() => import('@/modules/customers/components/CustomersPage').then(m => ({ default: m.CustomersPage })));
// Invoices Module
const InvoicesPage = lazy(() => import('@/modules/invoices/components/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
// Reports Module
const ReportsPage = lazy(() => import('@/modules/reports/components/ReportsPage').then(m => ({ default: m.ReportsPage })));
// Shifts Module
const ShiftManagementPage = lazy(() => import('@/modules/shifts/components/ShiftManagementPage').then(m => ({ default: m.ShiftManagementPage })));
const AuditLogsPage = lazy(() => import('@/modules/shifts/components/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
// Settings Module
const UnifiedSettingsPage = lazy(() => import('@/modules/settings/components/UnifiedSettingsPage').then(m => ({ default: m.UnifiedSettingsPage })));
// Auth Module
const LoginPage = lazy(() => import('@/modules/auth/components/LoginPage').then(m => ({ default: m.LoginPage })));
// Users Module
const UsersPage = lazy(() => import('@/modules/users/components/UsersPage').then(m => ({ default: m.UsersPage })));
// Suppliers Module
const SuppliersPage = lazy(() => import('@/modules/suppliers/components/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
// Expenses Module
const ExpensesPage = lazy(() => import('@/modules/expenses/components/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
// Accounts Module
const AccountsPage = lazy(() => import('@/modules/accounts/components/AccountsPage').then(m => ({ default: m.AccountsPage })));

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

const PAGE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'users': UsersPage, 'roles': UsersPage,
  'shifts': ShiftManagementPage, 'shift-close': ShiftManagementPage, 'shift-closures': ShiftManagementPage, 'audit-logs': AuditLogsPage,
  'products': ProductsPage, 'categories': CategoriesPage, 'brands': BrandsPage,
  'customers': CustomersPage, 'suppliers': SuppliersPage, 'supplier-companies': SuppliersPage,
  'invoices': InvoicesPage, 'returns': InvoicesPage,
  'expenses': ExpensesPage, 'expense-categories': ExpensesPage,
  'accounts': AccountsPage, 'reports': ReportsPage, 'settings': UnifiedSettingsPage,
  'barcode': BarcodePrintPage, 'import': ImportProductsPage,
};

function PageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const page = searchParams.get('page');
  const { setPosMode, isAuthenticated } = useAppStore();

  useEffect(() => { setPosMode(mode === 'pos'); }, [mode, setPosMode]);

  const PageComponent = useMemo(() => {
    if (!isAuthenticated && page !== 'login') return LoginPage;
    if (page === 'login') return LoginPage;
    if (mode === 'pos') return POSPage;
    if (page === 'profile') return null;
    return PAGE_COMPONENTS[page || ''] || DashboardPage;
  }, [isAuthenticated, page, mode]);

  if (page === 'profile' && isAuthenticated) return <Layout><ProfilePage /></Layout>;

  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        {PageComponent && <PageComponent />}
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
