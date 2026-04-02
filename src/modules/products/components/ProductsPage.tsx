// ============================================
// Products Page - صفحة المنتجات
// ============================================

'use client';

import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, MoreHorizontal, Package, Filter, Download, Upload, QrCode, Eye, Copy, ChevronDown, X, Sparkles, TrendingUp, AlertCircle, Barcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAppStore, formatCurrency } from '@/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useProducts } from '../hooks';
import { StatsCard } from './StatsCard';
import { ProductSkeleton } from './ProductSkeleton';
import type { Product, ProductFormData, VariantFormData } from '../types';

// Default form data
const defaultFormData: ProductFormData = {
  barcode: '', sku: '', name: '', nameAr: '', description: '',
  categoryId: '', brandId: '', supplierId: '', costPrice: 0, sellingPrice: 0,
  wholesalePrice: 0, minStock: 0, maxStock: 0, unit: 'piece', hasVariants: false, isActive: true
};

const defaultVariant: VariantFormData = {
  name: '', nameAr: '', sku: '', barcode: '', costPrice: 0, sellingPrice: 0, stock: 0, attributes: ''
};

export function ProductsPage() {
  const { currency } = useAppStore();
  const {
    categories, brands, suppliers, loading, searchQuery, selectedCategory,
    setSearchQuery, setSelectedCategory, saveProduct, deleteProduct, filteredProducts, stats
  } = useProducts();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [variants, setVariants] = useState<VariantFormData[]>([]);

  // Handlers
  const handleSave = async () => {
    const success = await saveProduct(formData, variants, selectedProduct);
    if (success) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    const success = await deleteProduct(selectedProduct.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setVariants([]);
    setSelectedProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      barcode: product.barcode, sku: product.sku || '', name: product.name, nameAr: product.nameAr || '',
      description: product.description || '', categoryId: product.categoryId || '', brandId: product.brandId || '',
      supplierId: product.supplierId || '', costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      wholesalePrice: product.wholesalePrice || 0, minStock: product.minStock, maxStock: product.maxStock || 0,
      unit: product.unit, hasVariants: product.hasVariants, isActive: product.isActive
    });
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map(v => ({
        name: v.name, nameAr: v.nameAr || '', sku: v.sku || '', barcode: v.barcode || '',
        costPrice: v.costPrice, sellingPrice: v.sellingPrice, stock: v.stock, attributes: v.attributes || ''
      })));
    }
    setShowAddDialog(true);
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { ...defaultVariant, costPrice: formData.costPrice, sellingPrice: formData.sellingPrice }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const toggleVariants = (productId: string) => {
    setExpandedVariants(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  if (loading) {
    return <div className="p-6"><ProductSkeleton /></div>;
  }

  return (
    <div className="p-6 space-y-6 pb-10">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold">المنتجات</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Package className="h-4 w-4" />
            إدارة المنتجات والمخزون
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" /> استيراد
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> تصدير
          </Button>
          <Button className="gap-2" onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4" /> إضافة منتج
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="إجمالي المنتجات" value={stats.totalProducts} icon={Package} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={0} />
        <StatsCard title="المنتجات النشطة" value={stats.activeProducts} icon={TrendingUp} gradient="bg-gradient-to-br from-blue-500 to-blue-600" delay={0.1} />
        <StatsCard title="منتجات بمتغيرات" value={stats.productsWithVariants} icon={Sparkles} gradient="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.2} />
        <StatsCard title="مخزون منخفض" value={stats.lowStockProducts} icon={AlertCircle} gradient="bg-gradient-to-br from-amber-500 to-amber-600" delay={0.3} />
      </div>

      {/* Search and Filters */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم أو الباركود..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pr-10 bg-background/50" 
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-background/50">
            <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="اختر الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Package className="h-16 w-16 mb-4 opacity-50" />
                </motion.div>
                <p className="text-lg font-medium">لا توجد منتجات</p>
                <p className="text-sm">جرب تغيير البحث أو الفلتر</p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>المنتج</TableHead>
                    <TableHead>الباركود</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>سعر التكلفة</TableHead>
                    <TableHead>سعر البيع</TableHead>
                    <TableHead>المتغيرات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => {
                      const hasVariants = product.variants && product.variants.length > 0;
                      const isExpanded = expandedVariants.includes(product.id);
                      
                      return (
                        <Fragment key={product.id}>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleVariants(product.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  {product.nameAr && <p className="text-xs text-muted-foreground">{product.nameAr}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  {product.barcode}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigator.clipboard.writeText(product.barcode); 
                                    toast.success('تم نسخ الباركود'); 
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{categories.find(c => c.id === product.categoryId)?.name || '-'}</TableCell>
                            <TableCell>{formatCurrency(product.costPrice, currency)}</TableCell>
                            <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(product.sellingPrice, currency)}</TableCell>
                            <TableCell>
                              {hasVariants ? (
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">{product.variants?.length} متغير</Badge>
                                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="h-4 w-4" />
                                  </motion.div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={product.isActive ? 'default' : 'secondary'} className={cn(product.isActive && "bg-emerald-500 hover:bg-emerald-600")}>
                                {product.isActive ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                    <Edit className="ml-2 h-4 w-4" /> تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="ml-2 h-4 w-4" /> عرض التفاصيل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <QrCode className="ml-2 h-4 w-4" /> طباعة باركود
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true); }}>
                                    <Trash2 className="ml-2 h-4 w-4" /> حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          
                          {/* Variants Row */}
                          <AnimatePresence>
                            {hasVariants && isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-muted/20"
                              >
                                <td colSpan={8} className="p-0">
                                  <div className="pr-8 py-2">
                                    {product.variants?.map(variant => (
                                      <motion.div 
                                        key={variant.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 mb-2"
                                      >
                                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{variant.name}</p>
                                          {variant.attributes && <p className="text-xs text-muted-foreground">{variant.attributes}</p>}
                                        </div>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">{variant.barcode}</code>
                                        <span className="text-sm">{formatCurrency(variant.costPrice, currency)}</span>
                                        <span className="text-sm font-medium">{formatCurrency(variant.sellingPrice, currency)}</span>
                                        <Badge variant="outline">مخزون: {variant.stock}</Badge>
                                      </motion.div>
                                    ))}
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {selectedProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
              <TabsTrigger value="pricing">التسعير والمخزون</TabsTrigger>
              <TabsTrigger value="variants">المتغيرات</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[55vh]">
              <TabsContent value="basic" className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>اسم المنتج (عربي) *</Label><Input placeholder="اسم المنتج بالعربية" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
                  <div><Label>اسم المنتج (إنجليزي)</Label><Input placeholder="Product Name" value={formData.nameAr} onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))} /></div>
                  <div><Label>الباركود *</Label><Input placeholder="أدخل الباركود" value={formData.barcode} onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))} /></div>
                  <div><Label>رمز المنتج (SKU)</Label><Input placeholder="SKU-001" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} /></div>
                  <div>
                    <Label>الفئة</Label>
                    <Select value={formData.categoryId} onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>البراند</Label>
                    <Select value={formData.brandId} onValueChange={(v) => setFormData(prev => ({ ...prev, brandId: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر البراند" /></SelectTrigger>
                      <SelectContent>
                        {brands.map(brand => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المورد</Label>
                    <Select value={formData.supplierId} onValueChange={(v) => setFormData(prev => ({ ...prev, supplierId: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الوحدة</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">قطعة</SelectItem>
                        <SelectItem value="kg">كيلوغرام</SelectItem>
                        <SelectItem value="meter">متر</SelectItem>
                        <SelectItem value="liter">لتر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>الوصف</Label><Textarea placeholder="وصف المنتج..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} /></div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>سعر التكلفة *</Label><Input type="number" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label>سعر البيع *</Label><Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label>سعر الجملة</Label><Input type="number" value={formData.wholesalePrice} onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><Label>الحد الأدنى للمخزون</Label><Input type="number" value={formData.minStock} onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))} /></div>
                  <div><Label>الحد الأقصى للمخزون</Label><Input type="number" value={formData.maxStock} onChange={(e) => setFormData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))} /></div>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.hasVariants} onCheckedChange={(v) => setFormData(prev => ({ ...prev, hasVariants: v }))} />
                  <Label>المنتج له متغيرات (ألوان، أحجام...)</Label>
                </div>
                <Separator />
                {formData.hasVariants && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">المتغيرات</h4>
                      <Button variant="outline" size="sm" onClick={addVariant}><Plus className="h-4 w-4 ml-1" /> إضافة متغير</Button>
                    </div>
                    {variants.length > 0 ? (
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <Card key={index}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-sm">متغير {index + 1}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVariant(index)}><X className="h-4 w-4" /></Button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <Input placeholder="الاسم" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} />
                                <Input placeholder="الاسم عربي" value={variant.nameAr} onChange={(e) => updateVariant(index, 'nameAr', e.target.value)} />
                                <Input placeholder="الباركود" value={variant.barcode} onChange={(e) => updateVariant(index, 'barcode', e.target.value)} />
                                <Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} />
                                <Input type="number" placeholder="سعر التكلفة" value={variant.costPrice} onChange={(e) => updateVariant(index, 'costPrice', parseFloat(e.target.value) || 0)} />
                                <Input type="number" placeholder="سعر البيع" value={variant.sellingPrice} onChange={(e) => updateVariant(index, 'sellingPrice', parseFloat(e.target.value) || 0)} />
                                <Input type="number" placeholder="المخزون" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)} />
                                <Input placeholder="الخصائص (JSON)" value={variant.attributes} onChange={(e) => updateVariant(index, 'attributes', e.target.value)} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>لم يتم إضافة متغيرات بعد</p>
                        <Button variant="outline" className="mt-4" onClick={addVariant}>إضافة متغير</Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} className="gap-2">
              <Sparkles className="h-4 w-4" />
              حفظ المنتج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد من حذف المنتج "{selectedProduct?.name}"؟</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
