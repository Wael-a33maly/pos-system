// ============================================
// ProductCard Component - بطاقة المنتج (عرض الشبكة)
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/store';
import type { Product, POSSettings } from '../types/pos.types';

interface ProductCardProps {
  product: Product;
  settings: POSSettings;
  currency: { symbol: string } | null;
  onAddToCart: (product: Product) => void;
}

/**
 * مكون بطاقة المنتج - يعرض المنتج في وضع الشبكة
 * يدعم التخصيص الكامل عبر الإعدادات
 */
const ProductCard = memo(function ProductCard({
  product,
  settings,
  currency,
  onAddToCart,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
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
        <CardContent
          className="flex flex-col h-full"
          style={{ padding: settings.cardPadding }}
        >
          {/* صورة المنتج */}
          {settings.showProductImage && (
            <>
              <div
                className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden"
                style={{ borderRadius: settings.cardBorderRadius - 2 }}
              >
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <Separator className="mb-2" />
            </>
          )}

          {/* اسم المنتج */}
          {settings.showProductName && (
            <p
              className="font-bold truncate mb-1"
              style={{
                fontSize: settings.productNameFontSize,
                color: settings.productNameColor,
              }}
            >
              {product.name}
            </p>
          )}

          {/* الباركود */}
          {settings.showProductBarcode && (
            <p
              className="truncate mb-2"
              style={{
                fontSize: settings.productBarcodeFontSize,
                color: settings.productBarcodeColor,
              }}
            >
              {product.barcode}
            </p>
          )}

          {/* الخط الفاصل */}
          <Separator className="my-2" />

          {/* السعر */}
          {settings.showProductPrice && (
            <p
              className="font-bold mt-auto"
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

export { ProductCard };
