// ============================================
// VariationSelectionDialog - نافذة اختيار السعر
// ============================================

'use client';

import { motion } from 'framer-motion';
import { X, Tag, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/store';
import { cn } from '@/lib/utils';
import type { Product, ProductVariation, CartItem } from '../types/pos.types';

interface VariationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  currency: { symbol: string } | null;
  onSelect: (item: { variation?: ProductVariation; price: number; barcode: string }) => void;
}

/**
 * نافذة اختيار السعر للمتغيرات
 * تظهر عند النقر على منتج له متغيرات أسعار متعددة
 */
export function VariationSelectionDialog({
  open,
  onOpenChange,
  product,
  currency,
  onSelect,
}: VariationSelectionDialogProps) {
  if (!product) return null;

  const variations = product.variations || [];
  const hasBasePrice = true; // دائماً نعرض السعر الأساسي

  const handleSelect = (variation: ProductVariation | null, price: number, barcode: string) => {
    onSelect({
      variation: variation || undefined,
      price,
      barcode,
    });
    onOpenChange(false);
  };

  // حساب مخزون المنتج الأساسي
  const baseStock = product.isStockTracked 
    ? (product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            اختر السعر
          </DialogTitle>
        </DialogHeader>

        {/* معلومات المنتج */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-bold">{product.name}</p>
            <p className="text-sm text-muted-foreground">الباركود: {product.barcode}</p>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="grid grid-cols-2 gap-3">
            {/* السعر الأساسي */}
            {hasBasePrice && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(null, product.sellingPrice, product.barcode)}
                className={cn(
                  "relative p-4 border-2 rounded-xl text-right transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">السعر الأساسي</span>
                    {product.isStockTracked ? (
                      baseStock !== null && baseStock > 0 ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          متوفر
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          <AlertCircle className="h-3 w-3 ml-1" />
                          نفذ
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        مفتوح
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(product.sellingPrice, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.barcode}</p>
                </div>
              </motion.button>
            )}

            {/* المتغيرات */}
            {variations.map((variation, index) => {
              const isAvailable = !variation.isStockTracked || variation.stock > 0;
              
              return (
                <motion.button
                  key={variation.id || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index + 1) * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(variation, variation.price, variation.barcode)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative p-4 border-2 rounded-xl text-right transition-all",
                    isAvailable 
                      ? "hover:border-primary hover:bg-primary/5 cursor-pointer"
                      : "opacity-50 cursor-not-allowed bg-muted/30",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {variation.name || `سعر ${index + 1}`}
                      </span>
                      {variation.isStockTracked ? (
                        variation.stock > 0 ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            {variation.stock}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            نفذ
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          مفتوح
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(variation.price, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{variation.barcode}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
