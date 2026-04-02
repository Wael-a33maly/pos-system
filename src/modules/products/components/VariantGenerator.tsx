// ============================================
// Variant Generator - مولد المتغيرات التلقائي
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Plus, X, RefreshCw, Package, 
  DollarSign, Archive, Check, Settings2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { VariantGeneratorProps, VariantOption, GeneratedVariant, VariantAttribute } from '@/types/product-variant';

// Predefined options
const predefinedOptions: VariantOption[] = [
  {
    id: 'color',
    name: 'اللون',
    values: [
      { id: 'red', value: 'أحمر', color: '#ef4444' },
      { id: 'blue', value: 'أزرق', color: '#3b82f6' },
      { id: 'green', value: 'أخضر', color: '#22c55e' },
      { id: 'yellow', value: 'أصفر', color: '#eab308' },
      { id: 'black', value: 'أسود', color: '#171717' },
      { id: 'white', value: 'أبيض', color: '#ffffff' },
      { id: 'gray', value: 'رمادي', color: '#6b7280' },
      { id: 'brown', value: 'بني', color: '#a16207' },
      { id: 'purple', value: 'بنفسجي', color: '#a855f7' },
      { id: 'orange', value: 'برتقالي', color: '#f97316' },
    ]
  },
  {
    id: 'size',
    name: 'الحجم',
    values: [
      { id: 'xs', value: 'XS' },
      { id: 's', value: 'S' },
      { id: 'm', value: 'M' },
      { id: 'l', value: 'L' },
      { id: 'xl', value: 'XL' },
      { id: 'xxl', value: 'XXL' },
      { id: '3xl', value: '3XL' },
    ]
  },
  {
    id: 'weight',
    name: 'الوزن',
    values: [
      { id: '100g', value: '100g' },
      { id: '250g', value: '250g' },
      { id: '500g', value: '500g' },
      { id: '1kg', value: '1kg' },
      { id: '2kg', value: '2kg' },
      { id: '5kg', value: '5kg' },
    ]
  },
  {
    id: 'capacity',
    name: 'السعة',
    values: [
      { id: '100ml', value: '100ml' },
      { id: '250ml', value: '250ml' },
      { id: '500ml', value: '500ml' },
      { id: '1l', value: '1L' },
      { id: '2l', value: '2L' },
    ]
  },
  {
    id: 'material',
    name: 'المادة',
    values: [
      { id: 'cotton', value: 'قطن' },
      { id: 'polyester', value: 'بوليستر' },
      { id: 'wool', value: 'صوف' },
      { id: 'silk', value: 'حرير' },
      { id: 'leather', value: 'جلد' },
    ]
  },
];

export function VariantGenerator({
  productId,
  onGenerate,
  onCancel,
  defaultPrice = 0,
  defaultCostPrice = 0
}: VariantGeneratorProps) {
  // Selected options for generation
  const [selectedOptions, setSelectedOptions] = useState<VariantOption[]>([]);
  const [customOptionName, setCustomOptionName] = useState('');
  const [customOptionValues, setCustomOptionValues] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState('');
  
  // Bulk edit settings
  const [bulkPrice, setBulkPrice] = useState(defaultPrice);
  const [bulkCostPrice, setBulkCostPrice] = useState(defaultCostPrice);
  const [bulkStock, setBulkStock] = useState(0);
  const [applyBulk, setApplyBulk] = useState(true);

  // Generated variants preview
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<GeneratedVariant>>({});

  // Calculate all possible combinations
  const combinations = useMemo(() => {
    if (selectedOptions.length === 0) return [];
    
    const generateCombinations = (options: VariantOption[], currentIndex: number, current: VariantAttribute[]): VariantAttribute[][] => {
      if (currentIndex >= options.length) {
        return [current];
      }
      
      const option = options[currentIndex];
      const results: VariantAttribute[][] = [];
      
      for (const value of option.values) {
        results.push(...generateCombinations(options, currentIndex + 1, [
          ...current,
          { name: option.name, value: value.value }
        ]));
      }
      
      return results;
    };
    
    return generateCombinations(selectedOptions, 0, []);
  }, [selectedOptions]);

  // Add predefined option
  const addPredefinedOption = () => {
    const option = predefinedOptions.find(o => o.id === selectedPredefined);
    if (option) {
      // Check if already added
      if (selectedOptions.find(o => o.id === option.id)) {
        toast.error('هذا الخيار موجود بالفعل');
        return;
      }
      setSelectedOptions(prev => [...prev, { ...option, values: [] }]);
      setSelectedPredefined('');
    }
  };

  // Add custom option
  const addCustomOption = () => {
    if (!customOptionName.trim()) {
      toast.error('يرجى إدخال اسم الخيار');
      return;
    }
    
    const values = customOptionValues.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length === 0) {
      toast.error('يرجى إدخال قيم للخيار');
      return;
    }
    
    setSelectedOptions(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: customOptionName,
      values: values.map((v, i) => ({ id: `${i}`, value: v }))
    }]);
    
    setCustomOptionName('');
    setCustomOptionValues('');
  };

  // Remove option
  const removeOption = (optionId: string) => {
    setSelectedOptions(prev => prev.filter(o => o.id !== optionId));
  };

  // Toggle value in option
  const toggleValue = (optionId: string, valueId: string, value: string, color?: string) => {
    setSelectedOptions(prev => prev.map(option => {
      if (option.id !== optionId) return option;
      
      const valueExists = option.values.find(v => v.id === valueId);
      if (valueExists) {
        return { ...option, values: option.values.filter(v => v.id !== valueId) };
      } else {
        return { ...option, values: [...option.values, { id: valueId, value, color }] };
      }
    }));
  };

  // Generate variants
  const generateVariants = () => {
    if (selectedOptions.length === 0) {
      toast.error('يرجى اختيار خيار واحد على الأقل');
      return;
    }
    
    // Check if all options have values
    const emptyOptions = selectedOptions.filter(o => o.values.length === 0);
    if (emptyOptions.length > 0) {
      toast.error(`يرجى اختيار قيم للخيار: ${emptyOptions.map(o => o.name).join(', ')}`);
      return;
    }
    
    const variants: GeneratedVariant[] = combinations.map((attrs, index) => ({
      sku: `${productId.substring(0, 4).toUpperCase()}-${attrs.map(a => a.value.substring(0, 2)).join('')}-${index + 1}`,
      name: attrs.map(a => a.value).join(' - '),
      attributes: attrs,
      price: applyBulk ? bulkPrice : defaultPrice,
      costPrice: applyBulk ? bulkCostPrice : defaultCostPrice,
      stock: applyBulk ? bulkStock : 0,
      barcode: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')
    }));
    
    setGeneratedVariants(variants);
    toast.success(`تم توليد ${variants.length} متغير`);
  };

  // Edit variant
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues(generatedVariants[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      setGeneratedVariants(prev => prev.map((v, i) => 
        i === editingIndex ? { ...v, ...editValues } as GeneratedVariant : v
      ));
      setEditingIndex(null);
      setEditValues({});
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  // Remove generated variant
  const removeGeneratedVariant = (index: number) => {
    setGeneratedVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Submit generated variants
  const handleSubmit = () => {
    if (generatedVariants.length === 0) {
      toast.error('لا توجد متغيرات للتوليد');
      return;
    }
    onGenerate(generatedVariants);
  };

  // Get total combinations count
  const totalCombinations = selectedOptions.reduce((acc, opt) => acc * (opt.values.length || 1), 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-l from-purple-500/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-500" />
          مولد المتغيرات التلقائي
        </CardTitle>
        <CardDescription>
          اختر الخيارات والقيم لتوليد جميع التركيبات الممكنة تلقائياً
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-border">
          {/* Left: Options Selection */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">إضافة خيارات</Label>
              
              {/* Predefined Options */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">خيارات جاهزة</Label>
                <div className="flex gap-2">
                  <Select value={selectedPredefined} onValueChange={setSelectedPredefined}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر خيار..." />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={addPredefinedOption} disabled={!selectedPredefined}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              {/* Custom Option */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">خيار مخصص</Label>
                <Input 
                  placeholder="اسم الخيار (مثل: المقاس)" 
                  value={customOptionName}
                  onChange={(e) => setCustomOptionName(e.target.value)}
                />
                <Input 
                  placeholder="القيم مفصولة بفاصلة (مثل: 38, 40, 42, 44)" 
                  value={customOptionValues}
                  onChange={(e) => setCustomOptionValues(e.target.value)}
                />
                <Button variant="outline" className="w-full" onClick={addCustomOption}>
                  <Plus className="h-4 w-4 ml-2" /> إضافة خيار مخصص
                </Button>
              </div>
            </div>

            <Separator />

            {/* Selected Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">الخيارات المحددة</Label>
                <Badge variant="secondary">{selectedOptions.length} خيارات</Badge>
              </div>

              <AnimatePresence mode="popLayout">
                {selectedOptions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{option.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => removeOption(option.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {predefinedOptions.find(o => o.id === option.id)?.values.map((v) => (
                            <motion.button
                              key={v.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleValue(option.id, v.id, v.value, v.color)}
                              className={cn(
                                "px-3 py-1 rounded-full text-sm transition-colors",
                                option.values.find(ov => ov.id === v.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              {v.color && (
                                <span 
                                  className="inline-block w-3 h-3 rounded-full mr-1 border"
                                  style={{ backgroundColor: v.color }}
                                />
                              )}
                              {v.value}
                            </motion.button>
                          ))}
                          
                          {option.id.startsWith('custom-') && option.values.map((v) => (
                            <Badge 
                              key={v.id}
                              variant="default"
                              className="cursor-pointer"
                              onClick={() => toggleValue(option.id, v.id, v.value)}
                            >
                              {v.value}
                              <X className="h-3 w-3 mr-1" />
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          محدد: {option.values.length} قيمة
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لم يتم تحديد خيارات بعد</p>
                    <p className="text-xs">أضف خيارات لتوليد المتغيرات</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  إعدادات التطبيق الجماعي
                </Label>
                <Switch checked={applyBulk} onCheckedChange={setApplyBulk} />
              </div>
              
              {applyBulk && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <div>
                    <Label className="text-xs">سعر التكلفة</Label>
                    <Input 
                      type="number"
                      value={bulkCostPrice}
                      onChange={(e) => setBulkCostPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">سعر البيع</Label>
                    <Input 
                      type="number"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">الكمية</Label>
                    <Input 
                      type="number"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full gap-2" 
              onClick={generateVariants}
              disabled={selectedOptions.length === 0}
            >
              <RefreshCw className="h-4 w-4" />
              توليد المتغيرات ({totalCombinations} تركيبة)
            </Button>
          </div>

          {/* Right: Generated Variants Preview */}
          <div className="border-t lg:border-t-0">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <Label className="font-semibold">المتغيرات المولدة</Label>
              <Badge variant={generatedVariants.length > 0 ? "default" : "secondary"}>
                {generatedVariants.length} متغير
              </Badge>
            </div>
            
            <ScrollArea className="h-[400px]">
              {generatedVariants.length > 0 ? (
                <div className="p-4 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {generatedVariants.map((variant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "p-3 rounded-lg border bg-card transition-all",
                          editingIndex === index && "ring-2 ring-primary"
                        )}
                      >
                        {editingIndex === index ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">السعر</Label>
                                <Input 
                                  type="number"
                                  value={editValues.price || 0}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">التكلفة</Label>
                                <Input 
                                  type="number"
                                  value={editValues.costPrice || 0}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">الكمية</Label>
                                <Input 
                                  type="number"
                                  value={editValues.stock || 0}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}>
                                <Check className="h-4 w-4 ml-1" /> حفظ
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{variant.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>SKU: {variant.sku}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-emerald-500" />
                                <span className="font-medium">{variant.price}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Archive className="h-3 w-3 text-muted-foreground" />
                                <span>{variant.stock}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => startEdit(index)}
                              >
                                <Settings2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeGeneratedVariant(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">لا توجد متغيرات مولدة</p>
                  <p className="text-sm">اختر الخيارات وانقر على "توليد المتغيرات"</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="gap-2"
            disabled={generatedVariants.length === 0}
          >
            <Check className="h-4 w-4" />
            إضافة {generatedVariants.length} متغير
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default VariantGenerator;
