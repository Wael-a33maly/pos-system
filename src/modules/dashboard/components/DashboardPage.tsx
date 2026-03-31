// ============================================
// Dashboard Page - صفحة لوحة التحكم
// ============================================

'use client';

import { useMemo } from 'react';
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
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { useDashboard } from '../hooks';
import { KPICard } from './KPICard';
import { MiniKPICard } from './MiniKPICard';
import { QuickActionButton } from './QuickActionButton';
import { DashboardSkeleton } from './DashboardSkeleton';
import type { CurrencySettings } from '../types';

// Colors for charts
const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Format currency with dynamic currency
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

// Format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ar-SA').format(value);
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

  // Prepare chart data
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
      dateLabel: format(parseISO(item.date), 'EEE', { locale: ar }),
    }));
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

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
      {/* Header with animation */}
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
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    المبيعات الأسبوعية
                  </CardTitle>
                  <CardDescription>آخر 7 أيام</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>تصدير كصورة</DropdownMenuItem>
                    <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dateLabel" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currency)}
                      labelStyle={{ direction: 'rtl' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      name="المبيعات" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      name="الربح" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    المبيعات بالساعة
                  </CardTitle>
                  <CardDescription>توزيع المبيعات اليوم</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  مباشر
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hourlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hourLabel" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      name="المبيعات" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                طرق الدفع
              </CardTitle>
              <CardDescription>توزيع طرق الدفع اليوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {paymentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                {data.paymentDistribution.map((item, index) => (
                  <motion.div 
                    key={item.method} 
                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-offset-background" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span>{item.methodAr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
                      <Badge variant="outline" className="text-xs">{item.percentage.toFixed(0)}%</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                        index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" :
                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                        index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
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

        {/* Branch Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                أداء الفروع
              </CardTitle>
              <CardDescription>مقارنة المبيعات هذا الأسبوع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                {data.branchPerformance && data.branchPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.branchPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={70} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currency)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      name="المبيعات" 
                      fill="#10b981" 
                      radius={[0, 6, 6, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </div>
              <Separator className="my-4" />
              <ScrollArea className="h-[130px]">
                <div className="space-y-3">
                  {data.branchPerformance.map((branch, index) => (
                    <motion.div 
                      key={branch.id} 
                      className="flex items-center justify-between text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{branch.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(branch.sales, currency)}</span>
                        <Badge variant="outline" className="text-xs">{branch.invoices} فاتورة</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section - Recent Invoices */}
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
