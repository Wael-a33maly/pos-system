// ============================================
// CartFooter Component - تذييل السلة
// ============================================

import { memo } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/store';
import type { POSSettings } from '../types/pos.types';

interface CartFooterProps {
  subtotal: number;
  total: number;
  discountAmount: number;
  currency: { symbol: string } | null;
  settings: POSSettings;
  itemCount: number;
  hasItems: boolean;
  onDiscountChange: (amount: number) => void;
  onHold: () => void;
  onClear: () => void;
  onPayment: () => void;
}

/**
 * مكون تذييل السلة - يعرض المجاميع وأزرار الإجراءات
 */
const CartFooter = memo(function CartFooter({
  subtotal,
  total,
  discountAmount,
  currency,
  settings,
  itemCount,
  hasItems,
  onDiscountChange,
  onHold,
  onClear,
  onPayment,
}: CartFooterProps) {
  return (
    <div className="p-4 border-t space-y-3">
      {/* الخصم */}
      {settings.showDiscount && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الخصم</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-20 h-8 text-left"
            />
            <span>{currency?.symbol}</span>
          </div>
        </div>
      )}

      {settings.showDiscount && <Separator />}

      {/* المجاميع */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        {settings.showDiscount && discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الخصم</span>
            <span className="text-red-500">-{formatCurrency(discountAmount, currency)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xl font-bold">
          <span>الإجمالي</span>
          <span className="text-primary">{formatCurrency(total, currency)}</span>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={onHold}
          disabled={!hasItems}
        >
          تعليق
        </Button>
        <Button
          variant="outline"
          onClick={onClear}
          disabled={!hasItems}
        >
          إلغاء
        </Button>
      </div>

      <Button
        className="w-full h-12 text-lg"
        size="lg"
        onClick={onPayment}
        disabled={!hasItems}
      >
        <CreditCard className="h-5 w-5 ml-2" />
        الدفع - {formatCurrency(total, currency)}
      </Button>
    </div>
  );
});

export { CartFooter };
