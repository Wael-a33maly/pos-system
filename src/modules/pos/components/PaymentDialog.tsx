// ============================================
// PaymentDialog Component - نافذة الدفع
// ============================================

import { memo } from 'react';
import { MoreHorizontal, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/store';
import { cn } from '@/lib/utils';
import type { PaymentEntry, PaymentMethod, POSSettings } from '../types/pos.types';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  currency: { symbol: string } | null;
  settings: POSSettings;
  // Single payment
  selectedPaymentMethod: string;
  paidAmount: number;
  paymentMethods: PaymentMethod[];
  onPaymentMethodChange: (methodId: string) => void;
  onPaidAmountChange: (amount: number) => void;
  // Multi payment
  isMultiPayment: boolean;
  payments: PaymentEntry[];
  totalPaid: number;
  onToggleMultiPayment: () => void;
  onAddPaymentMethod: (methodId: string) => void;
  onUpdatePaymentAmount: (id: string, amount: number) => void;
  onRemovePayment: (id: string) => void;
  // Actions
  onPayment: () => void;
  onReset: () => void;
}

/**
 * مكون نافذة الدفع - يدعم الدفع الفردي والمتعدد
 */
const PaymentDialog = memo(function PaymentDialog({
  open,
  onOpenChange,
  total,
  currency,
  settings,
  selectedPaymentMethod,
  paidAmount,
  paymentMethods,
  onPaymentMethodChange,
  onPaidAmountChange,
  isMultiPayment,
  payments,
  totalPaid,
  onToggleMultiPayment,
  onAddPaymentMethod,
  onUpdatePaymentAmount,
  onRemovePayment,
  onPayment,
  onReset,
}: PaymentDialogProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      onReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>طريقة الدفع</span>
            {settings.allowMultiPayment && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleMultiPayment}
              >
                <MoreHorizontal className="h-4 w-4 ml-1" />
                {isMultiPayment ? 'دفع واحد' : 'دفع متعدد'}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            المبلغ المطلوب:{' '}
            <span className="font-bold text-foreground">
              {formatCurrency(total, currency)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!isMultiPayment ? (
          /* الدفع بطريقة واحدة */
          <>
            <div className="grid grid-cols-3 gap-3 py-4">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedPaymentMethod === method.id ? 'default' : 'outline'}
                  className="h-16 flex-col gap-1"
                  onClick={() => onPaymentMethodChange(method.id)}
                >
                  <span className={cn('text-lg', method.color)}>💳</span>
                  <span className="text-xs">{method.name}</span>
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">المبلغ المدفوع</label>
                <Input
                  type="number"
                  value={paidAmount || total}
                  onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  placeholder="أدخل المبلغ"
                />
              </div>
              {paidAmount >= total && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">الباقي</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(paidAmount - total, currency)}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* الدفع المتعدد */
          <div className="space-y-4 py-4">
            {/* طرق الدفع المضافة */}
            {payments.length > 0 && (
              <div className="space-y-2">
                {payments.map((payment) => {
                  const method = paymentMethods.find(m => m.id === payment.methodId);
                  return (
                    <div key={payment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <span className={cn('text-sm', method?.color)}>💳</span>
                      <span className="text-sm flex-1">{method?.name}</span>
                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => onUpdatePaymentAmount(payment.id, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-left"
                      />
                      <span className="text-xs">{currency?.symbol}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onRemovePayment(payment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* إضافة طريقة دفع */}
            {totalPaid < total && (
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods
                  .filter(m => !payments.some(p => p.methodId === m.id) || payments.length < 3)
                  .map((method) => (
                    <Button
                      key={method.id}
                      variant="outline"
                      size="sm"
                      className="h-10 flex-col gap-0"
                      onClick={() => onAddPaymentMethod(method.id)}
                    >
                      <span className={cn('text-sm', method.color)}>💳</span>
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  ))}
              </div>
            )}

            {/* المدفوع */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">المدفوع</span>
              <span className="font-bold">{formatCurrency(totalPaid, currency)}</span>
            </div>

            {/* المتبقي */}
            {totalPaid < total && (
              <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <span className="text-sm text-muted-foreground">المتبقي</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(total - totalPaid, currency)}
                </span>
              </div>
            )}

            {/* الباقي */}
            {totalPaid >= total && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm text-muted-foreground">الباقي</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalPaid - total, currency)}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={onPayment}
            disabled={isMultiPayment ? totalPaid < total : paidAmount < total}
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة الفاتورة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export { PaymentDialog };
