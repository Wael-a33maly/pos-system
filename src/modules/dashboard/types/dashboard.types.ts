// ============================================
// Dashboard Types - أنواع لوحة التحكم
// ============================================

// ============================================
// KPI Types - أنواع المؤشرات
// ============================================

export interface KPIStats {
  todaySales: number;
  yesterdaySales: number;
  salesChange: number;
  todayInvoices: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  topBranch: { id: string; name: string; sales: number } | null;
  topProduct: { id: string; name: string; quantity: number } | null;
  topCashier: { id: string; name: string; sales: number } | null;
  activeShifts: number;
  lowStockProducts: number;
}

export interface HourlySales {
  hour: number;
  sales: number;
  invoices: number;
}

export interface PaymentDistribution {
  method: string;
  methodAr: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DailySales {
  date: string;
  sales: number;
  profit: number;
  invoices: number;
}

export interface TopProduct {
  id: string;
  name: string;
  nameAr: string | null;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface BranchPerformance {
  id: string;
  name: string;
  sales: number;
  profit: number;
  invoices: number;
  growth: number;
}

export interface DashboardData {
  kpis: KPIStats;
  hourlySales: HourlySales[];
  paymentDistribution: PaymentDistribution[];
  dailySales: DailySales[];
  topProducts: TopProduct[];
  branchPerformance: BranchPerformance[];
  recentInvoices: RecentInvoice[];
  lowStockAlert: LowStockProduct[];
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  createdAt: string;
  branch?: { name: string };
  user?: { name: string };
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
}

// ============================================
// Currency Settings - إعدادات العملة
// ============================================

export interface CurrencySettings {
  code: string;
  symbol: string;
  decimalPlaces: number;
}

// ============================================
// Component Props - خصائص المكونات
// ============================================

export interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'currency' | 'number' | 'percent';
  index?: number;
  gradient?: string;
  currency?: CurrencySettings;
}

export interface MiniKPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  index?: number;
}

export interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  color: string;
}

// ============================================
// Hook Types - أنواع الـ Hooks
// ============================================

export interface UseDashboardOptions {
  selectedBranch?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  branches: { id: string; name: string }[];
  currency: CurrencySettings;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  refresh: () => Promise<void>;
}
