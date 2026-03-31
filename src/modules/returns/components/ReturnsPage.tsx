'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Plus,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
  Printer,
  Eye,
  Trash2,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';
import type { ReturnRequest, ReturnStatus, ReturnReason, RefundMethod, ReturnsStats, CreateReturnRequest } from '@/types/returns';
import {
  returnReasonLabels,
  returnStatusLabels,
  refundMethodLabels,
} from '@/types/returns';

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconColor,
  delay = 0,
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
        <div className={cn('absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity', gradient)} />
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
              className={cn('p-3 rounded-xl', gradient)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className={cn('h-6 w-6', iconColor)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
function ReturnsSkeleton() {
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

// Status Badge Component
function StatusBadge({ status }: { status: ReturnStatus }) {
  const info = returnStatusLabels[status];
  const icons = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
    COMPLETED: FileText,
  };
  const Icon = icons[status];

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', info.bgColor, info.color)}
    >
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  );
}

// Return Details Component
function ReturnDetails({
  returnRequest,
  onClose,
  onApprove,
  onReject,
}: {
  returnRequest: ReturnRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { currency } = useAppStore();

  if (!returnRequest) return null;

  const canProcess = returnRequest.status === 'PENDING';

  return (
    <Dialog open={!!returnRequest} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            تفاصيل المرتجع {returnRequest.returnNumber}
          </DialogTitle>
          <DialogDescription>
            {new Date(returnRequest.createdAt).toLocaleString('ar-SA')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* معلومات أساسية */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">رقم المرتجع</p>
                <p className="font-medium">{returnRequest.returnNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الفاتورة الأصلية</p>
                <p className="font-medium">
                  {returnRequest.originalInvoice?.invoiceNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <StatusBadge status={returnRequest.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السبب</p>
                <p className="font-medium">
                  {returnReasonLabels[returnRequest.reason]?.label || returnRequest.reason}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">طريقة الاسترداد</p>
                <p className="font-medium">
                  {refundMethodLabels[returnRequest.refundMethod]?.label || returnRequest.refundMethod}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                <p className="font-bold text-lg text-primary">
                  {formatCurrency(returnRequest.totalAmount, currency)}
                </p>
              </div>
            </div>

            {returnRequest.notes && (
              <div>
                <p className="text-sm text-muted-foreground">ملاحظات</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  {returnRequest.notes}
                </p>
              </div>
            )}

            <Separator />

            {/* المنتجات المرتجعة */}
            <div>
              <h4 className="font-medium mb-3">المنتجات المرتجعة</h4>
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
                  {returnRequest.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">
                              {item.variant.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice, currency)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.totalAmount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* معلومات المعالجة */}
            {returnRequest.processedByUser && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">تمت المعالجة بواسطة</p>
                  <p className="font-medium">{returnRequest.processedByUser.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">تاريخ المعالجة</p>
                  <p className="font-medium">
                    {returnRequest.processedAt &&
                      new Date(returnRequest.processedAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          {canProcess && (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-rose-600 hover:text-rose-700"
                onClick={() => onReject(returnRequest.id)}
              >
                <XCircle className="h-4 w-4" />
                رفض
              </Button>
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onApprove(returnRequest.id)}
              >
                <CheckCircle className="h-4 w-4" />
                موافقة
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create Return Dialog
function CreateReturnDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReturnRequest) => void;
}) {
  const { user, currentBranch } = useAppStore();
  const [step, setStep] = useState(1);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [reason, setReason] = useState<ReturnReason>('OTHER');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('CASH');
  const [notes, setNotes] = useState('');
  const { currency } = useAppStore();

  // البحث عن الفواتير
  const searchInvoices = async (query: string) => {
    if (!query) {
      setInvoices([]);
      return;
    }
    try {
      const res = await fetch(`/api/invoices?search=${query}&status=COMPLETED`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Search invoices error:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchInvoices(searchInvoice), 300);
    return () => clearTimeout(timer);
  }, [searchInvoice]);

  const handleSelectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setSelectedItems(
      invoice.items.map((item: any) => ({
        ...item,
        returnQuantity: item.quantity,
        selected: false,
      }))
    );
    setStep(2);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, returnQuantity: quantity } : item
      )
    );
  };

  const handleSubmit = () => {
    const itemsToReturn = selectedItems.filter((item) => item.selected);
    if (itemsToReturn.length === 0) return;

    onSubmit({
      originalInvoiceId: selectedInvoice.id,
      customerId: selectedInvoice.customerId,
      items: itemsToReturn.map((item) => ({
        invoiceItemId: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
        reason,
        notes,
      })),
      reason,
      refundMethod,
      notes,
    });

    // Reset
    setStep(1);
    setSearchInvoice('');
    setSelectedInvoice(null);
    setSelectedItems([]);
    setReason('OTHER');
    setRefundMethod('CASH');
    setNotes('');
    onClose();
  };

  const totalAmount = selectedItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            إنشاء مرتجع جديد
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'اختر الفاتورة الأصلية' : step === 2 ? 'اختر المنتجات للإرجاع' : 'حدد تفاصيل المرتجع'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الفاتورة..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="pr-10"
                />
              </div>

              {invoices.length > 0 ? (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <Card
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectInvoice(invoice)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold">
                              {formatCurrency(invoice.totalAmount, currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.items?.length || 0} منتج
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchInvoice ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لم يتم العثور على فواتير</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>أدخل رقم الفاتورة للبحث</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                <div>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    المجموع: {formatCurrency(selectedInvoice.totalAmount, currency)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  تغيير
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية الأصلية</TableHead>
                    <TableHead>الكمية للإرجاع</TableHead>
                    <TableHead>السعر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItem(item.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={item.returnQuantity}
                          onChange={(e) =>
                            updateReturnQuantity(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-20"
                          disabled={!item.selected}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  السابق
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedItems.filter((i) => i.selected).length === 0}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">سبب الإرجاع</label>
                  <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(returnReasonLabels).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">طريقة الاسترداد</label>
                  <Select
                    value={refundMethod}
                    onValueChange={(v) => setRefundMethod(v as RefundMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(refundMethodLabels).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none"
                  placeholder="أضف ملاحظات إضافية..."
                />
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">المبلغ الإجمالي للمرتجع:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount, currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  السابق
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  إنشاء المرتجع
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Main Returns Page Component
export function ReturnsPage() {
  const { currency, user } = useAppStore();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<ReturnsStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  useEffect(() => {
    fetchReturns();
  }, [statusFilter, reasonFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (reasonFilter !== 'all') params.append('reason', reasonFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/returns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async (data: CreateReturnRequest) => {
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        fetchReturns();
      }
    } catch (error) {
      console.error('Create return error:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          processedBy: user?.id,
        }),
      });

      if (res.ok) {
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch (error) {
      console.error('Approve return error:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          processedBy: user?.id,
        }),
      });

      if (res.ok) {
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch (error) {
      console.error('Reject return error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرتجع؟')) return;

    try {
      const res = await fetch(`/api/returns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReturns();
      }
    } catch (error) {
      console.error('Delete return error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <ReturnsSkeleton />
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
            المرتجعات
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <RotateCcw className="h-4 w-4" />
            إدارة طلبات المرتجعات
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
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              مرتجع جديد
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="إجمالي المرتجعات"
          value={stats.total}
          icon={RotateCcw}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
          delay={0}
        />
        <StatsCard
          title="قيد المراجعة"
          value={stats.pending}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          iconColor="text-white"
          delay={0.1}
        />
        <StatsCard
          title="موافق عليه"
          value={stats.approved}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          iconColor="text-white"
          delay={0.2}
        />
        <StatsCard
          title="المبلغ المعلق"
          value={formatCurrency(stats.pendingAmount, currency)}
          icon={AlertCircle}
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
            placeholder="بحث برقم المرتجع أو الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-background/50"
            onKeyDown={(e) => e.key === 'Enter' && fetchReturns()}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="PENDING">قيد المراجعة</SelectItem>
            <SelectItem value="APPROVED">موافق عليه</SelectItem>
            <SelectItem value="REJECTED">مرفوض</SelectItem>
            <SelectItem value="COMPLETED">مكتمل</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue placeholder="السبب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأسباب</SelectItem>
            {Object.entries(returnReasonLabels).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={fetchReturns}>
          <Filter className="h-4 w-4" />
          بحث
        </Button>
      </motion.div>

      {/* Returns Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {returns.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <RotateCcw className="h-16 w-16 mb-4 opacity-50" />
                </motion.div>
                <p className="text-lg font-medium">لا توجد مرتجعات</p>
                <p className="text-sm">جرب تغيير البحث أو الفلتر</p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>رقم المرتجع</TableHead>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {returns.map((ret, index) => (
                      <TableRow
                        key={ret.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedReturn(ret as any)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30"
                              whileHover={{ scale: 1.1 }}
                            >
                              <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </motion.div>
                            <span className="font-medium">{ret.returnNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ret.originalInvoice?.invoiceNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            {new Date(ret.createdAt).toLocaleDateString('ar-SA')}
                            <p className="text-xs text-muted-foreground">
                              {new Date(ret.createdAt).toLocaleTimeString('ar-SA')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {returnReasonLabels[ret.reason]?.label || ret.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(ret.totalAmount, currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ret.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedReturn(ret as any)}>
                                <Eye className="ml-2 h-4 w-4" />
                                عرض
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="ml-2 h-4 w-4" />
                                طباعة
                              </DropdownMenuItem>
                              {ret.status === 'PENDING' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-rose-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(ret.id);
                                    }}
                                  >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Return Details Dialog */}
      <ReturnDetails
        returnRequest={selectedReturn}
        onClose={() => setSelectedReturn(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Create Return Dialog */}
      <CreateReturnDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateReturn}
      />
    </div>
  );
}
