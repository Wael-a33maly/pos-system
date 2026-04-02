'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  Usb,
  Wifi,
  Bluetooth,
  Check,
  X,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  FileText,
  LayoutTemplate,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  Clock,
  List,
  BarChart3,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { printerDiscovery, DiscoveredPrinter, PrinterStatus } from '@/lib/printer/printer-discovery';
import { printQueue, PrintJob, PrintQueueStats, PrintLogEntry } from '@/lib/printer/print-queue';
import { 
  DEFAULT_RECEIPT_TEMPLATE, 
  COMPACT_RECEIPT_TEMPLATE, 
  DETAILED_RECEIPT_TEMPLATE,
  ReceiptTemplateConfig,
} from '@/lib/printer/templates/receipt-template';
import {
  DEFAULT_Z_REPORT_TEMPLATE,
  COMPACT_Z_REPORT_TEMPLATE,
} from '@/lib/printer/templates/z-report-template';
import {
  DEFAULT_SHIFT_CLOSE_TEMPLATE,
  COMPACT_SHIFT_CLOSE_TEMPLATE,
} from '@/lib/printer/templates/shift-close-template';

// ==================== الأنواع ====================
interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'bluetooth';
  paperWidth: 58 | 80;
  ip?: string;
  port?: number;
  autoCut: boolean;
  openDrawer: boolean;
  isDefault: boolean;
  isConnected: boolean;
}

interface PrinterSelectorProps {
  onPrinterSelect?: (printer: PrinterConfig) => void;
  onPrinterTest?: (printer: PrinterConfig) => Promise<boolean>;
  branchId?: string;
}

// ==================== القوالب المتاحة ====================
const RECEIPT_TEMPLATES = [
  { id: 'default', name: 'قالب افتراضي', nameEn: 'Default', template: DEFAULT_RECEIPT_TEMPLATE },
  { id: 'compact', name: 'قالب مختصر', nameEn: 'Compact', template: COMPACT_RECEIPT_TEMPLATE },
  { id: 'detailed', name: 'قالب مفصل', nameEn: 'Detailed', template: DETAILED_RECEIPT_TEMPLATE },
];

const Z_REPORT_TEMPLATES = [
  { id: 'default', name: 'قالب افتراضي', template: DEFAULT_Z_REPORT_TEMPLATE },
  { id: 'compact', name: 'قالب مختصر', template: COMPACT_Z_REPORT_TEMPLATE },
];

const SHIFT_CLOSE_TEMPLATES = [
  { id: 'default', name: 'قالب افتراضي', template: DEFAULT_SHIFT_CLOSE_TEMPLATE },
  { id: 'compact', name: 'قالب مختصر', template: COMPACT_SHIFT_CLOSE_TEMPLATE },
];

// ==================== بيانات الإيصال للمعاينة ====================
const PREVIEW_INVOICE = {
  invoiceNumber: 'INV-2024-001',
  createdAt: new Date(),
  branch: {
    name: 'فرع الرياض الرئيسي',
    address: 'شارع الملك فهد، الرياض',
    phone: '0112345678',
    taxNumber: '300123456789003',
    logoUrl: null,
  },
  user: { name: 'أحمد محمد' },
  customer: { name: 'محمد علي' },
  isReturn: false,
  items: [
    { product: { name: 'منتج تجريبي 1' }, productName: 'منتج تجريبي 1', variant: { name: 'كبير' }, quantity: 2, unitPrice: 25.00, totalAmount: 50.00, discountAmount: 0 },
    { product: { name: 'منتج تجريبي 2' }, productName: 'منتج تجريبي 2', variant: null, quantity: 1, unitPrice: 100.00, totalAmount: 100.00, discountAmount: 10 },
  ],
  subtotal: 150.00,
  discountAmount: 10.00,
  taxAmount: 21.00,
  totalAmount: 161.00,
  paidAmount: 200.00,
  changeAmount: 39.00,
  payments: [
    { paymentMethod: { nameAr: 'نقدي' }, amount: 200.00 },
  ],
};

// ==================== المكون الرئيسي ====================
export function PrinterSelector({
  onPrinterSelect,
  onPrinterTest,
  branchId = 'default',
}: PrinterSelectorProps) {
  // الحالات
  const [printers, setPrinters] = useState<DiscoveredPrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<DiscoveredPrinter | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('printers');
  
  // إعدادات الطابعة
  const [tempSettings, setTempSettings] = useState({
    paperWidth: 80 as 58 | 80,
    autoCut: true,
    openDrawer: true,
    ip: '',
    port: 9100,
  });
  
  // القوالب
  const [selectedReceiptTemplate, setSelectedReceiptTemplate] = useState('default');
  const [selectedZReportTemplate, setSelectedZReportTemplate] = useState('default');
  const [selectedShiftCloseTemplate, setSelectedShiftCloseTemplate] = useState('default');
  
  // الطابور
  const [queueStats, setQueueStats] = useState<PrintQueueStats | null>(null);
  const [pendingJobs, setPendingJobs] = useState<PrintJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<PrintJob[]>([]);
  const [printLogs, setPrintLogs] = useState<PrintLogEntry[]>([]);

  // مسح الطابعات
  const scanPrinters = useCallback(async () => {
    setIsScanning(true);
    try {
      const discovered = await printerDiscovery.discoverAll({
        usb: true,
        network: true,
        bluetooth: true,
      });
      setPrinters(discovered);
      toast.success(`تم اكتشاف ${discovered.length} طابعة`);
    } catch (error) {
      toast.error('فشل في البحث عن الطابعات');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // اختبار الاتصال
  const testConnection = useCallback(async () => {
    if (!selectedPrinter) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await printerDiscovery.testConnection(selectedPrinter);
      setTestResult(result.success ? 'success' : 'error');
      
      if (result.success) {
        toast.success('تم الاتصال بالطابعة بنجاح');
      } else {
        toast.error(result.message || 'فشل الاتصال بالطابعة');
      }
      
      // تحديث الحالة
      const status = await printerDiscovery.checkStatus(selectedPrinter);
      setPrinterStatus(status);
    } catch {
      setTestResult('error');
      toast.error('حدث خطأ أثناء الاختبار');
    } finally {
      setIsTesting(false);
    }
  }, [selectedPrinter]);

  // اختيار طابعة
  const handleSelectPrinter = useCallback((printer: DiscoveredPrinter) => {
    setSelectedPrinter(printer);
    setTempSettings({
      paperWidth: printer.paperWidth,
      autoCut: printer.capabilities.autoCut,
      openDrawer: printer.capabilities.cashDrawer,
      ip: printer.ip || '',
      port: printer.port || 9100,
    });
    onPrinterSelect?.(printerDiscovery.toPrinterConfig(printer));
    setTestResult(null);
    
    // فحص الحالة
    printerDiscovery.checkStatus(printer).then(setPrinterStatus);
  }, [onPrinterSelect]);

  // تحديث إحصائيات الطابور
  const updateQueueStats = useCallback(() => {
    const stats = printQueue.getStats();
    setQueueStats(stats);
    setPendingJobs(printQueue.getPendingJobs());
    setCompletedJobs(printQueue.getCompletedJobs(20));
    setPrintLogs(printQueue.getLogs(50));
  }, []);

  // إرسال مهمة اختبار
  const sendTestJob = useCallback(async () => {
    if (!selectedPrinter) {
      toast.error('الرجاء اختيار طابعة أولاً');
      return;
    }
    
    try {
      const job = printQueue.addJob({
        type: 'test',
        data: { test: true },
        printerConfig: printerDiscovery.toPrinterConfig(selectedPrinter),
        priority: 'high',
        copies: 1,
        branchId,
      });
      
      toast.success(`تم إرسال مهمة الاختبار (${job.id})`);
      updateQueueStats();
    } catch (error) {
      toast.error('فشل في إرسال مهمة الاختبار');
    }
  }, [selectedPrinter, branchId, updateQueueStats]);

  // تحديث الطابور
  useEffect(() => {
    updateQueueStats();
    
    // الاشتراك في أحداث الطابور
    printQueue.on('jobCompleted', updateQueueStats);
    printQueue.on('jobFailed', updateQueueStats);
    printQueue.on('jobAdded', updateQueueStats);
    
    const interval = setInterval(updateQueueStats, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [updateQueueStats]);

  // تحميل الطابعات عند البداية
  useEffect(() => {
    const savedPrinters = printerDiscovery.getDiscoveredPrinters();
    if (savedPrinters.length > 0) {
      setPrinters(savedPrinters);
    }
  }, []);

  // أيقونة نوع الاتصال
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'bluetooth':
        return <Bluetooth className="h-4 w-4" />;
      default:
        return <Printer className="h-4 w-4" />;
    }
  };

  // لون نوع الطابعة
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'thermal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'laser':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'inkjet':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // حالة الطابعة
  const getStatusBadge = (status: PrintJobStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: 'في الانتظار',
      processing: 'قيد المعالجة',
      completed: 'مكتمل',
      failed: 'فشل',
      cancelled: 'ملغى',
    };
    return (
      <Badge className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات الطباعة</h2>
          <p className="text-muted-foreground">إدارة الطابعات والقوالب وطابور الطباعة</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 ml-2" />
            معاينة
          </Button>
          <Button
            variant="outline"
            onClick={scanPrinters}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 ml-2" />
            )}
            بحث
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="printers">
            <Printer className="h-4 w-4 ml-2" />
            الطابعات
          </TabsTrigger>
          <TabsTrigger value="templates">
            <LayoutTemplate className="h-4 w-4 ml-2" />
            القوالب
          </TabsTrigger>
          <TabsTrigger value="queue">
            <List className="h-4 w-4 ml-2" />
            الطابور
            {queueStats && queueStats.pendingJobs > 0 && (
              <Badge variant="destructive" className="mr-2">
                {queueStats.pendingJobs}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="h-4 w-4 ml-2" />
            السجل
          </TabsTrigger>
        </TabsList>

        {/* تبويب الطابعات */}
        <TabsContent value="printers" className="space-y-4">
          {/* قائمة الطابعات */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {printers.map((printer, index) => (
                <motion.div
                  key={printer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPrinter?.id === printer.id
                        ? 'ring-2 ring-primary border-primary'
                        : ''
                    }`}
                    onClick={() => handleSelectPrinter(printer)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${getTypeColor(printer.type)}`}>
                            {getConnectionIcon(printer.connectionType)}
                          </div>
                          <div>
                            <CardTitle className="text-base">{printer.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {printer.connectionType === 'network' && printer.ip
                                ? printer.ip
                                : printer.connectionType === 'usb'
                                ? 'USB'
                                : 'Bluetooth'}
                            </CardDescription>
                          </div>
                        </div>
                        {printer.isConnected && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            متصل
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {printer.isConnected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {printer.isConnected ? 'متصل' : 'غير متصل'}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {printer.paperWidth}mm
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* تفاصيل الطابعة المختارة */}
          <AnimatePresence>
            {selectedPrinter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>تفاصيل الطابعة</CardTitle>
                        <CardDescription>{selectedPrinter.name}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSettings(true)}
                        >
                          <Settings className="h-4 w-4 ml-2" />
                          إعدادات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={sendTestJob}
                        >
                          <FileText className="h-4 w-4 ml-2" />
                          طباعة اختبار
                        </Button>
                        <Button
                          size="sm"
                          onClick={testConnection}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                          اختبار الاتصال
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">النوع:</span>
                          <span className="font-medium">
                            {selectedPrinter.type === 'thermal' ? 'حرارية' :
                             selectedPrinter.type === 'laser' ? 'ليزر' : 'حبر'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">الاتصال:</span>
                          <span className="font-medium">
                            {selectedPrinter.connectionType === 'usb' ? 'USB' :
                             selectedPrinter.connectionType === 'network' ? 'شبكة' : 'بلوتوث'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">عرض الورق:</span>
                          <span className="font-medium">{selectedPrinter.paperWidth}mm</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">قص تلقائي:</span>
                          <Badge variant={selectedPrinter.capabilities.autoCut ? 'default' : 'secondary'}>
                            {selectedPrinter.capabilities.autoCut ? 'نعم' : 'لا'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">فتح الدرج:</span>
                          <Badge variant={selectedPrinter.capabilities.cashDrawer ? 'default' : 'secondary'}>
                            {selectedPrinter.capabilities.cashDrawer ? 'نعم' : 'لا'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">QR Code:</span>
                          <Badge variant={selectedPrinter.capabilities.qrCode ? 'default' : 'secondary'}>
                            {selectedPrinter.capabilities.qrCode ? 'مدعوم' : 'غير مدعوم'}
                          </Badge>
                        </div>
                      </div>
                      {printerStatus && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">الحالة:</span>
                            <Badge variant={printerStatus.isOnline ? 'default' : 'destructive'}>
                              {printerStatus.isOnline ? 'متصل' : 'غير متصل'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">الورق:</span>
                            <Badge variant={printerStatus.paperStatus === 'ok' ? 'default' : 'destructive'}>
                              {printerStatus.paperStatus === 'ok' ? 'كافٍ' : 
                               printerStatus.paperStatus === 'low' ? 'منخفض' : 'فارغ'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">الغطاء:</span>
                            <Badge variant={printerStatus.coverStatus === 'closed' ? 'default' : 'destructive'}>
                              {printerStatus.coverStatus === 'closed' ? 'مغلق' : 'مفتوح'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* نتيجة الاختبار */}
                    <AnimatePresence>
                      {testResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4"
                        >
                          <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
                            {testResult === 'success' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>
                              {testResult === 'success' ? 'نجح الاتصال' : 'فشل الاتصال'}
                            </AlertTitle>
                            <AlertDescription>
                              {testResult === 'success'
                                ? 'الطابعة متصلة وجاهزة للعمل'
                                : 'تأكد من تشغيل الطابعة وتوصيلها بشكل صحيح'}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* إضافة طابعة يدوياً */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة طابعة يدوياً</CardTitle>
              <CardDescription>أدخل عنوان IP للطابعة الشبكية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="192.168.1.100"
                    value={tempSettings.ip}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, ip: e.target.value }))}
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="المنفذ"
                    value={tempSettings.port}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 9100 }))}
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (tempSettings.ip) {
                      const printer = await printerDiscovery.discoverByIP(tempSettings.ip, tempSettings.port);
                      if (printer) {
                        setPrinters(prev => {
                          if (!prev.find(p => p.id === printer.id)) {
                            return [...prev, printer];
                          }
                          return prev;
                        });
                        toast.success('تم إضافة الطابعة');
                      } else {
                        toast.error('لم يتم العثور على طابعة على هذا العنوان');
                      }
                    }
                  }}
                >
                  إضافة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب القوالب */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* قالب الإيصال */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  قالب الإيصال
                </CardTitle>
                <CardDescription>اختر قالب طباعة الإيصالات</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedReceiptTemplate}
                  onValueChange={setSelectedReceiptTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECEIPT_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>عرض الورق: {RECEIPT_TEMPLATES.find(t => t.id === selectedReceiptTemplate)?.template.paperWidth}mm</p>
                  <p>الباركود: {RECEIPT_TEMPLATES.find(t => t.id === selectedReceiptTemplate)?.template.showInvoiceBarcode ? 'نعم' : 'لا'}</p>
                </div>
              </CardContent>
            </Card>

            {/* قالب تقرير Z */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  قالب تقرير Z
                </CardTitle>
                <CardDescription>اختر قالب تقارير Z</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedZReportTemplate}
                  onValueChange={setSelectedZReportTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Z_REPORT_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>عرض الورق: {Z_REPORT_TEMPLATES.find(t => t.id === selectedZReportTemplate)?.template.paperWidth}mm</p>
                </div>
              </CardContent>
            </Card>

            {/* قالب إغلاق الوردية */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  قالب إغلاق الوردية
                </CardTitle>
                <CardDescription>اختر قالب إغلاق الورديات</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedShiftCloseTemplate}
                  onValueChange={setSelectedShiftCloseTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_CLOSE_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>عرض الورق: {SHIFT_CLOSE_TEMPLATES.find(t => t.id === selectedShiftCloseTemplate)?.template.paperWidth}mm</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الطابور */}
        <TabsContent value="queue" className="space-y-4">
          {/* إحصائيات */}
          {queueStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{queueStats.totalJobs}</div>
                  <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{queueStats.pendingJobs}</div>
                  <p className="text-sm text-muted-foreground">في الانتظار</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{queueStats.completedJobs}</div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{queueStats.successRate.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">معدل النجاح</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => printQueue.pause()}>
              <Pause className="h-4 w-4 ml-2" />
              إيقاف
            </Button>
            <Button variant="outline" onClick={() => printQueue.resume()}>
              <Play className="h-4 w-4 ml-2" />
              استئناف
            </Button>
            <Button variant="outline" onClick={() => printQueue.clearQueue()}>
              <Trash2 className="h-4 w-4 ml-2" />
              مسح الطابور
            </Button>
          </div>

          {/* قائمة المهام */}
          <Card>
            <CardHeader>
              <CardTitle>المهام في الطابور</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {pendingJobs.length === 0 && completedJobs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    لا توجد مهام في الطابور
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...pendingJobs, ...completedJobs.slice(0, 10)].map(job => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {job.type === 'invoice' ? 'إيصال' :
                               job.type === 'z_report' ? 'تقرير Z' :
                               job.type === 'shift_close' ? 'إغلاق وردية' :
                               job.type === 'test' ? 'اختبار' : job.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.referenceNumber || job.id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                          {job.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => printQueue.cancelJob(job.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => printQueue.retryJob(job.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب السجل */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سجل الطباعة</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    printQueue.clearLogs();
                    setPrintLogs([]);
                    toast.success('تم مسح السجل');
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  مسح السجل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {printLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    لا يوجد سجل طباعة
                  </div>
                ) : (
                  <div className="space-y-2">
                    {printLogs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : log.status === 'failed' ? (
                            <X className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <div className="font-medium">
                              {log.type === 'invoice' ? 'إيصال' :
                               log.type === 'z_report' ? 'تقرير Z' :
                               log.type === 'shift_close' ? 'إغلاق وردية' : log.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.referenceNumber} • {log.printerName}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('ar-SA')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* حوار الإعدادات */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات الطابعة</DialogTitle>
            <DialogDescription>
              تخصيص إعدادات الطابعة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* عرض الورق */}
            <div className="space-y-2">
              <Label>عرض الورق</Label>
              <Select
                value={tempSettings.paperWidth.toString()}
                onValueChange={(v) => setTempSettings(prev => ({
                  ...prev,
                  paperWidth: parseInt(v) as 58 | 80,
                }))}
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

            {/* إعدادات الشبكة */}
            {selectedPrinter?.connectionType === 'network' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>عنوان IP</Label>
                    <Input
                      placeholder="192.168.1.100"
                      value={tempSettings.ip}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        ip: e.target.value,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المنفذ</Label>
                    <Input
                      type="number"
                      placeholder="9100"
                      value={tempSettings.port}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        port: parseInt(e.target.value) || 9100,
                      }))}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* خيارات الطباعة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCut">قص تلقائي</Label>
                <Switch
                  id="autoCut"
                  checked={tempSettings.autoCut}
                  onCheckedChange={(checked) => setTempSettings(prev => ({
                    ...prev,
                    autoCut: checked,
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="openDrawer">فتح درج النقدية</Label>
                <Switch
                  id="openDrawer"
                  checked={tempSettings.openDrawer}
                  onCheckedChange={(checked) => setTempSettings(prev => ({
                    ...prev,
                    openDrawer: checked,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              إلغاء
            </Button>
            <Button onClick={() => {
              setShowSettings(false);
              toast.success('تم حفظ الإعدادات');
            }}>
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار المعاينة */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>معاينة الإيصال</DialogTitle>
            <DialogDescription>
              معاينة شكل الإيصال مع القالب المختار
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-96">
            <div className="bg-white p-4 rounded-lg border font-mono text-sm" dir="rtl">
              {/* معاينة الإيصال */}
              <div className="text-center mb-4">
                <div className="text-lg font-bold">نظام نقاط البيع</div>
                <div className="text-sm">{PREVIEW_INVOICE.branch.name}</div>
                <div className="text-xs text-gray-500">{PREVIEW_INVOICE.branch.address}</div>
                <div className="text-xs text-gray-500">هاتف: {PREVIEW_INVOICE.branch.phone}</div>
              </div>
              
              <div className="border-t border-dashed my-2" />
              
              <div className="text-sm">
                <div>رقم: {PREVIEW_INVOICE.invoiceNumber}</div>
                <div>التاريخ: {new Date(PREVIEW_INVOICE.createdAt).toLocaleDateString('ar-SA')}</div>
                <div>الكاشير: {PREVIEW_INVOICE.user.name}</div>
                {PREVIEW_INVOICE.customer && (
                  <div>العميل: {PREVIEW_INVOICE.customer.name}</div>
                )}
              </div>
              
              <div className="border-t border-dashed my-2" />
              
              <div className="text-xs">
                <div className="flex justify-between font-bold">
                  <span>الصنف</span>
                  <span>الكمية</span>
                  <span>الإجمالي</span>
                </div>
                <div className="border-t border-dashed my-1" />
                {PREVIEW_INVOICE.items.map((item, i) => (
                  <div key={i} className="mb-2">
                    <div>{item.productName}</div>
                    <div className="flex justify-between text-gray-600">
                      <span></span>
                      <span>{item.quantity}</span>
                      <span>{item.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed my-2" />
              
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{PREVIEW_INVOICE.subtotal.toFixed(2)}</span>
                </div>
                {PREVIEW_INVOICE.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>-{PREVIEW_INVOICE.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {PREVIEW_INVOICE.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{PREVIEW_INVOICE.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-dashed my-1" />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي:</span>
                  <span>{PREVIEW_INVOICE.totalAmount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>المدفوع:</span>
                  <span>{PREVIEW_INVOICE.paidAmount.toFixed(2)}</span>
                </div>
                {PREVIEW_INVOICE.changeAmount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>الباقي:</span>
                    <span>{PREVIEW_INVOICE.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-dashed my-2" />
              
              <div className="text-center">
                <div className="font-bold">شكراً لزيارتكم</div>
                <div className="text-xs text-gray-500">*** {PREVIEW_INVOICE.invoiceNumber} ***</div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إغلاق
            </Button>
            <Button onClick={() => {
              // طباعة المعاينة
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html dir="rtl">
                    <head>
                      <title>معاينة الإيصال</title>
                      <style>
                        body { font-family: monospace; font-size: 12px; padding: 10px; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .separator { border-top: 1px dashed #000; margin: 5px 0; }
                      </style>
                    </head>
                    <body>${document.querySelector('.bg-white.p-4')?.innerHTML || ''}</body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
              }
            }}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// نوع حالة المهمة
type PrintJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export default PrinterSelector;
