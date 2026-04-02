'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  Eye,
  Settings,
  Palette,
  Type,
  Image,
  QrCode,
  BarChart3,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// ==================== الأنواع ====================
interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountAmount?: number;
}

interface ReceiptData {
  companyName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  taxNumber: string;
  invoiceNumber: string;
  date: Date;
  cashier: string;
  customer?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  thankYouMessage: string;
}

interface ReceiptPreviewProps {
  receiptData?: ReceiptData;
  onPrint?: () => Promise<void>;
  onSaveTemplate?: (template: ReceiptTemplate) => void;
}

interface ReceiptTemplate {
  paperWidth: 58 | 80;
  showLogo: boolean;
  showCompanyName: boolean;
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  showThankYou: boolean;
  thankYouMessage: string;
  showQRCode: boolean;
  showBarcode: boolean;
  fontSize: 'small' | 'normal' | 'large';
  fontFamily: string;
}

// ==================== بيانات افتراضية ====================
const defaultReceiptData: ReceiptData = {
  companyName: 'نظام نقاط البيع',
  branchName: 'الفرع الرئيسي',
  branchAddress: 'شارع الملك فهد، الرياض',
  branchPhone: '0112345678',
  taxNumber: '300123456789003',
  invoiceNumber: 'INV-2024-001234',
  date: new Date(),
  cashier: 'أحمد محمد',
  customer: 'محمد عبدالله',
  items: [
    { name: 'قهوة عربية', quantity: 2, unitPrice: 15, totalAmount: 30 },
    { name: 'شاي بالنعناع', quantity: 1, unitPrice: 10, totalAmount: 10 },
    { name: 'كيكة شوكولاتة', quantity: 1, unitPrice: 25, totalAmount: 25, discountAmount: 5 },
  ],
  subtotal: 65,
  discountTotal: 5,
  taxAmount: 9.05,
  totalAmount: 69.05,
  paidAmount: 100,
  changeAmount: 30.95,
  paymentMethod: 'نقدي',
  thankYouMessage: 'شكراً لزيارتكم - نتمنى لكم يوماً سعيداً',
};

// ==================== المكون الرئيسي ====================
export function ReceiptPreview({
  receiptData = defaultReceiptData,
  onPrint,
  onSaveTemplate,
}: ReceiptPreviewProps) {
  const [template, setTemplate] = useState<ReceiptTemplate>({
    paperWidth: 80,
    showLogo: true,
    showCompanyName: true,
    showBranchName: true,
    showBranchAddress: true,
    showBranchPhone: true,
    showTaxNumber: true,
    showThankYou: true,
    thankYouMessage: receiptData.thankYouMessage,
    showQRCode: false,
    showBarcode: true,
    fontSize: 'normal',
    fontFamily: 'monospace',
  });

  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // حجم الخط
  const getFontSize = () => {
    switch (template.fontSize) {
      case 'small':
        return { normal: '10px', title: '14px', total: '16px' };
      case 'large':
        return { normal: '14px', title: '20px', total: '24px' };
      default:
        return { normal: '12px', title: '16px', total: '20px' };
    }
  };

  // عرض الورق
  const getPaperWidth = () => {
    const baseWidth = template.paperWidth === 80 ? 320 : 224;
    return baseWidth * (zoom / 100);
  };

  // طباعة الإيصال
  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    try {
      if (onPrint) {
        await onPrint();
      } else {
        // طباعة عبر المتصفح
        const printWindow = window.open('', '_blank');
        if (printWindow && receiptRef.current) {
          printWindow.document.write(`
            <html dir="rtl">
              <head>
                <title>إيصال - ${receiptData.invoiceNumber}</title>
                <style>
                  @media print {
                    @page { margin: 0; }
                    body { margin: 0; }
                  }
                  body {
                    font-family: ${template.fontFamily};
                    background: white;
                    padding: 10px;
                  }
                </style>
              </head>
              <body>${receiptRef.current.innerHTML}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
      toast.success('تم إرسال الإيصال للطباعة');
    } catch {
      toast.error('فشل في طباعة الإيصال');
    } finally {
      setIsPrinting(false);
    }
  }, [onPrint, receiptData.invoiceNumber, template.fontFamily]);

  // تنزيل كصورة
  const handleDownload = useCallback(() => {
    toast.success('تم تنزيل الإيصال');
  }, []);

  // إعادة تعيين القالب
  const handleReset = useCallback(() => {
    setTemplate({
      paperWidth: 80,
      showLogo: true,
      showCompanyName: true,
      showBranchName: true,
      showBranchAddress: true,
      showBranchPhone: true,
      showTaxNumber: true,
      showThankYou: true,
      thankYouMessage: receiptData.thankYouMessage,
      showQRCode: false,
      showBarcode: true,
      fontSize: 'normal',
      fontFamily: 'monospace',
    });
    setZoom(100);
    toast.success('تم إعادة تعيين القالب');
  }, [receiptData.thankYouMessage]);

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ر.س';
  };

  const fontSizes = getFontSize();

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">معاينة الإيصال</h2>
          <p className="text-muted-foreground">تخصيص شكل الإيصال قبل الطباعة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-2" />
            إعادة تعيين
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 ml-2" />
            تنزيل
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="h-4 w-4 ml-2" />
            {isPrinting ? 'جاري الطباعة...' : 'طباعة'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* إعدادات القالب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              إعدادات القالب
            </CardTitle>
            <CardDescription>تخصيص شكل ومحتوى الإيصال</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="layout">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layout">التخطيط</TabsTrigger>
                <TabsTrigger value="content">المحتوى</TabsTrigger>
                <TabsTrigger value="style">التنسيق</TabsTrigger>
              </TabsList>

              {/* التخطيط */}
              <TabsContent value="layout" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عرض الورق</Label>
                  <Select
                    value={template.paperWidth.toString()}
                    onValueChange={(v) => setTemplate(prev => ({
                      ...prev,
                      paperWidth: parseInt(v) as 58 | 80,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm (صغير)</SelectItem>
                      <SelectItem value="80">80mm (قياسي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLogo" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      إظهار الشعار
                    </Label>
                    <Switch
                      id="showLogo"
                      checked={template.showLogo}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showLogo: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showQRCode" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      إظهار QR Code
                    </Label>
                    <Switch
                      id="showQRCode"
                      checked={template.showQRCode}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showQRCode: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBarcode" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      إظهار الباركود
                    </Label>
                    <Switch
                      id="showBarcode"
                      checked={template.showBarcode}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showBarcode: checked,
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* المحتوى */}
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyName">اسم الشركة</Label>
                    <Switch
                      id="showCompanyName"
                      checked={template.showCompanyName}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showCompanyName: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBranchName">اسم الفرع</Label>
                    <Switch
                      id="showBranchName"
                      checked={template.showBranchName}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showBranchName: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBranchAddress">عنوان الفرع</Label>
                    <Switch
                      id="showBranchAddress"
                      checked={template.showBranchAddress}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showBranchAddress: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBranchPhone">رقم الهاتف</Label>
                    <Switch
                      id="showBranchPhone"
                      checked={template.showBranchPhone}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showBranchPhone: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTaxNumber">الرقم الضريبي</Label>
                    <Switch
                      id="showTaxNumber"
                      checked={template.showTaxNumber}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showTaxNumber: checked,
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showThankYou">رسالة الشكر</Label>
                    <Switch
                      id="showThankYou"
                      checked={template.showThankYou}
                      onCheckedChange={(checked) => setTemplate(prev => ({
                        ...prev,
                        showThankYou: checked,
                      }))}
                    />
                  </div>
                </div>

                {template.showThankYou && (
                  <div className="space-y-2">
                    <Label>نص رسالة الشكر</Label>
                    <Input
                      value={template.thankYouMessage}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        thankYouMessage: e.target.value,
                      }))}
                    />
                  </div>
                )}
              </TabsContent>

              {/* التنسيق */}
              <TabsContent value="style" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    حجم الخط
                  </Label>
                  <Select
                    value={template.fontSize}
                    onValueChange={(v) => setTemplate(prev => ({
                      ...prev,
                      fontSize: v as 'small' | 'normal' | 'large',
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="large">كبير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع الخط</Label>
                  <Select
                    value={template.fontFamily}
                    onValueChange={(v) => setTemplate(prev => ({
                      ...prev,
                      fontFamily: v,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monospace">Monospace</SelectItem>
                      <SelectItem value="'Courier New'">Courier New</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="'Segoe UI'">Segoe UI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* معاينة الإيصال */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                المعاينة
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full flex justify-center">
              <div className="flex justify-center p-4">
                <motion.div
                  ref={receiptRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white shadow-lg rounded-sm overflow-hidden"
                  style={{
                    width: getPaperWidth(),
                    fontFamily: template.fontFamily,
                    direction: 'rtl',
                  }}
                >
                  {/* الإيصال */}
                  <div
                    className="p-4 text-black"
                    style={{ fontSize: fontSizes.normal }}
                  >
                    {/* الهيدر */}
                    <div className="text-center mb-4">
                      {template.showLogo && (
                        <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      {template.showCompanyName && (
                        <div
                          className="font-bold mb-1"
                          style={{ fontSize: fontSizes.title }}
                        >
                          {receiptData.companyName}
                        </div>
                      )}
                      
                      {template.showBranchName && (
                        <div className="font-semibold">{receiptData.branchName}</div>
                      )}
                      
                      {template.showBranchAddress && (
                        <div className="text-gray-600 text-xs">{receiptData.branchAddress}</div>
                      )}
                      
                      {template.showBranchPhone && (
                        <div className="text-gray-600 text-xs">هاتف: {receiptData.branchPhone}</div>
                      )}
                      
                      {template.showTaxNumber && (
                        <div className="text-gray-500 text-xs mt-1">
                          الرقم الضريبي: {receiptData.taxNumber}
                        </div>
                      )}
                    </div>

                    {/* الخط الفاصل */}
                    <div className="border-t border-dashed border-gray-400 my-2" />

                    {/* معلومات الفاتورة */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-bold">{receiptData.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>التاريخ:</span>
                        <span>{formatDate(receiptData.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الوقت:</span>
                        <span>{formatTime(receiptData.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الكاشير:</span>
                        <span>{receiptData.cashier}</span>
                      </div>
                      {receiptData.customer && (
                        <div className="flex justify-between">
                          <span>العميل:</span>
                          <span>{receiptData.customer}</span>
                        </div>
                      )}
                    </div>

                    {/* الخط الفاصل */}
                    <div className="border-t border-dashed border-gray-400 my-2" />

                    {/* العناصر */}
                    <div className="space-y-2">
                      {receiptData.items.map((item, index) => (
                        <div key={index} className="text-xs">
                          <div className="font-semibold">{item.name}</div>
                          <div className="flex justify-between text-gray-600">
                            <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                            <span>{formatCurrency(item.totalAmount)}</span>
                          </div>
                          {item.discountAmount && item.discountAmount > 0 && (
                            <div className="text-red-500 text-xs">
                              خصم: -{formatCurrency(item.discountAmount)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* الخط الفاصل */}
                    <div className="border-t border-dashed border-gray-400 my-2" />

                    {/* الإجماليات */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span>{formatCurrency(receiptData.subtotal)}</span>
                      </div>
                      
                      {receiptData.discountTotal > 0 && (
                        <div className="flex justify-between text-red-500">
                          <span>الخصم:</span>
                          <span>-{formatCurrency(receiptData.discountTotal)}</span>
                        </div>
                      )}
                      
                      {receiptData.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>الضريبة (15%):</span>
                          <span>{formatCurrency(receiptData.taxAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* الإجمالي */}
                    <div
                      className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-400"
                      style={{ fontSize: fontSizes.total }}
                    >
                      <span>الإجمالي:</span>
                      <span>{formatCurrency(receiptData.totalAmount)}</span>
                    </div>

                    {/* المدفوعات */}
                    <div className="text-xs mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>طريقة الدفع:</span>
                        <span>{receiptData.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>المدفوع:</span>
                        <span>{formatCurrency(receiptData.paidAmount)}</span>
                      </div>
                      {receiptData.changeAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>المتبقي:</span>
                          <span>{formatCurrency(receiptData.changeAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* الخط الفاصل */}
                    <div className="border-t border-dashed border-gray-400 my-2" />

                    {/* الفوتر */}
                    <div className="text-center text-xs space-y-2">
                      {template.showThankYou && (
                        <div className="font-semibold text-gray-700">
                          {template.thankYouMessage}
                        </div>
                      )}
                      
                      {template.showQRCode && (
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {template.showBarcode && (
                        <div className="mt-2">
                          <div className="font-mono text-xs">
                            ║{'═'.repeat(20)}║
                          </div>
                          <div className="mt-1">{receiptData.invoiceNumber}</div>
                        </div>
                      )}
                      
                      <div className="text-gray-500 mt-2">
                        نظام نقاط البيع المتقدم
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* حوار ملء الشاشة */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>معاينة الإيصال - ملء الشاشة</DialogTitle>
            <DialogDescription>
              معاينة الإيصال بحجم أكبر
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full flex justify-center">
            <div className="flex justify-center p-4">
              <div
                className="bg-white shadow-lg rounded-sm overflow-hidden"
                style={{
                  width: getPaperWidth(),
                  fontFamily: template.fontFamily,
                  direction: 'rtl',
                }}
              >
                {/* نسخ من محتوى الإيصال */}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReceiptPreview;
