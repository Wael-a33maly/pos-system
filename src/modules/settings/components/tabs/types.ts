// ============================================
// Settings Types - أنواع إعدادات النظام
// ============================================

import type { PaymentMethod, Branch } from '@/types';

// إعدادات النظام الرئيسية
export interface SettingsState {
  companyName: string;
  companyNameAr: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  taxNumber: string;
  defaultCurrency: string;
  decimalPlaces: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
  showTaxOnInvoice: boolean;
  showLogoOnInvoice: boolean;
  invoiceNotes: string;
  defaultPaymentMethod: string;
  askForCustomer: boolean;
  printAfterSale: boolean;
  soundEnabled: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  dailyReportEmail: boolean;
  reportEmail: string;
  language: string;
  timezone: string;
  startDate: string;
  showDiscount: boolean;
  allowMultiPayment: boolean;
}

// إعدادات الطباعة
export interface PrintSettingsState {
  paperSize: string;
  autoPrint: boolean;
  showLogo: boolean;
  showTax: boolean;
  copies: number;
  footerText: string;
}

// إعدادات الباركود
export interface BarcodeSettingsState {
  format: string;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  marginTop: number;
  marginBottom: number;
}

// بيانات العملة
export interface CurrencyData {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  symbol: string;
  decimalPlaces: number;
  isDefault: boolean;
  isActive: boolean;
}

// بيانات نموذج العملة
export interface CurrencyFormData {
  name: string;
  nameAr: string;
  code: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

// بيانات نموذج طريقة الدفع
export interface PaymentFormData {
  name: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

// بيانات نموذج الفرع
export interface BranchFormData {
  name: string;
  nameAr: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

// Props مشتركة للمكونات
export interface SettingsTabProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
}

export interface CurrencyTabProps {
  currencies: CurrencyData[];
  setCurrencies: React.Dispatch<React.SetStateAction<CurrencyData[]>>;
}

export interface PaymentMethodsTabProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

export interface BranchesTabProps {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

export interface PrintSettingsTabProps {
  printSettings: PrintSettingsState;
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettingsState>>;
}

export interface BarcodeSettingsTabProps {
  barcodeSettings: BarcodeSettingsState;
  setBarcodeSettings: React.Dispatch<React.SetStateAction<BarcodeSettingsState>>;
}

export interface CompanyTabProps extends SettingsTabProps {
  companyLogo: string | null;
  setCompanyLogo: React.Dispatch<React.SetStateAction<string | null>>;
}

// القيم الافتراضية
export const defaultSettings: SettingsState = {
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
  showDiscount: true,
  allowMultiPayment: true,
};

export const defaultPrintSettings: PrintSettingsState = {
  paperSize: '80mm',
  autoPrint: true,
  showLogo: true,
  showTax: true,
  copies: 1,
  footerText: 'شكراً لزيارتكم',
};

export const defaultBarcodeSettings: BarcodeSettingsState = {
  format: 'CODE128',
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 14,
  marginTop: 10,
  marginBottom: 10,
};

export const defaultCurrencies: CurrencyData[] = [
  { id: '1', name: 'Saudi Riyal', nameAr: 'ريال سعودي', code: 'SAR', symbol: 'ر.س', decimalPlaces: 2, isDefault: true, isActive: true },
  { id: '2', name: 'UAE Dirham', nameAr: 'درهم إماراتي', code: 'AED', symbol: 'د.إ', decimalPlaces: 2, isDefault: false, isActive: true },
  { id: '3', name: 'Egyptian Pound', nameAr: 'جنيه مصري', code: 'EGP', symbol: 'ج.م', decimalPlaces: 2, isDefault: false, isActive: true },
  { id: '4', name: 'US Dollar', nameAr: 'دولار أمريكي', code: 'USD', symbol: '$', decimalPlaces: 2, isDefault: false, isActive: true },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Cash', nameAr: 'نقدي', code: 'CASH', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Credit Card', nameAr: 'بطاقة ائتمان', code: 'CARD', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'KNET', nameAr: 'كي نت', code: 'KNET', isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

export const defaultBranches: Branch[] = [
  { id: '1', name: 'الفرع الرئيسي - الرياض', nameAr: 'الفرع الرئيسي', address: 'الرياض، حي العليا', phone: '0112345678', email: 'main@pos.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'فرع جدة', nameAr: 'فرع جدة', address: 'جدة، حي الحمراء', phone: '0123456789', email: 'jeddah@pos.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'فرع الدمام', nameAr: 'فرع الدمام', address: 'الدمام، حي الفيصلية', phone: '0134567890', email: 'dammam@pos.com', isActive: false, createdAt: new Date(), updatedAt: new Date() },
];
