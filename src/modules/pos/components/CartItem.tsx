// ============================================
// CartItem Component - عنصر السلة
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/store';
import type { CartItem as CartItemType } from '../types/pos.types';

interface CartItemProps {
  item: CartItemType;
  currency: { symbol: string } | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

/**
 * مكون عنصر السلة - يعرض منتج واحد في السلة
 * مع إمكانية تعديل الكمية والحذف
 */
const CartItemComponent = memo(function CartItem({
  item,
  currency,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="border-b last:border-b-0 py-2"
    >
      {/* صف المنتج */}
      <div className="flex items-center gap-2">
        {/* الاسم والسعر */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.productName}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.unitPrice, currency)} × {item.quantity}
          </p>
        </div>

        {/* التحكم في الكمية */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 1)}
            className="w-12 h-6 text-center text-xs p-0"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* الإجمالي */}
        <p className="font-bold text-sm w-20 text-left">
          {formatCurrency(item.totalAmount, currency)}
        </p>

        {/* حذف */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
});

export { CartItemComponent as CartItem };
