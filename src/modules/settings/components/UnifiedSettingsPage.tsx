'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Store,
  DollarSign,
  Printer,
  Globe,
  Bell,
  CreditCard,
  Building2,
  QrCode,
  Save,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  FileText,
  Sparkles,
  Zap,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Branch } from '@/types';
import { useToast } from '@/hooks/use-toast';

const settingsTabs = [
  { value: 'general', label: 'عام', icon: SettingsIcon, color: 'text-gray-500' },
  { value: 'company', label: 'الشركة', icon: Store, color: 'text-blue-500' },
  { value: 'currency', label: 'العملات', icon: DollarSign, color: 'text-green-500' },
  { value: 'payment-methods', label: 'طرق الدفع', icon: CreditCard, color: 'text-purple-500' },
  { value: 'invoice', label: 'الفواتير', icon: FileText, color: 'text-rose-500' },
  { value: 'pos', label: 'نقطة البيع', icon: Globe, color: 'text-amber-500' },
  { value: 'notifications', label: 'التنبيهات', icon: Bell, color: 'text-cyan-500' },
  { value: 'branches', label: 'الفروع', icon: Building2, color: 'text-indigo-500' },
  { value: 'print', label: 'الطباعة', icon: Printer, color: 'text-orange-500' },
  { value: 'barcode', label: 'الباركود', icon: QrCode, color: 'text-teal-500' },
];

export function UnifiedSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useAppStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    const validTabs = settingsTabs.map(t => t.value);
    return tab && validTabs.includes(tab) ? tab : 'general';
  }, [searchParams]);
  
  const handleTabChange = (tab: string) => {
    router.push(`/?page=settings&tab=${tab}`);
  };
  
  // Settings State
  const [settings, setSettings] = useState({
    companyName: 'شركة نقاط البيع',
    companyNameAr: 'نقاط البيع للتقنية',
    companyPhone: '920000000',
    companyEmail: 'info@pos.com',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    taxNumber: '300000000000003',
    defaultCurrency: 'SAR',
    decimalPlaces: 2,
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    showTaxOnInvoice: true,
    showLogoOnInvoice: true,
    invoiceNotes: 'شكراً لتعاملكم معنا',
    defaultPaymentMethod: 'cash',
    askForCustomer: false,
    printAfterSale: true,
    soundEnabled: true,
    lowStockAlert: true,
    lowStockThreshold: 5,
    dailyReportEmail: true,
    reportEmail: '',
    language: 'ar',
    timezone: 'asia-riyadh',
    startDate: '',
    // POS Settings
    showDiscount: true,
    allowMultiPayment: true,
  });

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'Cash', nameAr: 'نقدي', code: 'CASH', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Credit Card', nameAr: 'بطاقة ائتمان', code: 'CARD', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'KNET', nameAr: 'كي نت', code: 'KNET', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({ name: '', nameAr: '', code: '', isActive: true });

  // Branches State
  const [branches, setBranches] = useState<Branch[]>([
    { id: '1', name: 'الفرع الرئيسي - الرياض', nameAr: 'الفرع الرئيسي', address: 'الرياض، حي العليا', phone: '0112345678', email: 'main@pos.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'فرع جدة', nameAr: 'فرع جدة', address: 'جدة، حي الحمراء', phone: '0123456789', email: 'jeddah@pos.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'فرع الدمام', nameAr: 'فرع الدمام', address: 'الدمام، حي الفيصلية', phone: '0134567890', email: 'dammam@pos.com', isActive: false, createdAt: new Date(), updatedAt: new Date() },
  ]);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showDeleteBranchDialog, setShowDeleteBranchDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '', nameAr: '', address: '', phone: '', email: '', isActive: true
  });

  // Print Settings State
  const [printSettings, setPrintSettings] = useState({
    paperSize: '80mm',
    autoPrint: true,
    showLogo: true,
    showTax: true,
    copies: 1,
    footerText: 'شكراً لزيارتكم',
  });

  // Barcode Settings State
  const [barcodeSettings, setBarcodeSettings] = useState({
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
  });

  // Currencies State
  const [currencies, setCurrencies] = useState([
    { id: '1', name: 'Saudi Riyal', nameAr: 'ريال سعودي', code: 'SAR', symbol: 'ر.س', decimalPlaces: 2, isDefault: true, isActive: true },
    { id: '2', name: 'UAE Dirham', nameAr: 'درهم إماراتي', code: 'AED', symbol: 'د.إ', decimalPlaces: 2, isDefault: false, isActive: true },
    { id: '3', name: 'Egyptian Pound', nameAr: 'جنيه مصري', code: 'EGP', symbol: 'ج.م', decimalPlaces: 2, isDefault: false, isActive: true },
    { id: '4', name: 'US Dollar', nameAr: 'دولار أمريكي', code: 'USD', symbol: '$', decimalPlaces: 2, isDefault: false, isActive: true },
  ]);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<typeof currencies[0] | null>(null);
  const [currencyFormData, setCurrencyFormData] = useState({
    name: '', nameAr: '', code: '', symbol: '', decimalPlaces: 2, isActive: true
  });

  // Currency Functions
  const handleSaveCurrency = () => {
    if (selectedCurrency) {
      setCurrencies(prev => prev.map(c => 
        c.id === selectedCurrency.id ? { ...c, ...currencyFormData } : c
      ));
    } else {
      setCurrencies(prev => [...prev, {
        id: Date.now().toString(),
        ...currencyFormData,
        isDefault: false,
      }]);
    }
    setShowCurrencyDialog(false);
    resetCurrencyForm();
  };

  const handleDeleteCurrency = (id: string) => {
    const currency = currencies.find(c => c.id === id);
    if (currency?.isDefault) {
      return; // Cannot delete default currency
    }
    setCurrencies(prev => prev.filter(c => c.id !== id));
  };

  const handleSetDefaultCurrency = (id: string) => {
    setCurrencies(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === id,
    })));
    const defaultCurrency = currencies.find(c => c.id === id);
    if (defaultCurrency) {
      setSettings(prev => ({ ...prev, defaultCurrency: defaultCurrency.code }));
    }
  };

  const resetCurrencyForm = () => {
    setCurrencyFormData({ name: '', nameAr: '', code: '', symbol: '', decimalPlaces: 2, isActive: true });
    setSelectedCurrency(null);
  };

  const openEditCurrency = (currency: typeof currencies[0]) => {
    setSelectedCurrency(currency);
    setCurrencyFormData({
      name: currency.name,
      nameAr: currency.nameAr,
      code: currency.code,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
    });
    setShowCurrencyDialog(true);
  };

  // Logo State
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setCompanyLogo(data.url);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
  };

  // Payment Methods Functions
  const filteredPaymentMethods = paymentMethods.filter(m =>
    m.name.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
    m.nameAr?.includes(paymentSearchQuery)
  );

  const handleSavePaymentMethod = () => {
    if (selectedPaymentMethod) {
      setPaymentMethods(prev => prev.map(m => 
        m.id === selectedPaymentMethod.id ? { ...m, ...paymentFormData } : m
      ));
    } else {
      setPaymentMethods(prev => [...prev, {
        id: Date.now().toString(),
        ...paymentFormData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
    setShowPaymentDialog(false);
    resetPaymentForm();
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const resetPaymentForm = () => {
    setPaymentFormData({ name: '', nameAr: '', code: '', isActive: true });
    setSelectedPaymentMethod(null);
  };

  const openEditPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentFormData({
      name: method.name,
      nameAr: method.nameAr || '',
      code: method.code,
      isActive: method.isActive,
    });
    setShowPaymentDialog(true);
  };

  // Branches Functions
  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(branchSearchQuery.toLowerCase())
  );

  const handleSaveBranch = () => {
    if (selectedBranch) {
      setBranches(prev => prev.map(b => b.id === selectedBranch.id ? { ...b, ...branchFormData } : b));
    } else {
      setBranches(prev => [...prev, { id: Date.now().toString(), ...branchFormData, createdAt: new Date(), updatedAt: new Date() }]);
    }
    setShowBranchDialog(false);
    resetBranchForm();
  };

  const handleDeleteBranch = () => {
    if (selectedBranch) {
      setBranches(prev => prev.filter(b => b.id !== selectedBranch.id));
      setShowDeleteBranchDialog(false);
      setSelectedBranch(null);
    }
  };

  const resetBranchForm = () => {
    setBranchFormData({ name: '', nameAr: '', address: '', phone: '', email: '', isActive: true });
    setSelectedBranch(null);
  };

  const openEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setBranchFormData({
      name: branch.name,
      nameAr: branch.nameAr || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isActive: branch.isActive,
    });
    setShowBranchDialog(true);
  };

  // Save All Settings
  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // General Settings
          language: settings.language,
          timezone: settings.timezone,
          startDate: settings.startDate,
          theme: theme,
          // Company Settings
          companyName: settings.companyName,
          companyNameAr: settings.companyNameAr,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          companyAddress: settings.companyAddress,
          taxNumber: settings.taxNumber,
          companyLogo: companyLogo,
          // Currency Settings
          defaultCurrency: settings.defaultCurrency,
          decimalPlaces: settings.decimalPlaces,
          currencies: JSON.stringify(currencies),
          // Invoice Settings
          invoicePrefix: settings.invoicePrefix,
          invoiceStartNumber: settings.invoiceStartNumber,
          showTaxOnInvoice: settings.showTaxOnInvoice,
          showLogoOnInvoice: settings.showLogoOnInvoice,
          invoiceNotes: settings.invoiceNotes,
          // POS Settings
          defaultPaymentMethod: settings.defaultPaymentMethod,
          askForCustomer: settings.askForCustomer,
          printAfterSale: settings.printAfterSale,
          soundEnabled: settings.soundEnabled,
          showDiscount: settings.showDiscount,
          allowMultiPayment: settings.allowMultiPayment,
          // Notification Settings
          lowStockAlert: settings.lowStockAlert,
          lowStockThreshold: settings.lowStockThreshold,
          dailyReportEmail: settings.dailyReportEmail,
          reportEmail: settings.reportEmail,
          // Print Settings
          printSettings: JSON.stringify(printSettings),
          // Barcode Settings
          barcodeSettings: JSON.stringify(barcodeSettings),
          // Payment Methods
          paymentMethods: JSON.stringify(paymentMethods),
          // Branches
          branches: JSON.stringify(branches),
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم حفظ جميع الإعدادات بنجاح',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ الإعدادات',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50 bg-gradient-to-l from-muted/30 to-transparent shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5"
            >
              <SettingsIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">الإعدادات</h1>
              <p className="text-muted-foreground text-sm">إدارة جميع إعدادات النظام من مكان واحد</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={handleSaveAllSettings}
              disabled={isSaving}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          {/* Horizontal Tabs */}
          <div className="px-6 pt-4 shrink-0 border-b border-border/50 bg-background">
            <ScrollArea className="w-full" orientation="horizontal">
              <TabsList className="flex w-max gap-1 h-auto p-1 bg-transparent">
                {settingsTabs.map((tab, index) => (
                  <motion.div
                    key={tab.value}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TabsTrigger
                      value={tab.value}
                      className={cn(
                        "gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                        "data-[state=active]:shadow-lg data-[state=active]:scale-105",
                        "hover:bg-muted/50"
                      )}
                    >
                      <tab.icon className={cn("h-4 w-4", tab.color)} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Tab Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* General Settings */}
              <TabsContent value="general" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <SettingsIcon className="h-5 w-5 text-primary" />
                          الإعدادات العامة
                        </CardTitle>
                        <CardDescription>إعدادات النظام الأساسية</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label>اللغة الافتراضية</Label>
                            <Select value={settings.language} onValueChange={(v) => setSettings({...settings, language: v})}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ar">العربية</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>المنطقة الزمنية</Label>
                            <Select value={settings.timezone} onValueChange={(v) => setSettings({...settings, timezone: v})}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asia-riyadh">الرياض (GMT+3)</SelectItem>
                                <SelectItem value="asia-dubai">دبي (GMT+4)</SelectItem>
                                <SelectItem value="africa-cairo">القاهرة (GMT+2)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>تاريخ البدء</Label>
                            <Input 
                              type="date" 
                              value={settings.startDate}
                              onChange={(e) => setSettings({...settings, startDate: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>سمة الواجهة</Label>
                            <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">فاتح</SelectItem>
                                <SelectItem value="dark">داكن</SelectItem>
                                <SelectItem value="system">تلقائي</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Company Settings */}
                <TabsContent value="company" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Company Logo Card */}
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-blue-500" />
                          شعار الشركة
                        </CardTitle>
                        <CardDescription>قم برفع شعار الشركة لاستخدامه في الفواتير والتقارير</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          {/* Logo Preview */}
                          <div className="relative group">
                            {companyLogo ? (
                              <div className="relative">
                                <div className="w-32 h-32 rounded-2xl border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                                  <img 
                                    src={companyLogo} 
                                    alt="شعار الشركة" 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={handleRemoveLogo}
                                  className="absolute -top-2 -left-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <X className="h-4 w-4" />
                                </motion.button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">لا يوجد شعار</span>
                              </div>
                            )}
                          </div>

                          {/* Upload Area */}
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col gap-3">
                              <label
                                htmlFor="logo-upload"
                                className={cn(
                                  "flex items-center justify-center gap-2 px-6 py-4 rounded-xl cursor-pointer transition-all",
                                  "border-2 border-dashed border-muted-foreground/30 hover:border-primary/50",
                                  "bg-muted/20 hover:bg-muted/40",
                                  isUploadingLogo && "pointer-events-none opacity-50"
                                )}
                              >
                                {isUploadingLogo ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Sparkles className="h-5 w-5 text-primary" />
                                  </motion.div>
                                ) : (
                                  <Upload className="h-5 w-5 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {isUploadingLogo ? 'جاري الرفع...' : 'اضغط لرفع الشعار'}
                                </span>
                              </label>
                              <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={isUploadingLogo}
                              />
                              <p className="text-xs text-muted-foreground text-center">
                                الأحجام الموصى بها: 200x200 بكسل • الحد الأقصى: 5MB • الصيغ: PNG, JPG, SVG
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Company Info Card */}
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-blue-500" />
                          معلومات الشركة
                        </CardTitle>
                        <CardDescription>البيانات الأساسية للشركة</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>اسم الشركة (عربي)</Label>
                            <Input 
                              value={settings.companyNameAr}
                              onChange={(e) => setSettings({...settings, companyNameAr: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>اسم الشركة (إنجليزي)</Label>
                            <Input 
                              value={settings.companyName}
                              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الهاتف</Label>
                            <Input 
                              value={settings.companyPhone}
                              onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input 
                              type="email"
                              value={settings.companyEmail}
                              onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الرقم الضريبي</Label>
                            <Input 
                              value={settings.taxNumber}
                              onChange={(e) => setSettings({...settings, taxNumber: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label>العنوان</Label>
                            <Textarea 
                              value={settings.companyAddress}
                              onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                              className="rounded-xl min-h-[80px]"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Currency Settings */}
                <TabsContent value="currency" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">إجمالي العملات</p>
                          <p className="text-3xl font-bold">{currencies.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">العملات النشطة</p>
                          <p className="text-3xl font-bold text-emerald-600">{currencies.filter(c => c.isActive).length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">العملة الافتراضية</p>
                          <p className="text-xl font-bold text-primary">
                            {currencies.find(c => c.isDefault)?.nameAr || '-'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => { resetCurrencyForm(); setShowCurrencyDialog(true); }} className="gap-2 rounded-xl">
                        <Plus className="h-4 w-4" /> إضافة عملة
                      </Button>
                    </div>

                    {/* Currencies Table */}
                    <Card className="border-border/50 shadow-lg">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>العملة</TableHead>
                              <TableHead>الكود</TableHead>
                              <TableHead>الرمز</TableHead>
                              <TableHead>الخانات العشرية</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currencies.map(currency => (
                              <TableRow key={currency.id} className={cn(currency.isDefault && "bg-primary/5")}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                      <DollarSign className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{currency.nameAr}</p>
                                      <p className="text-xs text-muted-foreground">{currency.name}</p>
                                    </div>
                                    {currency.isDefault && (
                                      <Badge className="mr-2 rounded-lg" variant="default">افتراضية</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="bg-muted px-2 py-1 rounded-lg text-sm">{currency.code}</code>
                                </TableCell>
                                <TableCell className="text-lg font-medium">{currency.symbol}</TableCell>
                                <TableCell>{currency.decimalPlaces}</TableCell>
                                <TableCell>
                                  <Badge variant={currency.isActive ? 'default' : 'secondary'} className="rounded-lg">
                                    {currency.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {!currency.isDefault && (
                                        <DropdownMenuItem onClick={() => handleSetDefaultCurrency(currency.id)}>
                                          <DollarSign className="ml-2 h-4 w-4" /> تعيين كافتراضية
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => openEditCurrency(currency)}>
                                        <Edit className="ml-2 h-4 w-4" /> تعديل
                                      </DropdownMenuItem>
                                      {!currency.isDefault && (
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCurrency(currency.id)}>
                                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Payment Methods */}
                <TabsContent value="payment-methods" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="بحث في طرق الدفع..." 
                          value={paymentSearchQuery} 
                          onChange={(e) => setPaymentSearchQuery(e.target.value)} 
                          className="pr-10 rounded-xl"
                        />
                      </div>
                      <Button onClick={() => { resetPaymentForm(); setShowPaymentDialog(true); }} className="gap-2 rounded-xl">
                        <Plus className="h-4 w-4" /> إضافة طريقة دفع
                      </Button>
                    </div>

                    <Card className="border-border/50 shadow-lg">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>طريقة الدفع</TableHead>
                              <TableHead>الكود</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPaymentMethods.map(method => (
                              <TableRow key={method.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                      <CreditCard className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{method.name}</p>
                                      <p className="text-xs text-muted-foreground">{method.nameAr}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="bg-muted px-2 py-1 rounded-lg text-sm">{method.code}</code>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={method.isActive ? 'default' : 'secondary'} className="rounded-lg">
                                    {method.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditPaymentMethod(method)}>
                                        <Edit className="ml-2 h-4 w-4" /> تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePaymentMethod(method.id)}>
                                        <Trash2 className="ml-2 h-4 w-4" /> حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Invoice Settings */}
                <TabsContent value="invoice" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-rose-500" />
                          إعدادات الفواتير
                        </CardTitle>
                        <CardDescription>تخصيص شكل ومحتوى الفواتير</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>بادئة رقم الفاتورة</Label>
                            <Input 
                              value={settings.invoicePrefix}
                              onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم البداية</Label>
                            <Input 
                              type="number"
                              value={settings.invoiceStartNumber}
                              onChange={(e) => setSettings({...settings, invoiceStartNumber: parseInt(e.target.value)})}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">إظهار الضريبة</p>
                              <p className="text-sm text-muted-foreground">عرض قيمة الضريبة على الفاتورة</p>
                            </div>
                            <Switch 
                              checked={settings.showTaxOnInvoice}
                              onCheckedChange={(v) => setSettings({...settings, showTaxOnInvoice: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">إظهار الشعار</p>
                              <p className="text-sm text-muted-foreground">عرض شعار الشركة على الفاتورة</p>
                            </div>
                            <Switch 
                              checked={settings.showLogoOnInvoice}
                              onCheckedChange={(v) => setSettings({...settings, showLogoOnInvoice: v})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>ملاحظات الفاتورة</Label>
                          <Textarea 
                            value={settings.invoiceNotes}
                            onChange={(e) => setSettings({...settings, invoiceNotes: e.target.value})}
                            placeholder="ملاحظات تظهر في نهاية الفاتورة"
                            className="rounded-xl min-h-[80px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* POS Settings */}
                <TabsContent value="pos" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-amber-500" />
                          إعدادات نقطة البيع
                        </CardTitle>
                        <CardDescription>تخصيص تجربة نقطة البيع</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">طلب العميل</p>
                              <p className="text-sm text-muted-foreground">طلب اختيار العميل قبل كل عملية</p>
                            </div>
                            <Switch 
                              checked={settings.askForCustomer}
                              onCheckedChange={(v) => setSettings({...settings, askForCustomer: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">إظهار الخصم</p>
                              <p className="text-sm text-muted-foreground">إظهار حقل الخصم في شاشة نقطة البيع</p>
                            </div>
                            <Switch 
                              checked={settings.showDiscount}
                              onCheckedChange={(v) => setSettings({...settings, showDiscount: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">الدفع المتعدد</p>
                              <p className="text-sm text-muted-foreground">السماح بالدفع بأكثر من طريقة</p>
                            </div>
                            <Switch 
                              checked={settings.allowMultiPayment}
                              onCheckedChange={(v) => setSettings({...settings, allowMultiPayment: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">طباعة تلقائية</p>
                              <p className="text-sm text-muted-foreground">طباعة الفاتورة تلقائياً بعد البيع</p>
                            </div>
                            <Switch 
                              checked={settings.printAfterSale}
                              onCheckedChange={(v) => setSettings({...settings, printAfterSale: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">تفعيل الصوت</p>
                              <p className="text-sm text-muted-foreground">تشغيل أصوات التنبيه</p>
                            </div>
                            <Switch 
                              checked={settings.soundEnabled}
                              onCheckedChange={(v) => setSettings({...settings, soundEnabled: v})}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="max-w-sm space-y-2">
                          <Label>طريقة الدفع الافتراضية</Label>
                          <Select 
                            value={settings.defaultPaymentMethod}
                            onValueChange={(v) => setSettings({...settings, defaultPaymentMethod: v})}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">نقداً</SelectItem>
                              <SelectItem value="card">بطاقة</SelectItem>
                              <SelectItem value="mobile">كي نت</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-cyan-500" />
                          إعدادات التنبيهات
                        </CardTitle>
                        <CardDescription>إدارة التنبيهات والإشعارات</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">تنبيه المخزون المنخفض</p>
                              <p className="text-sm text-muted-foreground">إرسال تنبيه عند انخفاض المخزون</p>
                            </div>
                            <Switch 
                              checked={settings.lowStockAlert}
                              onCheckedChange={(v) => setSettings({...settings, lowStockAlert: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">التقرير اليومي</p>
                              <p className="text-sm text-muted-foreground">إرسال تقرير يومي عبر البريد</p>
                            </div>
                            <Switch 
                              checked={settings.dailyReportEmail}
                              onCheckedChange={(v) => setSettings({...settings, dailyReportEmail: v})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>حد التنبيه للمخزون المنخفض</Label>
                            <Input 
                              type="number"
                              value={settings.lowStockThreshold}
                              onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>بريد استلام التقارير</Label>
                            <Input 
                              type="email"
                              value={settings.reportEmail}
                              onChange={(e) => setSettings({...settings, reportEmail: e.target.value})}
                              placeholder="reports@company.com"
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Branches */}
                <TabsContent value="branches" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">إجمالي الفروع</p>
                          <p className="text-3xl font-bold">{branches.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">الفروع النشطة</p>
                          <p className="text-3xl font-bold text-emerald-600">{branches.filter(b => b.isActive).length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">الفروع غير النشطة</p>
                          <p className="text-3xl font-bold text-red-600">{branches.filter(b => !b.isActive).length}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="بحث في الفروع..." 
                          value={branchSearchQuery} 
                          onChange={(e) => setBranchSearchQuery(e.target.value)} 
                          className="pr-10 rounded-xl"
                        />
                      </div>
                      <Button onClick={() => { resetBranchForm(); setShowBranchDialog(true); }} className="gap-2 rounded-xl">
                        <Plus className="h-4 w-4" /> إضافة فرع
                      </Button>
                    </div>

                    <Card className="border-border/50 shadow-lg">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>الفرع</TableHead>
                              <TableHead>العنوان</TableHead>
                              <TableHead>الهاتف</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBranches.map(branch => (
                              <TableRow key={branch.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                      <Building2 className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{branch.name}</p>
                                      {branch.nameAr && <p className="text-xs text-muted-foreground">{branch.nameAr}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {branch.address ? (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      {branch.address}
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {branch.phone ? (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      {branch.phone}
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={branch.isActive ? 'default' : 'secondary'} className="rounded-lg">
                                    {branch.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditBranch(branch)}>
                                        <Edit className="ml-2 h-4 w-4" /> تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedBranch(branch); setShowDeleteBranchDialog(true); }}>
                                        <Trash2 className="ml-2 h-4 w-4" /> حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Print Settings */}
                <TabsContent value="print" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-orange-500" />
                          إعدادات الطباعة
                        </CardTitle>
                        <CardDescription>تخصيص إعدادات الطابعة</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>حجم الورق</Label>
                            <Select 
                              value={printSettings.paperSize}
                              onValueChange={(v) => setPrintSettings({...printSettings, paperSize: v})}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="80mm">80mm</SelectItem>
                                <SelectItem value="58mm">58mm</SelectItem>
                                <SelectItem value="A4">A4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>عدد النسخ</Label>
                            <Input 
                              type="number"
                              value={printSettings.copies}
                              onChange={(e) => setPrintSettings({...printSettings, copies: parseInt(e.target.value)})}
                              min={1}
                              max={5}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">طباعة تلقائية</p>
                              <p className="text-sm text-muted-foreground">طباعة تلقائية بعد كل عملية</p>
                            </div>
                            <Switch 
                              checked={printSettings.autoPrint}
                              onCheckedChange={(v) => setPrintSettings({...printSettings, autoPrint: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">إظهار الشعار</p>
                              <p className="text-sm text-muted-foreground">عرض شعار الشركة على الطباعة</p>
                            </div>
                            <Switch 
                              checked={printSettings.showLogo}
                              onCheckedChange={(v) => setPrintSettings({...printSettings, showLogo: v})}
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div>
                              <p className="font-medium">إظهار الضريبة</p>
                              <p className="text-sm text-muted-foreground">عرض تفاصيل الضريبة</p>
                            </div>
                            <Switch 
                              checked={printSettings.showTax}
                              onCheckedChange={(v) => setPrintSettings({...printSettings, showTax: v})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>نص التذييل</Label>
                          <Textarea 
                            value={printSettings.footerText}
                            onChange={(e) => setPrintSettings({...printSettings, footerText: e.target.value})}
                            placeholder="نص يظهر في نهاية الطباعة"
                            className="rounded-xl min-h-[80px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Barcode Settings */}
                <TabsContent value="barcode" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <QrCode className="h-5 w-5 text-teal-500" />
                          إعدادات الباركود
                        </CardTitle>
                        <CardDescription>تخصيص إعدادات طباعة الباركود</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label>صيغة الباركود</Label>
                            <Select 
                              value={barcodeSettings.format}
                              onValueChange={(v) => setBarcodeSettings({...barcodeSettings, format: v})}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CODE128">CODE128</SelectItem>
                                <SelectItem value="EAN13">EAN13</SelectItem>
                                <SelectItem value="CODE39">CODE39</SelectItem>
                                <SelectItem value="UPC">UPC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>العرض</Label>
                            <Input 
                              type="number"
                              value={barcodeSettings.width}
                              onChange={(e) => setBarcodeSettings({...barcodeSettings, width: parseInt(e.target.value)})}
                              min={1}
                              max={5}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الارتفاع</Label>
                            <Input 
                              type="number"
                              value={barcodeSettings.height}
                              onChange={(e) => setBarcodeSettings({...barcodeSettings, height: parseInt(e.target.value)})}
                              min={50}
                              max={200}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>حجم الخط</Label>
                            <Input 
                              type="number"
                              value={barcodeSettings.fontSize}
                              onChange={(e) => setBarcodeSettings({...barcodeSettings, fontSize: parseInt(e.target.value)})}
                              min={10}
                              max={24}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الهامش العلوي</Label>
                            <Input 
                              type="number"
                              value={barcodeSettings.marginTop}
                              onChange={(e) => setBarcodeSettings({...barcodeSettings, marginTop: parseInt(e.target.value)})}
                              min={0}
                              max={30}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الهامش السفلي</Label>
                            <Input 
                              type="number"
                              value={barcodeSettings.marginBottom}
                              onChange={(e) => setBarcodeSettings({...barcodeSettings, marginBottom: parseInt(e.target.value)})}
                              min={0}
                              max={30}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl max-w-sm">
                          <div>
                            <p className="font-medium">إظهار القيمة</p>
                            <p className="text-sm text-muted-foreground">عرض القيمة أسفل الباركود</p>
                          </div>
                          <Switch 
                            checked={barcodeSettings.displayValue}
                            onCheckedChange={(v) => setBarcodeSettings({...barcodeSettings, displayValue: v})}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPaymentMethod ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input 
                  value={paymentFormData.name} 
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, name: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input 
                  value={paymentFormData.nameAr} 
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, nameAr: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الكود *</Label>
              <Input 
                value={paymentFormData.code} 
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} 
                placeholder="CASH" 
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch 
                checked={paymentFormData.isActive} 
                onCheckedChange={(v) => setPaymentFormData(prev => ({ ...prev, isActive: v }))} 
              />
              <Label>طريقة دفع نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleSavePaymentMethod} className="rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الفرع *</Label>
                <Input 
                  value={branchFormData.name} 
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, name: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربي</Label>
                <Input 
                  value={branchFormData.nameAr} 
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, nameAr: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input 
                value={branchFormData.address} 
                onChange={(e) => setBranchFormData(prev => ({ ...prev, address: e.target.value }))} 
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input 
                  value={branchFormData.phone} 
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, phone: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  type="email" 
                  value={branchFormData.email} 
                  onChange={(e) => setBranchFormData(prev => ({ ...prev, email: e.target.value }))} 
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch 
                checked={branchFormData.isActive} 
                onCheckedChange={(v) => setBranchFormData(prev => ({ ...prev, isActive: v }))} 
              />
              <Label>فرع نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleSaveBranch} className="rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={showDeleteBranchDialog} onOpenChange={setShowDeleteBranchDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف "{selectedBranch?.name}"؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteBranchDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteBranch} className="rounded-xl">حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCurrency ? 'تعديل العملة' : 'إضافة عملة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input 
                  value={currencyFormData.name} 
                  onChange={(e) => setCurrencyFormData(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="Saudi Riyal"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input 
                  value={currencyFormData.nameAr} 
                  onChange={(e) => setCurrencyFormData(prev => ({ ...prev, nameAr: e.target.value }))} 
                  placeholder="ريال سعودي"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>كود العملة *</Label>
                <Input 
                  value={currencyFormData.code} 
                  onChange={(e) => setCurrencyFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} 
                  placeholder="SAR"
                  maxLength={3}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>الرمز *</Label>
                <Input 
                  value={currencyFormData.symbol} 
                  onChange={(e) => setCurrencyFormData(prev => ({ ...prev, symbol: e.target.value }))} 
                  placeholder="ر.س"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>عدد الخانات العشرية</Label>
              <Select 
                value={currencyFormData.decimalPlaces.toString()}
                onValueChange={(v) => setCurrencyFormData(prev => ({ ...prev, decimalPlaces: parseInt(v) }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Switch 
                checked={currencyFormData.isActive} 
                onCheckedChange={(v) => setCurrencyFormData(prev => ({ ...prev, isActive: v }))} 
              />
              <Label>عملة نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCurrencyDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleSaveCurrency} className="rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
