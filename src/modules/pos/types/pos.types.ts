// ============================================
// POS Types - أنواع نقطة البيع
// ============================================

import type { Product, Customer, Category } from '@/types';

// ============================================
// Cart Types - أنواع سلة المشتريات
// ============================================

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmount: number;
  totalAmount: number;
  product?: Product;
}

export interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discountAmount: number;
  notes: string;
}

// ============================================
// Payment Types - أنواع الدفع
// ============================================

export type PaymentMethodType = 'cash' | 'card' | 'transfer' | 'mixed';

export interface PaymentMethod {
  id: string;
  name: string;
  color: string;
}

export interface PaymentEntry {
  id: string;
  methodId: string;
  amount: number;
}

export interface PaymentInfo {
  methodId: string;
  methodName: string;
  amount: number;
  reference?: string;
}

export interface PaymentState {
  payments: PaymentInfo[];
  totalPaid: number;
  change: number;
}

// ============================================
// Invoice Types - أنواع الفواتير
// ============================================

export interface InvoicePreview {
  invoiceNumber: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: PaymentMethodType;
  customer?: Customer;
}

export interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  createdAt: Date;
}

// ============================================
// POS Settings - إعدادات نقطة البيع
// ============================================

export interface POSSettings {
  // Display Settings
  showProductName: boolean;
  showProductBarcode: boolean;
  showProductPrice: boolean;
  showProductImage: boolean;
  showProductStock: boolean;
  showProductImages: boolean;
  showDiscount: boolean;
  allowMultiPayment: boolean;
  
  // Font Settings
  productNameFontSize: number;
  productNameColor: string;
  productPriceFontSize: number;
  productPriceColor: string;
  productBarcodeFontSize: number;
  productBarcodeColor: string;
  
  // Card Style Settings
  cardBorderWidth: number;
  cardBorderColor: string;
  cardBorderRadius: number;
  cardPadding: number;
  
  // Grid Settings
  gridViewColumns: number;
  gridColumns: number;
  
  // Behavior Settings
  quickQuantity: number[];
  defaultPaymentMethod: string;
  autoPrint: boolean;
  soundEnabled: boolean;
}

// ============================================
// POS State - حالة نقطة البيع
// ============================================

export interface POSState {
  cart: CartState;
  payment: PaymentState;
  settings: POSSettings;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// View Mode - وضع العرض
// ============================================

export type ViewMode = 'grid' | 'list';

// ============================================
// Expense Types - أنواع المصروفات
// ============================================

export interface ExpenseCategory {
  id: string;
  name: string;
  nameAr?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  createdAt: Date;
}

// ============================================
// Shift Types - أنواع الورديات
// ============================================

export interface ShiftSummary {
  totalSales: number;
  invoiceCount: number;
  cashSales: number;
  cardSales: number;
  startTime: Date;
  endTime?: Date;
}

// ============================================
// Component Props - خصائص المكونات
// ============================================

export interface ProductCardProps {
  product: Product;
  settings: POSSettings;
  onAddToCart: (product: Product) => void;
  currency: { symbol: string } | null;
}

export interface ProductListItemProps {
  product: Product;
  settings: POSSettings;
  onAddToCart: (product: Product) => void;
  currency: { symbol: string } | null;
}

export interface CartItemProps {
  item: CartItem;
  currency: { symbol: string } | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  showSubcategories: boolean;
  subCategories: Category[];
  onCategoryClick: (categoryId: string) => void;
  onBack: () => void;
}

export interface CustomerSearchProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onAddCustomer: (name: string, phone: string) => void;
}

// ============================================
// Color Preset - إعدادات الألوان الجاهزة
// ============================================

export interface ColorPreset {
  name: string;
  border: string;
  price: string;
}

// ============================================
// Re-export types from global types
// ============================================

export type { Product, Customer, Category };
