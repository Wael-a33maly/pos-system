// ============================================
// ProductGrid Component - شبكة المنتجات
// ============================================

import { memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { ProductListItem } from './ProductListItem';
import type { Product, POSSettings, ViewMode } from '../types/pos.types';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  settings: POSSettings;
  viewMode: ViewMode;
  currency: { symbol: string } | null;
  onAddToCart: (product: Product) => void;
}

/**
 * مكون شبكة المنتجات - يعرض المنتجات في وضع الشبكة أو القائمة
 * يدعم التمرير والاستجابة للأحجام المختلفة
 */
const ProductGrid = memo(function ProductGrid({
  products,
  settings,
  viewMode,
  currency,
  onAddToCart,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">لا توجد منتجات</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div
        className={cn(
          'p-4',
          viewMode === 'grid'
            ? 'grid gap-3'
            : 'space-y-2'
        )}
        style={viewMode === 'grid' ? {
          gridTemplateColumns: `repeat(${settings.gridViewColumns}, minmax(0, 1fr))`
        } : undefined}
      >
        {products.map((product) =>
          viewMode === 'grid' ? (
            <ProductCard
              key={product.id}
              product={product}
              settings={settings}
              currency={currency}
              onAddToCart={onAddToCart}
            />
          ) : (
            <ProductListItem
              key={product.id}
              product={product}
              settings={settings}
              currency={currency}
              onAddToCart={onAddToCart}
            />
          )
        )}
      </div>
    </ScrollArea>
  );
});

export { ProductGrid };
