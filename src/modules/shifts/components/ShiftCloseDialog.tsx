'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Calculator,
  Check,
  DollarSign,
  Printer,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';

interface ShiftCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  openingCash: number;
  expectedCash: number;
  cashSales: number;
  totalExpenses: number;
  cashReturns: number;
  onCloseSuccess: (data: {
    closingNumber: number;
    expectedCash: number;
    actualCash: number;
    variance: number;
  }) => void;
}

export function ShiftCloseDialog({
  open,
  onOpenChange,
  shiftId,
  openingCash,
  expectedCash: initialExpectedCash,
  cashSales,
  totalExpenses,
  cashReturns,
  onCloseSuccess,
}: ShiftCloseDialogProps) {
  const { currency } = useAppStore();
  const [actualCash, setActualCash] = useState<number>(0);
  const [varianceReason, setVarianceReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedCash = openingCash + cashSales - cashReturns - totalExpenses;
  const variance = actualCash - expectedCash;
  const hasVariance = Math.abs(variance) > 0.01;

  const handleClose = async () => {
    if (hasVariance && !varianceReason.trim()) {
      setError('يجب إدخال سبب الفرق');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          actualCash,
          varianceReason: varianceReason.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء الإغلاق');
        return;
      }

      onCloseSuccess(data.data);
      onOpenChange(false);
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActualCash(0);
    setVarianceReason('');
    setNotes('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            إغلاق الوردية
          </DialogTitle>
          <DialogDescription>
            قم بإدخال العد النقدي الفعلي لإغلاق الوردية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الرصيد الافتتاحي</span>
                <span className="font-medium">{formatCurrency(openingCash, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ مبيعات نقدية</span>
                <span className="font-medium text-green-600">{formatCurrency(cashSales, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- مرتجعات نقدية</span>
                <span className="font-medium text-red-600">-{formatCurrency(cashReturns, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- مصروفات</span>
                <span className="font-medium text-red-600">-{formatCurrency(totalExpenses, currency)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">= النقد المتوقع</span>
                <span className="font-bold">{formatCurrency(expectedCash, currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actual Cash Input */}
          <div className="space-y-2">
            <Label htmlFor="actualCash" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              العد النقدي الفعلي
            </Label>
            <Input
              id="actualCash"
              type="number"
              step="0.01"
              value={actualCash || ''}
              onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
              placeholder="أدخل المبلغ الفعلي"
              className="text-lg"
            />
          </div>

          {/* Variance Display */}
          {actualCash > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-lg",
                hasVariance ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">الفرق</span>
                <span className={cn(
                  "text-xl font-bold",
                  hasVariance ? "text-red-600" : "text-green-600"
                )}>
                  {formatCurrency(variance, currency)}
                </span>
              </div>
              {!hasVariance && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  الصندوق متوازن
                </p>
              )}
            </motion.div>
          )}

          {/* Variance Reason */}
          {hasVariance && (
            <div className="space-y-2">
              <Label htmlFor="varianceReason" className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                سبب الفرق (إجباري)
              </Label>
              <Textarea
                id="varianceReason"
                value={varianceReason}
                onChange={(e) => setVarianceReason(e.target.value)}
                placeholder="أدخل سبب الفرق..."
                rows={2}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleClose} disabled={loading || actualCash === 0}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                جاري الإغلاق...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                تأكيد الإغلاق
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
