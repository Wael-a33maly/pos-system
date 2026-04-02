'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Printer, Plus, Edit, Trash2, Copy, Eye, Settings, FileText,
  Save, RotateCcw, Download, Monitor, Tablet, Smartphone,
  Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore, formatCurrency } from '@/store';
import {
  type ReceiptTemplate,
  type ReceiptTemplateFormData,
  DEFAULT_RECEIPT_TEMPLATE,
  PAPER_TYPE_LABELS,
  TEMPLATE_TYPE_LABELS,
} from '../types';

// Sample invoice data for preview
const SAMPLE_INVOICE = {
  companyName: 'شركة نقاط البيع',
  branchName: 'الفرع الرئيسي',
  branchAddress: 'شارع الملك فهد، الرياض',
  branchPhone: '0500000000',
  taxNumber: '300000000000003',
  invoiceNumber: 'INV-000001',
  invoiceDate: new Date(),
  items: [
    { productName: 'آيفون 15 برو ماكس', quantity: 1, unitPrice: 4999, discountAmount: 0, taxAmount: 750, totalAmount: 5749 },
    { productName: 'سماعات آبل برو', quantity: 2, unitPrice: 999, discountAmount: 100, taxAmount: 285, totalAmount: 2183 },
  ],
  subtotal: 6997,
  discountAmount: 100,
  taxAmount: 1035,
  totalAmount: 7932,
  paidAmount: 8000,
  changeAmount: 68,
  paymentMethod: 'نقدي',
  cashierName: 'محمد أحمد',
};

export function PrintingPage() {
  const { currency } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<'thermal' | 'a4'>('thermal');
  const printRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ReceiptTemplateFormData>>({
    name: '',
    nameAr: '',
    type: 'invoice',
    paperWidth: 80,
    paperType: 'thermal',
    ...DEFAULT_RECEIPT_TEMPLATE,
  });

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    body: true,
    totals: true,
    footer: true,
    advanced: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/printing');
      const data = await response.json();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data.templates[0]);
        setFormData(data.templates[0]);
      }
    } catch (error) {
      toast.error('فشل في تحميل القوالب');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = selectedTemplate ? `/api/printing/${selectedTemplate.id}` : '/api/printing';
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('تم حفظ القالب');
        fetchTemplates();
        setShowDialog(false);
      } else {
        toast.error('فشل في حفظ القالب');
      }
    } catch (error) {
      toast.error('خطأ في الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    
    try {
      const response = await fetch(`/api/printing/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('تم حذف القالب');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('فشل في الحذف');
    }
  };

  const handleDuplicate = async (template: ReceiptTemplate) => {
    setFormData({
      ...template,
      name: `${template.name} (نسخة)`,
      nameAr: template.nameAr ? `${template.nameAr} (نسخة)` : undefined,
      isDefault: false,
    });
    setSelectedTemplate(null);
    setShowDialog(true);
  };

  const handlePrintPreview = () => {
    window.print();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Stats
  const stats = {
    totalTemplates: templates.length,
    invoiceTemplates: templates.filter(t => t.type === 'invoice').length,
    returnTemplates: templates.filter(t => t.type === 'return').length,
    defaultTemplates: templates.filter(t => t.isDefault).length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
          <h1 className="text-3xl font-bold">إعدادات الطباعة</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Printer className="h-4 w-4" />
            إدارة قوالب الفواتير وإعدادات الطابعة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrintPreview} variant="outline">
            <Eye className="h-4 w-4 ml-2" /> معاينة
          </Button>
          <Button onClick={() => {
            setSelectedTemplate(null);
            setFormData({ ...DEFAULT_RECEIPT_TEMPLATE, name: '', nameAr: '' });
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 ml-2" /> قالب جديد
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">إجمالي القوالب</p>
                <p className="text-2xl font-bold">{stats.totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">قوالب الفواتير</p>
                <p className="text-2xl font-bold">{stats.invoiceTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">قوالب المرتجعات</p>
                <p className="text-2xl font-bold">{stats.returnTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">القوالب الافتراضية</p>
                <p className="text-2xl font-bold">{stats.defaultTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>قوالب الطباعة</CardTitle>
            <CardDescription>اختر قالباً لتعديله أو معاينته</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setFormData(template);
                    }}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.nameAr || template.name}</p>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {TEMPLATE_TYPE_LABELS[template.type]?.labelAr || template.type}
                          {' • '}
                          {template.paperWidth}mm
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setFormData(template);
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {templates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Printer className="h-12 w-12 mb-2 opacity-50" />
                    <p>لا توجد قوالب</p>
                    <Button className="mt-4" onClick={() => setShowDialog(true)}>
                      <Plus className="h-4 w-4 ml-2" /> إنشاء قالب
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>معاينة الطباعة</CardTitle>
              <CardDescription>معاينة شكل الفاتورة</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'thermal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('thermal')}
              >
                <Monitor className="h-4 w-4 ml-1" /> حراري
              </Button>
              <Button
                variant={previewMode === 'a4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('a4')}
              >
                <FileText className="h-4 w-4 ml-1" /> A4
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center bg-muted/30 rounded-lg p-4">
              <div
                ref={printRef}
                className={cn(
                  "bg-white text-black p-4 shadow-lg",
                  previewMode === 'thermal'
                    ? "w-80 font-mono text-xs"
                    : "w-[210mm] text-sm"
                )}
                style={{ direction: 'rtl' }}
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="font-bold text-lg">{SAMPLE_INVOICE.companyName}</h2>
                  <p className="text-xs">{SAMPLE_INVOICE.branchName}</p>
                  <p className="text-xs">{SAMPLE_INVOICE.branchAddress}</p>
                  <p className="text-xs">{SAMPLE_INVOICE.branchPhone}</p>
                  <p className="text-xs">الرقم الضريبي: {SAMPLE_INVOICE.taxNumber}</p>
                </div>
                
                <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
                  <div className="flex justify-between text-xs">
                    <span>رقم الفاتورة:</span>
                    <span>{SAMPLE_INVOICE.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>التاريخ:</span>
                    <span>{SAMPLE_INVOICE.invoiceDate.toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>الكاشير:</span>
                    <span>{SAMPLE_INVOICE.cashierName}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="my-2">
                  <div className="flex justify-between text-xs font-bold border-b border-dashed border-gray-400 pb-1 mb-1">
                    <span>الصنف</span>
                    <span>الكمية</span>
                    <span>السعر</span>
                    <span>الإجمالي</span>
                  </div>
                  {SAMPLE_INVOICE.items.map((item, i) => (
                    <div key={i} className="py-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex-1 truncate">{item.productName}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{item.quantity}</span>
                        <span>{item.unitPrice}</span>
                        <span>{item.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>الخصم:</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.discountAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>الضريبة (15%):</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.taxAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-400">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.totalAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>المدفوع:</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.paidAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>الباقي:</span>
                    <span>{formatCurrency(SAMPLE_INVOICE.changeAmount, currency)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
                  <p className="text-xs">شكراً لزيارتكم</p>
                  <p className="text-xs text-gray-500">نتمنى لكم يوماً سعيداً</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'تعديل القالب' : 'قالب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4 p-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم القالب (عربي)</Label>
                  <Input
                    value={formData.nameAr || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>اسم القالب (إنجليزي)</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع القالب</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">فاتورة</SelectItem>
                      <SelectItem value="return">مرتجع</SelectItem>
                      <SelectItem value="shift_close">إغلاق وردية</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>عرض الورق (mm)</Label>
                  <Select
                    value={String(formData.paperWidth)}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, paperWidth: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm</SelectItem>
                      <SelectItem value="80">80mm</SelectItem>
                      <SelectItem value="110">110mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Collapsible Sections */}
              {/* Header Settings */}
              <Card>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggleSection('header')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">إعدادات الترويسة</CardTitle>
                    {expandedSections.header ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedSections.header && (
                  <CardContent className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showCompanyName}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showCompanyName: v }))}
                      />
                      <Label>إظهار اسم الشركة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showBranchName}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showBranchName: v }))}
                      />
                      <Label>إظهار اسم الفرع</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showBranchAddress}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showBranchAddress: v }))}
                      />
                      <Label>إظهار عنوان الفرع</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showBranchPhone}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showBranchPhone: v }))}
                      />
                      <Label>إظهار هاتف الفرع</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showTaxNumber}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showTaxNumber: v }))}
                      />
                      <Label>إظهار الرقم الضريبي</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showLogo}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showLogo: v }))}
                      />
                      <Label>إظهار الشعار</Label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Body Settings */}
              <Card>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggleSection('body')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">إعدادات المحتوى</CardTitle>
                    {expandedSections.body ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedSections.body && (
                  <CardContent className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showProductName}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showProductName: v }))}
                      />
                      <Label>إظهار اسم المنتج</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showQuantity}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showQuantity: v }))}
                      />
                      <Label>إظهار الكمية</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showUnitPrice}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showUnitPrice: v }))}
                      />
                      <Label>إظهار سعر الوحدة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showDiscount}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showDiscount: v }))}
                      />
                      <Label>إظهار الخصم</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showTax}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showTax: v }))}
                      />
                      <Label>إظهار الضريبة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showLineTotal}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showLineTotal: v }))}
                      />
                      <Label>إظهار إجمالي السطر</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showBarcode}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showBarcode: v }))}
                      />
                      <Label>إظهار الباركود</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showSku}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showSku: v }))}
                      />
                      <Label>إظهار SKU</Label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Totals Settings */}
              <Card>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggleSection('totals')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">إعدادات الإجماليات</CardTitle>
                    {expandedSections.totals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedSections.totals && (
                  <CardContent className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showSubtotal}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showSubtotal: v }))}
                      />
                      <Label>إظهار المجموع الفرعي</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showDiscountTotal}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showDiscountTotal: v }))}
                      />
                      <Label>إظهار إجمالي الخصم</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showTaxTotal}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showTaxTotal: v }))}
                      />
                      <Label>إظهار إجمالي الضريبة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showTotal}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showTotal: v }))}
                      />
                      <Label>إظهار الإجمالي</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showPaid}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showPaid: v }))}
                      />
                      <Label>إظهار المدفوع</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showChange}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showChange: v }))}
                      />
                      <Label>إظهار الباقي</Label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Footer Settings */}
              <Card>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggleSection('footer')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">إعدادات التذييل</CardTitle>
                    {expandedSections.footer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedSections.footer && (
                  <CardContent className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showThankYou}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showThankYou: v }))}
                      />
                      <Label>إظهار رسالة الشكر</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showQRCode}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showQRCode: v }))}
                      />
                      <Label>إظهار QR Code</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showInvoiceBarcode}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showInvoiceBarcode: v }))}
                      />
                      <Label>إظهار باركود الفاتورة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showDateTime}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showDateTime: v }))}
                      />
                      <Label>إظهار التاريخ والوقت</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showCashier}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showCashier: v }))}
                      />
                      <Label>إظهار اسم الكاشير</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showInvoiceNumber}
                        onCheckedChange={(v) => setFormData(prev => ({ ...prev, showInvoiceNumber: v }))}
                      />
                      <Label>إظهار رقم الفاتورة</Label>
                    </div>
                    <div className="col-span-2">
                      <Label>رسالة الشكر</Label>
                      <Input
                        value={formData.thankYouMessage || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                        placeholder="شكراً لزيارتكم"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isDefault: v }))}
                  />
                  <Label>تعيين كافتراضي</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
                  />
                  <Label>نشط</Label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 ml-2" /> حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
