// ============================================
// POSDialogs Component - مجموعة نوافذ نقطة البيع
// ============================================

import { memo, useState } from 'react';
import { UserPlus, Wallet, Check, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/store';
import type { PendingInvoice, ExpenseCategory, Customer } from '../types/pos.types';
import { expenseCategories as defaultExpenseCategories } from '../constants/defaults';

// ============================================
// Pending Invoices Dialog
// ============================================

interface PendingInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingInvoices: PendingInvoice[];
  onRestore: (invoice: PendingInvoice) => void;
  onDelete: (id: string) => void;
}

const PendingInvoicesDialog = memo(function PendingInvoicesDialog({
  open,
  onOpenChange,
  pendingInvoices,
  onRestore,
  onDelete,
}: PendingInvoicesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>الفواتير المعلقة</DialogTitle>
          <DialogDescription>
            اختر فاتورة لاستعادتها أو حذفها
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {pendingInvoices.length > 0 ? (
            <div className="space-y-2">
              {pendingInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.items.length} صنف - {new Date(invoice.createdAt).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(invoice)}
                      >
                        استعادة
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(invoice.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد فواتير معلقة</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// Return Invoice Dialog
// ============================================

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (number: string) => void;
  onSearch: () => void;
}

const ReturnDialog = memo(function ReturnDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onInvoiceNumberChange,
  onSearch,
}: ReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مرتجع فاتورة</DialogTitle>
          <DialogDescription>
            أدخل رقم الفاتورة للمرتجع
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="رقم الفاتورة"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSearch}>
            بحث
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// Expense Dialog
// ============================================

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: { symbol: string } | null;
  expenseCategories?: ExpenseCategory[];
  expenseCategoryId: string;
  expenseAmount: number;
  expenseDescription: string;
  onCategoryChange: (categoryId: string) => void;
  onAmountChange: (amount: number) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
}

const ExpenseDialog = memo(function ExpenseDialog({
  open,
  onOpenChange,
  currency,
  expenseCategories = defaultExpenseCategories,
  expenseCategoryId,
  expenseAmount,
  expenseDescription,
  onCategoryChange,
  onAmountChange,
  onDescriptionChange,
  onSave,
}: ExpenseDialogProps) {
  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      onAmountChange(0);
      onDescriptionChange('');
      onCategoryChange('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" />
            إضافة مصروف
          </DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المصروف الجديد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* فئة المصروف */}
          <div className="space-y-2">
            <Label>فئة المصروف</Label>
            <Select value={expenseCategoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameAr || category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* المبلغ */}
          <div className="space-y-2">
            <Label>المبلغ</Label>
            <div className="relative">
              <Input
                type="number"
                value={expenseAmount || ''}
                onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pr-16"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Badge variant="secondary">{currency?.symbol || 'ر.س'}</Badge>
              </div>
            </div>
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label>الوصف (اختياري)</Label>
            <Input
              value={expenseDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="وصف المصروف..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            إلغاء
          </Button>
          <Button
            onClick={onSave}
            disabled={!expenseCategoryId || expenseAmount <= 0}
          >
            <Check className="h-4 w-4 ml-1" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// Shift Dialog
// ============================================

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: { symbol: string } | null;
  shiftSummary?: {
    totalSales: number;
    invoiceCount: number;
    cashSales: number;
    cardSales: number;
  };
}

const ShiftDialog = memo(function ShiftDialog({
  open,
  onOpenChange,
  currency,
  shiftSummary = {
    totalSales: 12500,
    invoiceCount: 45,
    cashSales: 8500,
    cardSales: 4000,
  },
}: ShiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تفاصيل الوردية</DialogTitle>
          <DialogDescription>
            ملخص مبيعات الوردية الحالية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">مبيعات اليوم</p>
              <p className="text-2xl font-bold">{formatCurrency(shiftSummary.totalSales, currency)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">عدد الفواتير</p>
              <p className="text-2xl font-bold">{shiftSummary.invoiceCount}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">النقد</p>
              <p className="text-2xl font-bold">{formatCurrency(shiftSummary.cashSales, currency)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">البطاقات</p>
              <p className="text-2xl font-bold">{formatCurrency(shiftSummary.cardSales, currency)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// Add Customer Dialog
// ============================================

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCustomer: (name: string, phone: string) => void;
}

const AddCustomerDialog = memo(function AddCustomerDialog({
  open,
  onOpenChange,
  onAddCustomer,
}: AddCustomerDialogProps) {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const handleAdd = () => {
    if (!newCustomerName.trim()) return;
    onAddCustomer(newCustomerName, newCustomerPhone);
    setNewCustomerName('');
    setNewCustomerPhone('');
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إضافة عميل جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل الجديد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="customerName">الاسم</Label>
            <Input
              id="customerName"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="اسم العميل"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">رقم التليفون</Label>
            <Input
              id="customerPhone"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="mt-1"
              dir="ltr"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAdd} disabled={!newCustomerName.trim()}>
            <Check className="h-4 w-4 ml-1" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export {
  PendingInvoicesDialog,
  ReturnDialog,
  ExpenseDialog,
  ShiftDialog,
  AddCustomerDialog,
};
