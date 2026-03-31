'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  RotateCcw,
  MoreHorizontal,
  Calendar,
  FileText,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/types';

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconColor,
  delay = 0
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  delay?: number;
}) {
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
                className="text-3xl font-bold mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 }}
              >
                {value}
              </motion.p>
            </div>
            <motion.div
              className={cn("p-3 rounded-xl", gradient)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className={cn("h-6 w-6", iconColor)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <div className="animate-pulse w-8 h-8 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="animate-pulse h-4 bg-muted rounded w-1/3" />
                <div className="animate-pulse h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const statusLabels: Record<Invoice['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'معلق', variant: 'secondary', icon: Clock },
  COMPLETED: { label: 'مكتمل', variant: 'default', icon: CheckCircle },
  CANCELLED: { label: 'ملغي', variant: 'destructive', icon: XCircle },
  RETURNED: { label: 'مرتجع', variant: 'outline', icon: RotateCcw },
};

const paymentStatusLabels: Record<Invoice['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  UNPAID: { label: 'غير مدفوع', variant: 'destructive' },
  PARTIAL: { label: 'مدفوع جزئياً', variant: 'secondary' },
  PAID: { label: 'مدفوع', variant: 'default' },
};

export function InvoicesPage() {
  const { currency } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || inv.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  // Calculate stats
  const totalInvoices = invoices.length;
  const completedInvoices = invoices.filter(i => i.status === 'COMPLETED').length;
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING').length;
  const returnedInvoices = invoices.filter(i => i.isReturn).length;

  if (loading) {
    return (
      <div className="p-6">
        <InvoicesSkeleton />
      </div>
    );
  }

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
            الفواتير والمرتجعات
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Receipt className="h-4 w-4" />
            عرض وإدارة جميع الفواتير
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              تقرير
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي الفواتير"
          value={totalInvoices}
          icon={Receipt}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
          delay={0}
        />
        <StatsCard
          title="المكتملة"
          value={completedInvoices}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          iconColor="text-white"
          delay={0.1}
        />
        <StatsCard
          title="المعلقة"
          value={pendingInvoices}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          iconColor="text-white"
          delay={0.2}
        />
        <StatsCard
          title="المرتجعات"
          value={returnedInvoices}
          icon={RotateCcw}
          gradient="bg-gradient-to-br from-rose-500 to-rose-600"
          iconColor="text-white"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-background/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="COMPLETED">مكتمل</SelectItem>
            <SelectItem value="PENDING">معلق</SelectItem>
            <SelectItem value="CANCELLED">ملغي</SelectItem>
            <SelectItem value="RETURNED">مرتجع</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="الدفع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع</SelectItem>
            <SelectItem value="PAID">مدفوع</SelectItem>
            <SelectItem value="PARTIAL">مدفوع جزئياً</SelectItem>
            <SelectItem value="UNPAID">غير مدفوع</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          فلاتر إضافية
        </Button>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredInvoices.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Receipt className="h-16 w-16 mb-4 opacity-50" />
                </motion.div>
                <p className="text-lg font-medium">لا توجد فواتير</p>
                <p className="text-sm">جرب تغيير البحث أو الفلتر</p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الدفع</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices.map((invoice, index) => {
                      const statusInfo = statusLabels[invoice.status];
                      const paymentInfo = paymentStatusLabels[invoice.paymentStatus];
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => viewInvoice(invoice)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <motion.div 
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"
                                whileHover={{ scale: 1.1 }}
                              >
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </motion.div>
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              {invoice.isReturn && (
                                <Badge variant="outline" className="text-xs bg-rose-50 dark:bg-rose-900/20">مرتجع</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                              <p className="text-xs text-muted-foreground">
                                {new Date(invoice.createdAt).toLocaleTimeString('ar-SA')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.customerId || 'عميل نقدي'}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.totalAmount, currency)}
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.paidAmount, currency)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={statusInfo.variant}
                              className={cn(
                                "gap-1",
                                statusInfo.variant === 'default' && "bg-emerald-500 hover:bg-emerald-600"
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={paymentInfo.variant}
                              className={cn(
                                paymentInfo.variant === 'default' && "bg-emerald-500 hover:bg-emerald-600"
                              )}
                            >
                              {paymentInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewInvoice(invoice)}>
                                  <Eye className="ml-2 h-4 w-4" />
                                  عرض
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Printer className="ml-2 h-4 w-4" />
                                  طباعة
                                </DropdownMenuItem>
                                {!invoice.isReturn && invoice.status !== 'RETURNED' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <RotateCcw className="ml-2 h-4 w-4" />
                                      مرتجع
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              تفاصيل الفاتورة {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">رقم الفاتورة</p>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge variant={statusLabels[selectedInvoice.status].variant}>
                    {statusLabels[selectedInvoice.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العميل</p>
                  <p className="font-medium">{selectedInvoice.customerId || 'عميل نقدي'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البائع</p>
                  <p className="font-medium">المستخدم</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">المنتجات</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>منتج تجريبي</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>{formatCurrency(225, currency)}</TableCell>
                      <TableCell>{formatCurrency(450, currency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{formatCurrency(selectedInvoice.subtotal, currency)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>الخصم</span>
                    <span>-{formatCurrency(selectedInvoice.discountAmount, currency)}</span>
                  </div>
                )}
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{formatCurrency(selectedInvoice.taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.totalAmount, currency)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-gradient-to-l from-primary to-primary/80">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                {!selectedInvoice.isReturn && selectedInvoice.status !== 'RETURNED' && (
                  <Button variant="outline" className="flex-1 gap-2">
                    <RotateCcw className="h-4 w-4" />
                    مرتجع
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
