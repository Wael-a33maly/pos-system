// ============================================
// Cart Component - سلة المشتريات
// ============================================

import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from './CartItem';
import type { CartItem as CartItemType } from '../types/pos.types';

interface CartProps {
  items: CartItemType[];
  currency: { symbol: string } | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

/**
 * مكون السلة - يعرض قائمة المنتجات المضافة
 * مع دعم التمرير والرسوم المتحركة
 */
const Cart = memo(function Cart({
  items,
  currency,
  onUpdateQuantity,
  onRemove,
}: CartProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        <AnimatePresence>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              currency={currency}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>السلة فارغة</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
});

export { Cart };
