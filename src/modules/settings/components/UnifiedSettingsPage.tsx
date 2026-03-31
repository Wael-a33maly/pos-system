// ============================================
// Unified Settings Page - صفحة الإعدادات الموحدة
// تم تحسينها مع Code Splitting و Lazy Loading
// ============================================

'use client';

import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
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
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// استيراد الأنواع والقيم الافتراضية
import type { 
  SettingsState, 
  PrintSettingsState, 
  BarcodeSettingsState, 
  CurrencyData,
  PaymentMethod,
  Branch
} from './tabs/types';
import {
  defaultSettings,
  defaultPrintSettings,
  defaultBarcodeSettings,
  defaultCurrencies,
  defaultPaymentMethods,
  defaultBranches,
} from './tabs/types';

// ============================================
// Lazy Loading للمكونات - تحسين الأداء
// ============================================
const GeneralSettings = lazy(() => 
  import('./tabs/GeneralSettings').then(m => ({ default: m.GeneralSettings }))
);

const CompanySettings = lazy(() => 
  import('./tabs/CompanySettings').then(m => ({ default: m.CompanySettings }))
);

const CurrencySettings = lazy(() => 
  import('./tabs/CurrencySettings').then(m => ({ default: m.CurrencySettings }))
);

const PaymentMethodsSettings = lazy(() => 
  import('./tabs/PaymentMethodsSettings').then(m => ({ default: m.PaymentMethodsSettings }))
);

const InvoiceSettings = lazy(() => 
  import('./tabs/InvoiceSettings').then(m => ({ default: m.InvoiceSettings }))
);

const POSSettings = lazy(() => 
  import('./tabs/POSSettings').then(m => ({ default: m.POSSettings }))
);

const NotificationSettings = lazy(() => 
  import('./tabs/NotificationSettings').then(m => ({ default: m.NotificationSettings }))
);

const BranchesSettings = lazy(() => 
  import('./tabs/BranchesSettings').then(m => ({ default: m.BranchesSettings }))
);

const PrintSettings = lazy(() => 
  import('./tabs/PrintSettings').then(m => ({ default: m.PrintSettings }))
);

const BarcodeSettings = lazy(() => 
  import('./tabs/BarcodeSettings').then(m => ({ default: m.BarcodeSettings }))
);

// ============================================
// مكون التحميل المؤقت
// ============================================
function SettingsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ============================================
// تعريف التبويبات
// ============================================
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
] as const;

// ============================================
// المكون الرئيسي
// ============================================
export function UnifiedSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useAppStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // تحديد التبويب النشط
  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    const validTabs = settingsTabs.map(t => t.value);
    return tab && validTabs.includes(tab) ? tab : 'general';
  }, [searchParams]);
  
  const handleTabChange = (tab: string) => {
    router.push(`/?page=settings&tab=${tab}`);
  };
  
  // ============================================
  // الحالات - State Management
  // ============================================
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [printSettings, setPrintSettings] = useState<PrintSettingsState>(defaultPrintSettings);
  const [barcodeSettings, setBarcodeSettings] = useState<BarcodeSettingsState>(defaultBarcodeSettings);
  const [currencies, setCurrencies] = useState<CurrencyData[]>(defaultCurrencies);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [branches, setBranches] = useState<Branch[]>(defaultBranches);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // ============================================
  // حفظ جميع الإعدادات
  // ============================================
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

  // ============================================
  // العرض - Render
  // ============================================
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
                <Suspense fallback={<SettingsSkeleton />}>
                  <GeneralSettings settings={settings} setSettings={setSettings} />
                </Suspense>
              </TabsContent>

              {/* Company Settings */}
              <TabsContent value="company" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <CompanySettings 
                    settings={settings} 
                    setSettings={setSettings} 
                    companyLogo={companyLogo}
                    setCompanyLogo={setCompanyLogo}
                  />
                </Suspense>
              </TabsContent>

              {/* Currency Settings */}
              <TabsContent value="currency" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <CurrencySettings currencies={currencies} setCurrencies={setCurrencies} />
                </Suspense>
              </TabsContent>

              {/* Payment Methods */}
              <TabsContent value="payment-methods" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <PaymentMethodsSettings paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} />
                </Suspense>
              </TabsContent>

              {/* Invoice Settings */}
              <TabsContent value="invoice" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <InvoiceSettings settings={settings} setSettings={setSettings} />
                </Suspense>
              </TabsContent>

              {/* POS Settings */}
              <TabsContent value="pos" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <POSSettings settings={settings} setSettings={setSettings} />
                </Suspense>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <NotificationSettings settings={settings} setSettings={setSettings} />
                </Suspense>
              </TabsContent>

              {/* Branches */}
              <TabsContent value="branches" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <BranchesSettings branches={branches} setBranches={setBranches} />
                </Suspense>
              </TabsContent>

              {/* Print Settings */}
              <TabsContent value="print" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <PrintSettings printSettings={printSettings} setPrintSettings={setPrintSettings} />
                </Suspense>
              </TabsContent>

              {/* Barcode Settings */}
              <TabsContent value="barcode" className="mt-0">
                <Suspense fallback={<SettingsSkeleton />}>
                  <BarcodeSettings barcodeSettings={barcodeSettings} setBarcodeSettings={setBarcodeSettings} />
                </Suspense>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
