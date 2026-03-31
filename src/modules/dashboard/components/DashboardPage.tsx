// ============================================
// Dashboard Page - صفحة لوحة التحكم
// تم تحسينها مع Code Splitting للرسوم البيانية
// ============================================

'use client';

import { useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Store,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Sparkles,
  Rocket,
  Target,
  Zap,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { useDashboard } from '../hooks';
import { KPICard } from './KPICard';
import { MiniKPICard } from './MiniKPICard';
import { QuickActionButton } from './QuickActionButton';
import { DashboardSkeleton } from './DashboardSkeleton';
import type { CurrencySettings } from '../types';

// ============================================
// Lazy Loading للرسوم البيانية - تحسين الأداء
// ============================================
const DailySalesChart = lazy(() => 
  import('./charts/DailySalesChart').then(m => ({ default: m.DailySalesChart }))
);

const HourlySalesChart = lazy(() => 
  import('./charts/HourlySalesChart').then(m => ({ default: m.HourlySalesChart }))
);

const PaymentDistributionChart = lazy(() => 
  import('./charts/PaymentDistributionChart').then(m => ({ default: m.PaymentDistributionChart }))
);

const BranchPerformanceChart = lazy(() => 
  import('./charts/BranchPerformanceChart').then(m => ({ default: m.BranchPerformanceChart }))
);

// ============================================
// مكون تحميل مؤقت للرسوم البيانية
// ============================================
function ChartSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================
// تنسيق العملة
// ============================================
const formatCurrency = (value: number, currency: CurrencySettings = { code: 'SAR', symbol: 'ر.س', decimalPlaces: 2 }) => {
  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    }).format(value);
  } catch {
    return `${value.toFixed(currency.decimalPlaces)} ${currency.symbol}`;
  }
};

// تنسيق الأرقام
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ar-SA').format(value);
};

// ============================================
// متغيرات الحركة
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ============================================
// المكون الرئيسي
// ============================================
export function DashboardPage() {
  const {
    data,
    loading,
    error,
    refreshing,
    branches,
    currency,
    selectedBranch,
    setSelectedBranch,
    refresh,
  } = useDashboard();

  // تحضير البيانات للرسوم البيانية
  const hourlyChartData = useMemo(() => {
    if (!data) return [];
    return data.hourlySales.map(item => ({
      ...item,
      hourLabel: `${item.hour}:00`,
    }));
  }, [data]);

  const paymentChartData = useMemo(() => {
    if (!data) return [];
    return data.paymentDistribution.map(item => ({
      name: item.methodAr,
      value: item.amount,
      percentage: item.percentage,
    }));
  }, [data]);

  const dailyChartData = useMemo(() => {
    if (!data) return [];
    return data.dailySales.map(item => ({
      ...item,
      dateLabel: format(new Date(item.date), 'EEE', { locale: ar }),
    }));
  }, [data]);

  // حالة التحميل
  if (loading) {
    return <DashboardSkeleton />;
  }

  // حالة الخطأ
  if (error || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          </motion.div>
          <p className="text-lg font-medium mb-2">{error || 'لا توجد بيانات'}</p>
          <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
          <Button onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </motion.div>
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
            لوحة التحكم
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedBranch || 'all'} onValueChange={(v) => setSelectedBranch(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px] bg-background/50">
              <Store className="h-4 w-4 ml-2 text-muted-foreground" />
              <SelectValue placeholder="جميع الفروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refresh}
              disabled={refreshing}
              className="relative overflow-hidden"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 overflow-x-auto pb-2"
      >
        <QuickActionButton icon={ShoppingCart} label="نقطة بيع" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <QuickActionButton icon={Package} label="المنتجات" color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <QuickActionButton icon={FileText} label="التقارير" color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <QuickActionButton icon={Users} label="العملاء" color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <QuickActionButton icon={Clock} label="الورديات" color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <KPICard
          title="مبيعات اليوم"
          value={kpis.todaySales}
          change={kpis.salesChange}
          changeLabel="مقارنة بأمس"
          icon={DollarSign}
          index={0}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          currency={currency}
        />
        <KPICard
          title="عدد الفواتير"
          value={kpis.todayInvoices}
          format="number"
          icon={ShoppingCart}
          index={1}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <KPICard
          title="متوسط قيمة الفاتورة"
          value={kpis.averageOrderValue}
          icon={Target}
          index={2}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          currency={currency}
        />
        <KPICard
          title="هامش الربح"
          value={kpis.profitMargin}
          format="percent"
          icon={TrendingUp}
          index={3}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </motion.div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPICard
          title="الربح اليوم"
          value={formatCurrency(kpis.totalProfit, currency)}
          icon={Sparkles}
          color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
          index={0}
        />
        <MiniKPICard
          title="ورديات نشطة"
          value={kpis.activeShifts}
          icon={Zap}
          color="text-blue-600 bg-blue-100 dark:bg-blue-900/30"
          index={1}
        />
        <MiniKPICard
          title="منتجات منخفضة"
          value={kpis.lowStockProducts}
          icon={AlertTriangle}
          color="text-amber-600 bg-amber-100 dark:bg-amber-900/30"
          index={2}
        />
        <MiniKPICard
          title="أفضل فرع"
          value={kpis.topBranch?.name || '-'}
          icon={Rocket}
          color="text-purple-600 bg-purple-100 dark:bg-purple-900/30"
          index={3}
        />
      </div>

      {/* Charts Row - Lazy Loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <DailySalesChart data={data.dailySales} currency={currency} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <HourlySalesChart data={data.hourlySales} currency={currency} />
        </Suspense>
      </div>

      {/* Second Charts Row - Lazy Loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <PaymentDistributionChart data={data.paymentDistribution} currency={currency} />
        </Suspense>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                أفضل المنتجات
              </CardTitle>
              <CardDescription>الأكثر مبيعاً هذا الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <motion.div 
                      key={product.id} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-l from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                        index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatNumber(product.quantity)} قطعة
                          </Badge>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{formatCurrency(product.revenue, currency)}</p>
                        <p className="text-sm text-emerald-600 font-medium">
                          +{formatCurrency(product.profit, currency)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        <Suspense fallback={<ChartSkeleton />}>
          <BranchPerformanceChart data={data.branchPerformance || []} currency={currency} />
        </Suspense>
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  آخر الفواتير
                </CardTitle>
                <CardDescription>أحدث العمليات</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {data.recentInvoices.map((invoice, index) => (
                  <motion.div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-l from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 cursor-pointer group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    whileHover={{ x: -5 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.branch?.name} • {invoice.user?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">{formatCurrency(invoice.totalAmount, currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
