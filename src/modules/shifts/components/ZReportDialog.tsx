'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Printer,
  Download,
  FileText,
  Clock,
  User,
  Building2,
  DollarSign,
  CreditCard,
  Receipt,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ZReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string | null;
}

interface ZReport {
  zNumber: number;
  zNumberFormatted: string;
  isOpen?: boolean;
  reportDate: Date;
  generatedAt: Date;
  shift: {
    id: string;
    status: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    branch: { id: string; name: string; nameAr?: string };
    user: { id: string; name: string; email: string };
    closedByUser?: { id: string; name: string };
  };
  stats: {
    totalInvoices: number;
    completedInvoices: number;
    returnInvoices: number;
    cancelledInvoices: number;
    totalSales: number;
    totalReturns: number;
    totalDiscounts: number;
    totalTax: number;
    totalExpenses: number;
    totalItems: number;
    totalQuantity: number;
    highestInvoice: number;
    avgInvoice: number;
  };
  payments: {
    breakdown: Record<string, {
      name: string;
      nameAr: string;
      amount: number;
      count: number;
      returns: number;
    }>;
    total: number;
  };
  cash: {
    opening: number;
    sales: number;
    returns: number;
    expenses: number;
    expected: number;
    actual: number;
    variance: number;
  };
  expenses: {
    total: number;
    byCategory: { name: string; amount: number; count: number }[];
    list: any[];
  };
  products: {
    total: number;
    quantity: number;
    items: {
      id: string;
      name: string;
      barcode: string;
      quantity: number;
      totalAmount: number;
      count: number;
    }[];
  };
  invoices: {
    completed: {
      id: string;
      number: string;
      total: number;
      discount: number;
      paymentMethod: string;
      customer?: string;
      time: Date;
    }[];
    returns: {
      id: string;
      number: string;
      total: number;
      originalInvoice?: string;
      time: Date;
    }[];
  };
  notes?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: Date | string) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: ar });
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ساعة ${mins} دقيقة`;
};

export function ZReportDialog({ open, onOpenChange, shiftId }: ZReportDialogProps) {
  const [report, setReport] = useState<ZReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'invoices' | 'products' | 'expenses'>('summary');

  useEffect(() => {
    if (open) {
      if (shiftId) {
        fetchReport();
      } else {
        setError(null);
        setReport(null);
      }
    }
  }, [open, shiftId]);

  const fetchReport = async () => {
    if (!shiftId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/shifts/${shiftId}/z-report`);
      const data = await res.json();
      
      if (res.ok) {
        setReport(data.report);
      } else {
        setError(data.error || 'حدث خطأ في جلب التقرير');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Download PDF');
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogTitle className="sr-only">جاري تحميل التقرير</DialogTitle>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">خطأ</DialogTitle>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!shiftId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حالة الوردية</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-bold mb-2">لا توجد وردية مفتوحة</h3>
            <p className="text-muted-foreground mb-4">يجب فتح وردية جديدة للبدء في العمل</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                فتح وردية
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 print:max-w-none print:max-h-none">
        <div className="sticky top-0 bg-white dark:bg-gray-950 z-10 border-b px-6 py-4 print:static">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  report.isOpen ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900"
                )}>
                  <FileText className={cn(
                    "h-6 w-6",
                    report.isOpen ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                  )} />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {report.isOpen ? 'ملخص الوردية الحالية' : `تقرير Z - ${report.zNumberFormatted}`}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {report.isOpen ? 'الوردية مفتوحة' : formatDate(report.reportDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 ml-1" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 ml-1" />
                  تحميل
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex gap-1 mt-4 print:hidden">
            {[
              { key: 'summary', label: 'الملخص' },
              { key: 'invoices', label: 'الفواتير' },
              { key: 'products', label: 'المنتجات' },
              { key: 'expenses', label: 'المصروفات' },
            ].map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-180px)] print:h-auto print:overflow-visible">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">الكاشير</span>
                </div>
                <p className="font-medium">{report.shift.user.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">الفرع</span>
                </div>
                <p className="font-medium">{report.shift.branch.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">المدة</span>
                </div>
                <p className="font-medium">{formatDuration(report.shift.duration)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm">الفواتير</span>
                </div>
                <p className="font-medium">{report.stats.completedInvoices}</p>
              </div>
            </div>

            {activeTab === 'summary' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm">إجمالي المبيعات</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(report.stats.totalSales)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-sm">المرتجعات</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {formatCurrency(report.stats.totalReturns)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50 dark:bg-orange-950">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm">المصروفات</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {formatCurrency(report.stats.totalExpenses)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Package className="h-5 w-5" />
                      <span className="text-sm">المنتجات المباعة</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {report.products.quantity}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    تفاصيل المدفوعات
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>طريقة الدفع</TableHead>
                          <TableHead className="text-center">عدد العمليات</TableHead>
                          <TableHead className="text-center">المبيعات</TableHead>
                          <TableHead className="text-center">المرتجعات</TableHead>
                          <TableHead className="text-left">الصافي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(report.payments.breakdown).map(([code, data]) => (
                          <TableRow key={code}>
                            <TableCell className="font-medium">{data.nameAr}</TableCell>
                            <TableCell className="text-center">{data.count}</TableCell>
                            <TableCell className="text-center text-green-600">
                              {formatCurrency(data.amount)}
                            </TableCell>
                            <TableCell className="text-center text-red-600">
                              {data.returns > 0 ? `-${formatCurrency(data.returns)}` : '-'}
                            </TableCell>
                            <TableCell className="text-left font-medium">
                              {formatCurrency(data.amount - data.returns)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                          <TableCell>الإجمالي</TableCell>
                          <TableCell className="text-center">
                            {Object.values(report.payments.breakdown).reduce((sum, p) => sum + p.count, 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatCurrency(report.stats.totalSales)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatCurrency(report.stats.totalReturns)}
                          </TableCell>
                          <TableCell className="text-left">
                            {formatCurrency(report.stats.totalSales - report.stats.totalReturns)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    ملخص النقدية
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">الافتتاحية</p>
                      <p className="text-lg font-bold">{formatCurrency(report.cash.opening)}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">مبيعات نقدية</p>
                      <p className="text-lg font-bold text-green-600">+{formatCurrency(report.cash.sales)}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">مرتجعات نقدية</p>
                      <p className="text-lg font-bold text-red-600">-{formatCurrency(report.cash.returns)}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">مصروفات</p>
                      <p className="text-lg font-bold text-orange-600">-{formatCurrency(report.cash.expenses)}</p>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-950">
                      <p className="text-sm text-muted-foreground">النقد المتوقع</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(report.cash.expected)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-purple-300 bg-purple-50 dark:bg-purple-950">
                      <p className="text-sm text-muted-foreground">النقد الفعلي</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {formatCurrency(report.cash.actual)}
                      </p>
                    </div>
                  </div>
                  
                  {Math.abs(report.cash.variance) > 0.01 && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      report.cash.variance > 0 
                        ? 'bg-green-100 dark:bg-green-900 border border-green-300' 
                        : 'bg-red-100 dark:bg-red-900 border border-red-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        {report.cash.variance > 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {report.cash.variance > 0 ? 'فائض: ' : 'عجز: '}
                          {formatCurrency(Math.abs(report.cash.variance))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    إحصائيات الفواتير
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg border flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">مكتملة</p>
                        <p className="text-xl font-bold">{report.stats.completedInvoices}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border flex items-center gap-3">
                      <TrendingDown className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">مرتجعات</p>
                        <p className="text-xl font-bold">{report.stats.returnInvoices}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-gray-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">ملغية</p>
                        <p className="text-xl font-bold">{report.stats.cancelledInvoices}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">متوسط الفاتورة</p>
                        <p className="text-xl font-bold">{formatCurrency(report.stats.avgInvoice)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'invoices' && (
              <>
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    الفواتير المكتملة ({report.invoices.completed.length})
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الفاتورة</TableHead>
                          <TableHead>الوقت</TableHead>
                          <TableHead>العميل</TableHead>
                          <TableHead>طريقة الدفع</TableHead>
                          <TableHead className="text-center">الخصم</TableHead>
                          <TableHead className="text-left">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.invoices.completed.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              لا توجد فواتير مكتملة
                            </TableCell>
                          </TableRow>
                        ) : (
                          report.invoices.completed.map(invoice => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono">{invoice.number}</TableCell>
                              <TableCell>{format(new Date(invoice.time), 'HH:mm', { locale: ar })}</TableCell>
                              <TableCell>{invoice.customer || '-'}</TableCell>
                              <TableCell>{invoice.paymentMethod}</TableCell>
                              <TableCell className="text-center">
                                {invoice.discount > 0 ? formatCurrency(invoice.discount) : '-'}
                              </TableCell>
                              <TableCell className="text-left font-medium">
                                {formatCurrency(invoice.total)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {report.invoices.returns.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      فواتير المرتجعات ({report.invoices.returns.length})
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم الفاتورة</TableHead>
                            <TableHead>الوقت</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.invoices.returns.map(invoice => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono">{invoice.number}</TableCell>
                              <TableCell>{format(new Date(invoice.time), 'HH:mm', { locale: ar })}</TableCell>
                              <TableCell className="text-left font-medium text-red-600">
                                -{formatCurrency(invoice.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'products' && (
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  المنتجات المباعة ({report.products.items.length} منتج)
                </h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الباركود</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">عدد المرات</TableHead>
                        <TableHead className="text-left">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.products.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            لا توجد منتجات مباعة
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.products.items.slice(0, 50).map(product => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {product.barcode || '-'}
                            </TableCell>
                            <TableCell className="text-center">{product.quantity}</TableCell>
                            <TableCell className="text-center">{product.count}</TableCell>
                            <TableCell className="text-left font-medium">
                              {formatCurrency(product.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  المصروفات ({report.expenses.list.length})
                </h3>
                
                {report.expenses.byCategory.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {report.expenses.byCategory.map((cat, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">{cat.name}</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(cat.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{cat.count} عملية</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفئة</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الوقت</TableHead>
                        <TableHead className="text-left">المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.expenses.list.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            لا توجد مصروفات
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.expenses.list.map((expense: any) => (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.category?.nameAr || expense.category?.name || '-'}</TableCell>
                            <TableCell>{expense.description || '-'}</TableCell>
                            <TableCell>{format(new Date(expense.date), 'HH:mm', { locale: ar })}</TableCell>
                            <TableCell className="text-left font-medium text-orange-600">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {report.notes && (
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">ملاحظات:</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{report.notes}</p>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground border-t pt-4 print:mt-8">
              <p>تم إنشاء التقرير: {formatDate(report.generatedAt)}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
