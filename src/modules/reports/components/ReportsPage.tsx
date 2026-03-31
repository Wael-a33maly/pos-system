'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  FileSpreadsheet,
  FileDown,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';

// Types
interface ReportFilter {
  startDate: Date;
  endDate: Date;
  branchIds: string[];
  userId?: string;
  categoryId?: string;
  productId?: string;
  paymentMethodId?: string;
}

interface ReportData {
  summary: {
    totalSales: number;
    totalReturns: number;
    netSales: number;
    totalInvoices: number;
    averageOrder: number;
  };
  paymentBreakdown: Record<string, number>;
  dailySales: Array<{ date: string; sales: number; invoices: number }>;
  details: any[];
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(value);
};

// Report types
const reportTypes = [
  { id: 'sales', name: 'المبيعات', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
  { id: 'products', name: 'المنتجات', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
  { id: 'branches', name: 'الفروع', icon: PieChart, color: 'from-purple-500 to-purple-600' },
  { id: 'cashiers', name: 'الكاشير', icon: Receipt, color: 'from-amber-500 to-amber-600' },
  { id: 'payments', name: 'طرق الدفع', icon: DollarSign, color: 'from-rose-500 to-rose-600' },
  { id: 'shifts', name: 'الورديات', icon: FileText, color: 'from-cyan-500 to-cyan-600' },
  { id: 'expenses', name: 'المصروفات', icon: TrendingDown, color: 'from-orange-500 to-orange-600' },
  { id: 'returns', name: 'المرتجعات', icon: ArrowDownRight, color: 'from-red-500 to-red-600' },
];

// Date range presets
const datePresets = [
  { id: 'today', name: 'اليوم', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { id: 'yesterday', name: 'أمس', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
  { id: 'week', name: 'أسبوع', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { id: 'month', name: 'شهر', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { id: 'quarter', name: 'ربع', getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
];

// Summary Card Component
function SummaryCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  delay = 0
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  delay?: number;
}) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <motion.p
                className="text-2xl font-bold mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 }}
              >
                {value}
              </motion.p>
              {change !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-sm",
                  isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <motion.div
              className={cn("p-3 rounded-xl", gradient)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse h-10 w-24 bg-muted rounded-lg flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-[300px] bg-muted rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [selectedReport, setSelectedReport] = useState(searchParams.get('type') || 'sales');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || data || []);
        }
      } catch (e) {
        console.error('Failed to fetch branches:', e);
      }
    };
    fetchBranches();
  }, []);

  // Fetch report data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('startDate', dateRange.start.toISOString());
      params.set('endDate', dateRange.end.toISOString());
      if (selectedBranches.length > 0) {
        params.set('branchIds', selectedBranches.join(','));
      }

      const res = await fetch(`/api/reports/${selectedReport}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error('Failed to fetch report:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedReport, dateRange, selectedBranches]);

  // Handle date preset
  const handleDatePreset = (presetId: string) => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset) {
      const { start, end } = preset.getValue();
      setDateRange({ start, end });
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!data?.details && !data?.dailySales) return;
    
    const exportData = data.details || data.dailySales || [];
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `report-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data?.details && !data?.dailySales) return;
    
    const exportData = data.details || data.dailySales || [];
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!data?.details && !data?.dailySales) return;
    
    const doc = new jsPDF('l', 'mm', 'a4');
    const exportData = data.details || data.dailySales || [];
    
    if (exportData.length > 0) {
      const headers = Object.keys(exportData[0]);
      const rows = exportData.map(row => Object.values(row));
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129] },
      });
    }
    
    doc.save(`report-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Table columns based on report type
  const getColumns = (): ColumnDef<any>[] => {
    if (selectedReport === 'sales' && data?.dailySales) {
      return [
        { accessorKey: 'date', header: 'التاريخ' },
        { 
          accessorKey: 'sales', 
          header: 'المبيعات',
          cell: ({ row }) => formatCurrency(row.getValue('sales'))
        },
        { accessorKey: 'invoices', header: 'الفواتير' },
      ];
    }
    
    if (data?.details && data.details.length > 0) {
      return Object.keys(data.details[0]).map(key => ({
        accessorKey: key,
        header: key,
        cell: ({ row }) => {
          const value = row.getValue(key);
          if (typeof value === 'number' && key.toLowerCase().includes('sales') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue')) {
            return formatCurrency(value);
          }
          return value;
        },
      }));
    }
    
    return [];
  };

  const table = useReactTable({
    data: data?.details || data?.dailySales || [],
    columns: getColumns(),
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
            التقارير والتحليلات
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <BarChart3 className="h-4 w-4" />
            تحليل شامل لأداء النظام
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={() => fetchData()} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              تحديث
            </Button>
          </motion.div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-primary" />
                  تصدير التقرير
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button onClick={exportToExcel} className="justify-start gap-2 w-full bg-gradient-to-l from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                    <FileSpreadsheet className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button onClick={exportToCSV} variant="outline" className="justify-start gap-2 w-full">
                    <FileDown className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button onClick={exportToPDF} variant="outline" className="justify-start gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    تصدير PDF
                  </Button>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Report Type Tabs */}
      <motion.div 
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {reportTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={selectedReport === type.id ? 'default' : 'outline'}
              onClick={() => setSelectedReport(type.id)}
              className={cn(
                "gap-2 transition-all duration-300",
                selectedReport === type.id && `bg-gradient-to-l ${type.color} hover:opacity-90`
              )}
            >
              <type.icon className="h-4 w-4" />
              {type.name}
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-l from-muted/30 to-muted/10">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Presets */}
              <div className="flex flex-wrap gap-2">
                {datePresets.map(preset => (
                  <motion.div key={preset.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset(preset.id)}
                      className="bg-background/50"
                    >
                      {preset.name}
                    </Button>
                  </motion.div>
                ))}
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Custom Date Range */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-background/50">
                    <CalendarIcon className="h-4 w-4" />
                    {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.start,
                      to: dateRange.end,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ start: range.from, end: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Branch Filter */}
              <Select
                value={selectedBranches[0] || ''}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedBranches([]);
                  } else {
                    setSelectedBranches([value]);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] bg-background/50">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="إجمالي المبيعات"
            value={formatCurrency(data.summary.totalSales)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            delay={0}
          />
          <SummaryCard
            title="المرتجعات"
            value={formatCurrency(data.summary.totalReturns)}
            icon={ArrowDownRight}
            gradient="bg-gradient-to-br from-rose-500 to-rose-600"
            delay={0.1}
          />
          <SummaryCard
            title="صافي المبيعات"
            value={formatCurrency(data.summary.netSales)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0.2}
          />
          <SummaryCard
            title="عدد الفواتير"
            value={data.summary.totalInvoices}
            icon={Receipt}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={0.3}
          />
        </div>
      )}

      {/* Chart */}
      {data?.dailySales && data.dailySales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                المبيعات اليومية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="sales" 
                      name="المبيعات" 
                      fill="url(#colorSales)" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              تفاصيل التقرير
            </CardTitle>
            <CardDescription>
              عرض {table.getPaginationRowModel().rows.length} من {table.getCoreRowModel().rows.length} سجل
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ReportsSkeleton />
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="bg-muted/50">
                          {headerGroup.headers.map(header => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row, index) => (
                            <TableRow
                              key={row.id}
                            >
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={getColumns().length} className="text-center h-24">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-muted-foreground"
                              >
                                <FileText className="h-12 w-12 mb-2 opacity-50" />
                                <p>لا توجد بيانات</p>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={table.getState().pagination.pageSize.toString()}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
