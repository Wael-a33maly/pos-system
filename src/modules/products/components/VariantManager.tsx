// ============================================
// Variant Manager - مدير المتغيرات الرئيسي
// ============================================

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, LayoutGrid, List, Search, 
  Package, Filter, AlertCircle, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '@/store';

import { VariantCard, VariantCardCompact } from './VariantCard';
import { VariantForm } from './VariantForm';
import { VariantGenerator } from './VariantGenerator';
import type { 
  VariantManagerProps, 
  ProductVariant, 
  VariantFormData,
  GeneratedVariant
} from '@/types/product-variant';

type ViewMode = 'grid' | 'list';

export function VariantManager({
  productId,
  variants,
  onVariantsChange,
  defaultPrice = 0,
  defaultCostPrice = 0,
  currency = 'SAR'
}: VariantManagerProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  // Filter variants
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = 
      variant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.barcode?.includes(searchQuery);
    
    const matchesFilter = 
      filterActive === 'all' ||
      (filterActive === 'active' && variant.isActive) ||
      (filterActive === 'inactive' && !variant.isActive);
    
    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: variants.length,
    active: variants.filter(v => v.isActive).length,
    inactive: variants.filter(v => !v.isActive).length,
    lowStock: variants.filter(v => v.quantity <= 10).length,
    outOfStock: variants.filter(v => v.quantity === 0).length,
    totalStock: variants.reduce((acc, v) => acc + v.quantity, 0),
    totalValue: variants.reduce((acc, v) => acc + (v.price * v.quantity), 0)
  };

  // Handlers
  const handleAddVariant = useCallback((data: VariantFormData) => {
    const newVariant: ProductVariant = {
      id: data.id || `new-${Date.now()}`,
      productId: productId,
      sku: data.sku,
      name: data.name,
      price: data.price,
      costPrice: data.costPrice,
      quantity: data.stock,
      attributes: data.attributes,
      image: data.image,
      barcode: data.barcode,
      isActive: data.isActive
    };
    
    onVariantsChange([...variants, newVariant]);
    setShowAddDialog(false);
    toast.success('تم إضافة المتغير بنجاح');
  }, [variants, onVariantsChange, productId]);

  const handleEditVariant = useCallback((data: VariantFormData) => {
    const updatedVariants = variants.map(v => {
      if (v.id === editingVariant?.id) {
        return {
          ...v,
          sku: data.sku,
          name: data.name,
          price: data.price,
          costPrice: data.costPrice,
          quantity: data.stock,
          attributes: data.attributes,
          image: data.image,
          barcode: data.barcode,
          isActive: data.isActive
        };
      }
      return v;
    });
    
    onVariantsChange(updatedVariants);
    setEditingVariant(null);
    toast.success('تم تحديث المتغير بنجاح');
  }, [variants, onVariantsChange, editingVariant]);

  const handleDeleteVariant = useCallback((variantId: string) => {
    const updatedVariants = variants.filter(v => v.id !== variantId);
    onVariantsChange(updatedVariants);
    toast.success('تم حذف المتغير');
  }, [variants, onVariantsChange]);

  const handleToggleActive = useCallback((variantId: string, isActive: boolean) => {
    const updatedVariants = variants.map(v => {
      if (v.id === variantId) {
        return { ...v, isActive };
      }
      return v;
    });
    onVariantsChange(updatedVariants);
    toast.success(isActive ? 'تم تفعيل المتغير' : 'تم إلغاء تفعيل المتغير');
  }, [variants, onVariantsChange]);

  const handleGenerateVariants = useCallback((generated: GeneratedVariant[]) => {
    const newVariants: ProductVariant[] = generated.map((g, index) => ({
      id: `generated-${Date.now()}-${index}`,
      productId: productId,
      sku: g.sku,
      name: g.name,
      price: g.price,
      costPrice: g.costPrice,
      quantity: g.stock,
      attributes: g.attributes,
      image: g.image,
      barcode: g.barcode,
      isActive: true
    }));
    
    onVariantsChange([...variants, ...newVariants]);
    setShowGeneratorDialog(false);
    toast.success(`تم إضافة ${newVariants.length} متغير بنجاح`);
  }, [variants, onVariantsChange, productId]);

  const openEditDialog = (variant: ProductVariant) => {
    setEditingVariant(variant);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              إدارة المتغيرات
            </CardTitle>
            <CardDescription>
              إضافة وتعديل وحذف متغيرات المنتج
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowGeneratorDialog(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              توليد تلقائي
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة متغير
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-border">
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي المتغيرات</p>
          </div>
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">نشطة</p>
          </div>
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
            <p className="text-xs text-muted-foreground">غير نشطة</p>
          </div>
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
            <p className="text-xs text-muted-foreground">مخزون منخفض</p>
          </div>
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-xs text-muted-foreground">نفذ المخزون</p>
          </div>
          <div className="bg-background p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalStock}</p>
            <p className="text-xs text-muted-foreground">إجمالي المخزون</p>
          </div>
          <div className="bg-background p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue, currency)}</p>
            <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث بالاسم أو SKU أو الباركود..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Variants Display */}
        <ScrollArea className="h-[400px]">
          {filteredVariants.length > 0 ? (
            <div className={cn(
              "p-4",
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-2"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredVariants.map((variant) => (
                  viewMode === 'grid' ? (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteVariant}
                      onToggleActive={handleToggleActive}
                      currency={currency}
                    />
                  ) : (
                    <VariantCardCompact
                      key={variant.id}
                      variant={variant}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteVariant}
                      onToggleActive={handleToggleActive}
                      currency={currency}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                {variants.length === 0 ? (
                  <Package className="h-16 w-16 mb-4 opacity-50" />
                ) : (
                  <Search className="h-16 w-16 mb-4 opacity-50" />
                )}
              </motion.div>
              <p className="text-lg font-medium">
                {variants.length === 0 ? 'لا توجد متغيرات' : 'لا توجد نتائج'}
              </p>
              <p className="text-sm">
                {variants.length === 0 
                  ? 'أضف متغيرات للمنتج أو استخدم التوليد التلقائي' 
                  : 'جرب تغيير البحث أو الفلتر'}
              </p>
              {variants.length === 0 && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowGeneratorDialog(true)}>
                    <Sparkles className="h-4 w-4 ml-2" />
                    توليد تلقائي
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة متغير
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </ScrollArea>

        {/* Quick Info Bar */}
        {variants.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-sm">
            <div className="flex items-center gap-4">
              {stats.outOfStock > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{stats.outOfStock} نفذ من المخزون</span>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{stats.lowStock} مخزون منخفض</span>
                </div>
              )}
            </div>
            <Badge variant="secondary">
              عرض {filteredVariants.length} من {variants.length}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Add Variant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>إضافة متغير جديد</DialogTitle>
            <DialogDescription>نموذج إضافة متغير جديد للمنتج</DialogDescription>
          </DialogHeader>
          <VariantForm
            productId={productId}
            onSubmit={handleAddVariant}
            onCancel={() => setShowAddDialog(false)}
            defaultPrice={defaultPrice}
            defaultCostPrice={defaultCostPrice}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>تعديل المتغير</DialogTitle>
            <DialogDescription>نموذج تعديل بيانات المتغير</DialogDescription>
          </DialogHeader>
          <VariantForm
            variant={editingVariant}
            productId={productId}
            onSubmit={handleEditVariant}
            onCancel={() => setEditingVariant(null)}
            defaultPrice={defaultPrice}
            defaultCostPrice={defaultCostPrice}
          />
        </DialogContent>
      </Dialog>

      {/* Generator Dialog */}
      <Dialog open={showGeneratorDialog} onOpenChange={setShowGeneratorDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>توليد المتغيرات تلقائياً</DialogTitle>
            <DialogDescription>توليد متغيرات المنتج من الخيارات</DialogDescription>
          </DialogHeader>
          <VariantGenerator
            productId={productId}
            onGenerate={handleGenerateVariants}
            onCancel={() => setShowGeneratorDialog(false)}
            defaultPrice={defaultPrice}
            defaultCostPrice={defaultCostPrice}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default VariantManager;
