'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Copy,
  Printer,
  Settings,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layout,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAppStore, formatCurrency } from '@/store';
import { cn } from '@/lib/utils';

interface ReceiptTemplate {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  paperWidth: number;
  paperType: string;
  fontFamily: string;
  fontSizeSmall: number;
  fontSizeNormal: number;
  fontSizeLarge: number;
  fontSizeTitle: number;
  fontSizeTotal: number;
  fontBold: boolean;
  showLogo: boolean;
  logoAlignment: string;
  showCompanyName: boolean;
  companyNameStyle: string;
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  headerAlignment: string;
  showSku: boolean;
  showProductName: boolean;
  showVariant: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showLineTotal: boolean;
  showBarcode: boolean;
  showSubtotal: boolean;
  showDiscountTotal: boolean;
  showTaxTotal: boolean;
  showTotal: boolean;
  showPaid: boolean;
  showChange: boolean;
  totalsAlignment: string;
  showThankYou: boolean;
  thankYouMessage: string;
  showReturnPolicy: boolean;
  returnPolicyText?: string;
  showQRCode: boolean;
  showInvoiceBarcode: boolean;
  showDateTime: boolean;
  showCashier: boolean;
  showInvoiceNumber: boolean;
  showSeparator: boolean;
  separatorChar: string;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number;
  isDefault: boolean;
  isActive: boolean;
}

const defaultTemplate: ReceiptTemplate = {
  id: '',
  name: 'قالب جديد',
  type: 'invoice',
  paperWidth: 80,
  paperType: 'thermal',
  fontFamily: 'monospace',
  fontSizeSmall: 10,
  fontSizeNormal: 12,
  fontSizeLarge: 14,
  fontSizeTitle: 18,
  fontSizeTotal: 16,
  fontBold: true,
  showLogo: true,
  logoAlignment: 'center',
  showCompanyName: true,
  companyNameStyle: 'bold_large',
  showBranchName: true,
  showBranchAddress: true,
  showBranchPhone: true,
  showTaxNumber: true,
  headerAlignment: 'center',
  showSku: false,
  showProductName: true,
  showVariant: true,
  showQuantity: true,
  showUnitPrice: true,
  showDiscount: true,
  showTax: true,
  showLineTotal: true,
  showBarcode: false,
  showSubtotal: true,
  showDiscountTotal: true,
  showTaxTotal: true,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  showThankYou: true,
  thankYouMessage: 'شكراً لزيارتكم',
  showReturnPolicy: false,
  showQRCode: false,
  showInvoiceBarcode: true,
  showDateTime: true,
  showCashier: true,
  showInvoiceNumber: true,
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
  isDefault: false,
  isActive: true,
};

export function ReceiptDesigner() {
  const { currency } = useAppStore();
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ReceiptTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/receipt-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          setCurrentTemplate(data.templates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const isNew = !currentTemplate.id;
      const res = await fetch('/api/receipt-templates', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          setTemplates([...templates, data.template]);
          setCurrentTemplate(data.template);
        } else {
          setTemplates(templates.map(t => t.id === data.template.id ? data.template : t));
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (key: keyof ReceiptTemplate, value: unknown) => {
    setCurrentTemplate({ ...currentTemplate, [key]: value });
  };

  const newTemplate = () => {
    setCurrentTemplate({ ...defaultTemplate, name: `قالب ${templates.length + 1}` });
  };

  // Preview data
  const previewData = {
    companyName: 'شركة الأمل للتجارة',
    branchName: 'فرع الرياض',
    branchAddress: 'شارع الملك فهد، الرياض',
    branchPhone: '0501234567',
    taxNumber: '300123456789003',
    invoiceNumber: 'INV-001234',
    invoiceDate: new Date().toLocaleDateString('ar-SA'),
    invoiceTime: new Date().toLocaleTimeString('ar-SA'),
    cashierName: 'أحمد محمد',
    customerName: 'عميل نقدي',
    items: [
      { name: 'منتج تجريبي 1', quantity: 2, unitPrice: 50, total: 100 },
      { name: 'منتج تجريبي 2', quantity: 1, unitPrice: 150, total: 150 },
    ],
    subtotal: 250,
    discountTotal: 10,
    taxTotal: 9.6,
    total: 249.6,
    paid: 250,
    change: 0.4,
    paymentMethod: 'نقدي',
    thankYouMessage: currentTemplate.thankYouMessage,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Settings Panel */}
      <div className="w-80 border-l bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">إعدادات القالب</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={newTemplate}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={saveTemplate} disabled={saving}>
              <Save className="h-4 w-4 ml-1" />
              {saving ? 'جاري...' : 'حفظ'}
            </Button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="p-3 border-b">
          <Select
            value={currentTemplate.id || 'new'}
            onValueChange={(v) => {
              if (v === 'new') {
                newTemplate();
              } else {
                const template = templates.find(t => t.id === v);
                if (template) setCurrentTemplate(template);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر قالب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ قالب جديد</SelectItem>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="general" className="p-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="text-xs">عام</TabsTrigger>
              <TabsTrigger value="header" className="text-xs">الأعلى</TabsTrigger>
              <TabsTrigger value="body" className="text-xs">الوسط</TabsTrigger>
              <TabsTrigger value="footer" className="text-xs">الأسفل</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              {/* Name */}
              <div>
                <Label>اسم القالب</Label>
                <Input
                  value={currentTemplate.name}
                  onChange={(e) => updateTemplate('name', e.target.value)}
                />
              </div>

              {/* Paper Width */}
              <div>
                <Label>عرض الورق</Label>
                <Select
                  value={String(currentTemplate.paperWidth)}
                  onValueChange={(v) => updateTemplate('paperWidth', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Settings */}
              <div>
                <Label>نوع الخط</Label>
                <Select
                  value={currentTemplate.fontFamily}
                  onValueChange={(v) => updateTemplate('fontFamily', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>حجم الخط العادي: {currentTemplate.fontSizeNormal}px</Label>
                <Slider
                  value={[currentTemplate.fontSizeNormal]}
                  onValueChange={([v]) => updateTemplate('fontSizeNormal', v)}
                  min={8} max={16} step={1}
                />
              </div>

              <div>
                <Label>حجم العناوين: {currentTemplate.fontSizeTitle}px</Label>
                <Slider
                  value={[currentTemplate.fontSizeTitle]}
                  onValueChange={([v]) => updateTemplate('fontSizeTitle', v)}
                  min={12} max={24} step={1}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>خط عريض</Label>
                <Switch
                  checked={currentTemplate.fontBold}
                  onCheckedChange={(v) => updateTemplate('fontBold', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>خط فاصل</Label>
                <Switch
                  checked={currentTemplate.showSeparator}
                  onCheckedChange={(v) => updateTemplate('showSeparator', v)}
                />
              </div>

              <div>
                <Label>حرف الفاصل</Label>
                <Input
                  value={currentTemplate.separatorChar}
                  onChange={(e) => updateTemplate('separatorChar', e.target.value)}
                  className="w-20"
                />
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-3 mt-4">
              {[
                { key: 'showLogo', label: 'الشعار' },
                { key: 'showCompanyName', label: 'اسم الشركة' },
                { key: 'showBranchName', label: 'اسم الفرع' },
                { key: 'showBranchAddress', label: 'العنوان' },
                { key: 'showBranchPhone', label: 'رقم الهاتف' },
                { key: 'showTaxNumber', label: 'الرقم الضريبي' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={currentTemplate[key as keyof ReceiptTemplate] as boolean}
                    onCheckedChange={(v) => updateTemplate(key as keyof ReceiptTemplate, v)}
                  />
                </div>
              ))}

              <Separator />

              <div>
                <Label>محاذاة الرأس</Label>
                <Select
                  value={currentTemplate.headerAlignment}
                  onValueChange={(v) => updateTemplate('headerAlignment', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">يمين</SelectItem>
                    <SelectItem value="center">وسط</SelectItem>
                    <SelectItem value="left">يسار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="body" className="space-y-3 mt-4">
              {[
                { key: 'showProductName', label: 'اسم المنتج' },
                { key: 'showSku', label: 'كود المنتج (SKU)' },
                { key: 'showVariant', label: 'المتغير' },
                { key: 'showQuantity', label: 'الكمية' },
                { key: 'showUnitPrice', label: 'سعر الوحدة' },
                { key: 'showDiscount', label: 'الخصم' },
                { key: 'showTax', label: 'الضريبة' },
                { key: 'showLineTotal', label: 'إجمالي السطر' },
                { key: 'showBarcode', label: 'باركود المنتج' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={currentTemplate[key as keyof ReceiptTemplate] as boolean}
                    onCheckedChange={(v) => updateTemplate(key as keyof ReceiptTemplate, v)}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="footer" className="space-y-3 mt-4">
              {[
                { key: 'showSubtotal', label: 'المجموع الفرعي' },
                { key: 'showDiscountTotal', label: 'إجمالي الخصم' },
                { key: 'showTaxTotal', label: 'إجمالي الضريبة' },
                { key: 'showTotal', label: 'الإجمالي' },
                { key: 'showPaid', label: 'المدفوع' },
                { key: 'showChange', label: 'الباقي' },
                { key: 'showThankYou', label: 'رسالة الشكر' },
                { key: 'showQRCode', label: 'QR Code' },
                { key: 'showInvoiceBarcode', label: 'باركود الفاتورة' },
                { key: 'showDateTime', label: 'التاريخ والوقت' },
                { key: 'showCashier', label: 'اسم الكاشير' },
                { key: 'showInvoiceNumber', label: 'رقم الفاتورة' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={currentTemplate[key as keyof ReceiptTemplate] as boolean}
                    onCheckedChange={(v) => updateTemplate(key as keyof ReceiptTemplate, v)}
                  />
                </div>
              ))}

              <Separator />

              <div>
                <Label>رسالة الشكر</Label>
                <Input
                  value={currentTemplate.thankYouMessage}
                  onChange={(e) => updateTemplate('thankYouMessage', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 p-6 bg-muted/30 overflow-auto">
        <div className="max-w-sm mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">معاينة الفاتورة</h3>
            <Button size="sm" variant="outline">
              <Printer className="h-4 w-4 ml-2" />
              طباعة تجريبية
            </Button>
          </div>

          {/* Receipt Preview */}
          <div
            className="bg-white text-black shadow-lg mx-auto"
            style={{
              width: currentTemplate.paperWidth === 58 ? '224px' : '302px',
              fontFamily: currentTemplate.fontFamily,
              fontSize: currentTemplate.fontSizeNormal,
              lineHeight: currentTemplate.lineSpacing,
              padding: '8px',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: currentTemplate.headerAlignment as 'left' | 'center' | 'right' }}>
              {currentTemplate.showCompanyName && (
                <div style={{
                  fontSize: currentTemplate.fontSizeTitle,
                  fontWeight: currentTemplate.fontBold ? 'bold' : 'normal',
                }}>
                  {previewData.companyName}
                </div>
              )}
              {currentTemplate.showBranchName && (
                <div style={{ fontSize: currentTemplate.fontSizeLarge }}>{previewData.branchName}</div>
              )}
              {currentTemplate.showBranchAddress && (
                <div style={{ fontSize: currentTemplate.fontSizeSmall }}>{previewData.branchAddress}</div>
              )}
              {currentTemplate.showBranchPhone && (
                <div style={{ fontSize: currentTemplate.fontSizeSmall }}>{previewData.branchPhone}</div>
              )}
              {currentTemplate.showTaxNumber && (
                <div style={{ fontSize: currentTemplate.fontSizeSmall }}>الرقم الضريبي: {previewData.taxNumber}</div>
              )}
            </div>

            {currentTemplate.showSeparator && (
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
            )}

            {/* Invoice Info */}
            {currentTemplate.showInvoiceNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>فاتورة رقم:</span>
                <span>{previewData.invoiceNumber}</span>
              </div>
            )}
            {currentTemplate.showDateTime && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>التاريخ:</span>
                  <span>{previewData.invoiceDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>الوقت:</span>
                  <span>{previewData.invoiceTime}</span>
                </div>
              </>
            )}
            {currentTemplate.showCashier && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الكاشير:</span>
                <span>{previewData.cashierName}</span>
              </div>
            )}

            {currentTemplate.showSeparator && (
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
            )}

            {/* Items */}
            {previewData.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                {currentTemplate.showProductName && (
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: currentTemplate.fontSizeSmall }}>
                  <span>{currentTemplate.showQuantity ? `${item.quantity} × ` : ''}{currentTemplate.showUnitPrice ? formatCurrency(item.unitPrice, currency) : ''}</span>
                  <span>{formatCurrency(item.total, currency)}</span>
                </div>
              </div>
            ))}

            {currentTemplate.showSeparator && (
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
            )}

            {/* Totals */}
            {currentTemplate.showSubtotal && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المجموع الفرعي:</span>
                <span>{formatCurrency(previewData.subtotal, currency)}</span>
              </div>
            )}
            {currentTemplate.showDiscountTotal && previewData.discountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الخصم:</span>
                <span>-{formatCurrency(previewData.discountTotal, currency)}</span>
              </div>
            )}
            {currentTemplate.showTaxTotal && previewData.taxTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الضريبة:</span>
                <span>{formatCurrency(previewData.taxTotal, currency)}</span>
              </div>
            )}
            {currentTemplate.showTotal && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: currentTemplate.fontSizeTotal,
                fontWeight: 'bold',
                marginTop: '4px',
              }}>
                <span>الإجمالي:</span>
                <span>{formatCurrency(previewData.total, currency)}</span>
              </div>
            )}
            {currentTemplate.showPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المدفوع:</span>
                <span>{formatCurrency(previewData.paid, currency)}</span>
              </div>
            )}
            {currentTemplate.showChange && previewData.change > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الباقي:</span>
                <span>{formatCurrency(previewData.change, currency)}</span>
              </div>
            )}

            {currentTemplate.showSeparator && (
              <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
            )}

            {/* Footer */}
            {currentTemplate.showThankYou && (
              <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: 'bold' }}>
                {previewData.thankYouMessage}
              </div>
            )}
            {currentTemplate.showInvoiceBarcode && (
              <div style={{ textAlign: 'center', margin: '8px 0', fontFamily: 'monospace', fontSize: '10px' }}>
                ║{previewData.invoiceNumber}║
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
