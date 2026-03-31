// ============================================
// ProductListItem Component - عنصر قائمة المنتج
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/store';
import type { Product, POSSettings } from '../types/pos.types';

interface ProductListItemProps {
  product: Product;
  settings: POSSettings;
  currency: { symbol: string } | null;
  onAddToCart: (product: Product) => void;
}

/**
 * مكون عنصر قائمة المنتج - يعرض المنتج في وضع القائمة
 * مناسب للشاشات الضيقة أو عند تفضيل عرض القائمة
 */
const ProductListItem = memo(function ProductListItem({
  product,
  settings,
  currency,
  onAddToCart,
}: ProductListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className="cursor-pointer transition-all hover:shadow-lg"
        style={{
          borderWidth: settings.cardBorderWidth,
          borderColor: settings.cardBorderColor,
          borderRadius: settings.cardBorderRadius,
        }}
        onClick={() => onAddToCart(product)}
      >
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.showProductImage && (
              <div
                className="w-12 h-12 bg-muted rounded-md flex items-center justify-center"
                style={{ borderRadius: settings.cardBorderRadius - 2 }}
              >
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              {settings.showProductName && (
                <p
                  className="font-bold"
                  style={{
                    fontSize: settings.productNameFontSize,
                    color: settings.productNameColor,
                  }}
                >
                  {product.name}
                </p>
              )}
              {settings.showProductBarcode && (
                <p
                  className="text-sm"
                  style={{
                    fontSize: settings.productBarcodeFontSize,
                    color: settings.productBarcodeColor,
                  }}
                >
                  {product.barcode}
                </p>
              )}
            </div>
          </div>
          {settings.showProductPrice && (
            <p
              className="font-bold"
              style={{
                fontSize: settings.productPriceFontSize,
                color: settings.productPriceColor,
              }}
            >
              {formatCurrency(product.sellingPrice, currency)}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export { ProductListItem };
