'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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
}

// ==================== Mock Printers Data ====================
const mockPrinters: PrinterConfig[] = [
  {
    id: '1',
    name: 'EPSON TM-T88VI',
    type: 'thermal',
    connectionType: 'usb',
    paperWidth: 80,
    autoCut: true,
    openDrawer: true,
    isDefault: true,
    isConnected: true,
  },
  {
    id: '2',
    name: 'Star TSP143III',
    type: 'thermal',
    connectionType: 'network',
    paperWidth: 80,
    ip: '192.168.1.100',
    port: 9100,
    autoCut: true,
    openDrawer: true,
    isDefault: false,
    isConnected: false,
  },
  {
    id: '3',
    name: 'POS-5890',
    type: 'thermal',
    connectionType: 'bluetooth',
    paperWidth: 58,
    autoCut: true,
    openDrawer: false,
    isDefault: false,
    isConnected: false,
  },
];

// ==================== المكون الرئيسي ====================
export function PrinterSelector({
  onPrinterSelect,
  onPrinterTest,
}: PrinterSelectorProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>(mockPrinters);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // الإعدادات المؤقتة
  const [tempSettings, setTempSettings] = useState({
    paperWidth: 80 as 58 | 80,
    autoCut: true,
    openDrawer: true,
    ip: '',
    port: 9100,
  });

  // مسح الطابعات المتاحة
  const scanPrinters = useCallback(async () => {
    setIsScanning(true);
    try {
      // محاولة اكتشاف طابعات USB
      if ('usb' in navigator) {
        try {
          const device = await (navigator as Navigator & { usb: USB }).usb.requestDevice({
            filters: [{ classCode: 7 }],
          });
          if (device) {
            toast.success('تم اكتشاف طابعة جديدة');
          }
        } catch {
          // المستخدم ألغى الاختيار
        }
      }
      
      // تحديث حالة الاتصال
      setPrinters(prev => prev.map(p => ({
        ...p,
        isConnected: Math.random() > 0.3,
      })));
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
      // محاولة الاتصال الحقيقية
      let success = false;
      
      if (onPrinterTest) {
        success = await onPrinterTest(selectedPrinter);
      } else {
        // محاكاة الاختبار
        await new Promise(resolve => setTimeout(resolve, 1500));
        success = selectedPrinter.connectionType === 'usb' || 
          (selectedPrinter.ip !== undefined && selectedPrinter.ip !== '');
      }
      
      setTestResult(success ? 'success' : 'error');
      setPrinters(prev => prev.map(p => 
        p.id === selectedPrinter.id ? { ...p, isConnected: success } : p
      ));
      
      if (success) {
        toast.success('تم الاتصال بالطابعة بنجاح');
      } else {
        toast.error('فشل الاتصال بالطابعة');
      }
    } catch {
      setTestResult('error');
      toast.error('حدث خطأ أثناء الاختبار');
    } finally {
      setIsTesting(false);
    }
  }, [selectedPrinter, onPrinterTest]);

  // اختيار طابعة
  const handleSelectPrinter = useCallback((printer: PrinterConfig) => {
    setSelectedPrinter(printer);
    setTempSettings({
      paperWidth: printer.paperWidth,
      autoCut: printer.autoCut,
      openDrawer: printer.openDrawer,
      ip: printer.ip || '',
      port: printer.port || 9100,
    });
    onPrinterSelect?.(printer);
    setTestResult(null);
  }, [onPrinterSelect]);

  // حفظ الإعدادات
  const handleSaveSettings = useCallback(() => {
    if (!selectedPrinter) return;
    
    const updatedPrinter: PrinterConfig = {
      ...selectedPrinter,
      paperWidth: tempSettings.paperWidth,
      autoCut: tempSettings.autoCut,
      openDrawer: tempSettings.openDrawer,
      ip: tempSettings.ip || undefined,
      port: tempSettings.port,
    };
    
    setPrinters(prev => prev.map(p => 
      p.id === selectedPrinter.id ? updatedPrinter : p
    ));
    setSelectedPrinter(updatedPrinter);
    setShowSettings(false);
    toast.success('تم حفظ الإعدادات');
  }, [selectedPrinter, tempSettings]);

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

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات الطباعة</h2>
          <p className="text-muted-foreground">اختر الطابعة وقم بتكوين الإعدادات</p>
        </div>
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
          بحث عن طابعات
        </Button>
      </div>

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
                    {printer.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        افتراضي
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
                <div className="grid gap-4 md:grid-cols-2">
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
                      <Badge variant={selectedPrinter.autoCut ? 'default' : 'secondary'}>
                        {selectedPrinter.autoCut ? 'نعم' : 'لا'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">فتح الدرج:</span>
                      <Badge variant={selectedPrinter.openDrawer ? 'default' : 'secondary'}>
                        {selectedPrinter.openDrawer ? 'نعم' : 'لا'}
                      </Badge>
                    </div>
                    {selectedPrinter.connectionType === 'network' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">العنوان:</span>
                        <span className="font-medium">
                          {selectedPrinter.ip}:{selectedPrinter.port}
                        </span>
                      </div>
                    )}
                  </div>
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
            <Button onClick={handleSaveSettings}>
              حفظ الإعدادات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PrinterSelector;
