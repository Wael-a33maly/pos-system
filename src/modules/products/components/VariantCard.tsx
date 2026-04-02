// ============================================
// Variant Card - بطاقة عرض المتغير
// ============================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Edit, Trash2, MoreVertical, Package, Barcode, 
  DollarSign, Archive, Eye, EyeOff, Copy, Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/store';
import type { VariantCardProps, ProductVariant } from '@/types/product-variant';

export function VariantCard({
  variant,
  onEdit,
  onDelete,
  onToggleActive,
  currency = 'SAR'
}: VariantCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyBarcode = () => {
    if (variant.barcode) {
      navigator.clipboard.writeText(variant.barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'نفذ المخزون', color: 'bg-red-500' };
    if (stock <= 10) return { label: 'مخزون منخفض', color: 'bg-amber-500' };
    return { label: 'متوفر', color: 'bg-emerald-500' };
  };

  const stockStatus = getStockStatus(variant.quantity);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        isHovered && "shadow-lg ring-1 ring-primary/20",
        !variant.isActive && "opacity-60"
      )}>
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50">
            {variant.image ? (
              <img
                src={variant.image}
                alt={variant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <Badge 
                variant="secondary" 
                className={cn("text-white text-xs", stockStatus.color)}
              >
                {stockStatus.label}
              </Badge>
            </div>

            {/* Active Toggle */}
            <div className="absolute top-2 left-2">
              <Switch
                checked={variant.isActive}
                onCheckedChange={(checked) => onToggleActive?.(variant.id, checked)}
                className="scale-75"
              />
            </div>

            {/* Overlay Actions */}
            <motion.div 
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
            >
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8"
                onClick={() => onEdit?.(variant)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8"
                onClick={() => onDelete?.(variant.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Name & SKU */}
            <div>
              <h3 className="font-semibold text-sm truncate">{variant.name}</h3>
              {variant.sku && (
                <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
              )}
            </div>

            {/* Attributes */}
            {variant.attributes && variant.attributes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {variant.attributes.map((attr, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs py-0 px-2"
                  >
                    {attr.name}: {attr.value}
                  </Badge>
                ))}
              </div>
            )}

            {/* Barcode */}
            {variant.barcode && (
              <div 
                className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={handleCopyBarcode}
              >
                <Barcode className="h-3 w-3" />
                <code className="bg-muted px-1.5 py-0.5 rounded">
                  {variant.barcode}
                </code>
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </div>
            )}

            {/* Price & Stock Row */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(variant.price, currency)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Archive className="h-3.5 w-3.5" />
                <span>{variant.quantity}</span>
              </div>
            </div>

            {/* Cost Price */}
            <div className="text-xs text-muted-foreground">
              التكلفة: {formatCurrency(variant.costPrice, currency)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Compact Variant Card for List View
export function VariantCardCompact({
  variant,
  onEdit,
  onDelete,
  onToggleActive,
  currency = 'SAR'
}: VariantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
        !variant.isActive && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {variant.image ? (
          <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{variant.name}</h4>
          {!variant.isActive && <EyeOff className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {variant.sku && <span>SKU: {variant.sku}</span>}
          {variant.barcode && (
            <code className="bg-muted px-1 rounded">{variant.barcode}</code>
          )}
        </div>
      </div>

      {/* Attributes */}
      {variant.attributes && variant.attributes.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {variant.attributes.map((attr, index) => (
            <Badge key={index} variant="outline" className="text-xs py-0">
              {attr.value}
            </Badge>
          ))}
        </div>
      )}

      {/* Price & Stock */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
          {formatCurrency(variant.price, currency)}
        </p>
        <p className="text-xs text-muted-foreground">مخزون: {variant.quantity}</p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(variant)}>
            <Edit className="ml-2 h-4 w-4" /> تعديل
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleActive?.(variant.id, !variant.isActive)}>
            {variant.isActive ? (
              <>
                <EyeOff className="ml-2 h-4 w-4" /> إخفاء
              </>
            ) : (
              <>
                <Eye className="ml-2 h-4 w-4" /> إظهار
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => onDelete?.(variant.id)}
          >
            <Trash2 className="ml-2 h-4 w-4" /> حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export default VariantCard;
