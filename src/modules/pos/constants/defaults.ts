// ============================================
// POS Constants - الثوابت والإعدادات الافتراضية
// ============================================

import type { POSSettings, PaymentMethod, Category, Product, Customer } from '../types/pos.types';

/**
 * الإعدادات الافتراضية لنقطة البيع
 */
export const defaultSettings: POSSettings = {
  showProductName: true,
  showProductBarcode: true,
  showProductPrice: true,
  showProductImage: true,
  showProductStock: false,
  productNameFontSize: 14,
  productNameColor: '#000000',
  productPriceFontSize: 16,
  productPriceColor: '#16a34a',
  productBarcodeFontSize: 10,
  productBarcodeColor: '#6b7280',
  cardBorderWidth: 2,
  cardBorderColor: '#e5e7eb',
  cardBorderRadius: 8,
  cardPadding: 12,
  gridViewColumns: 6,
  showDiscount: true,
  allowMultiPayment: true,
  showProductImages: true,
  gridColumns: 6,
  quickQuantity: [1, 2, 3, 5, 10],
  defaultPaymentMethod: 'cash',
  autoPrint: false,
  soundEnabled: true,
};

/**
 * طرق الدفع المتاحة
 */
export const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'نقداً', color: 'text-green-600' },
  { id: 'card', name: 'بطاقة', color: 'text-blue-600' },
  { id: 'knet', name: 'كي نت', color: 'text-purple-600' },
];

/**
 * فئات المصروفات
 */
export const expenseCategories = [
  { id: '1', name: 'رواتب', nameAr: 'رواتب' },
  { id: '2', name: 'إيجار', nameAr: 'إيجار' },
  { id: '3', name: 'كهرباء', nameAr: 'كهرباء' },
  { id: '4', name: 'ماء', nameAr: 'ماء' },
  { id: '5', name: 'غاز', nameAr: 'غاز' },
  { id: '6', name: 'إنترنت', nameAr: 'إنترنت' },
  { id: '7', name: 'صيانة', nameAr: 'صيانة' },
  { id: '8', name: 'نقل', nameAr: 'نقل' },
  { id: '9', name: 'تسويق', nameAr: 'تسويق' },
  { id: '10', name: 'مستلزمات', nameAr: 'مستلزمات' },
  { id: '11', name: 'أخرى', nameAr: 'أخرى' },
];

/**
 * ألوان جاهزة لبطاقات المنتجات
 */
export const colorPresets = [
  { name: 'افتراضي', border: '#e5e7eb', price: '#16a34a' },
  { name: 'داكن', border: '#374151', price: '#10b981' },
  { name: 'أزرق', border: '#3b82f6', price: '#2563eb' },
  { name: 'أحمر', border: '#ef4444', price: '#dc2626' },
  { name: 'أخضر', border: '#22c55e', price: '#15803d' },
  { name: 'بنفسجي', border: '#8b5cf6', price: '#7c3aed' },
  { name: 'برتقالي', border: '#f97316', price: '#ea580c' },
  { name: 'وردي', border: '#ec4899', price: '#db2777' },
];

/**
 * بيانات تجريبية للفئات
 */
export const mockCategories: Category[] = [
  { id: '1', name: 'إلكترونيات', color: '#3b82f6', isActive: true, sortOrder: 0 },
  { id: '2', name: 'ملابس', color: '#10b981', isActive: true, sortOrder: 1 },
  { id: '3', name: 'أغذية', color: '#f59e0b', isActive: true, sortOrder: 2 },
  { id: '4', name: 'مشروبات', color: '#ef4444', isActive: true, sortOrder: 3 },
  { id: '5', name: 'أجهزة', color: '#8b5cf6', isActive: true, sortOrder: 4, parentId: '1' },
  { id: '6', name: 'اكسسوارات', color: '#ec4899', isActive: true, sortOrder: 5, parentId: '1' },
];

/**
 * بيانات تجريبية للمنتجات
 */
export const mockProducts: Product[] = [
  { id: '1', barcode: '001', name: 'آيفون 15 برو ماكس', sellingPrice: 4999, costPrice: 4000, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', barcode: '002', name: 'سامسونج جالكسي S24', sellingPrice: 3999, costPrice: 3200, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', barcode: '003', name: 'سماعات آبل برو', sellingPrice: 999, costPrice: 800, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', barcode: '004', name: 'شاحن سريع 65W', sellingPrice: 149, costPrice: 100, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', barcode: '005', name: 'غطاء حماية آيفون', sellingPrice: 79, costPrice: 30, categoryId: '1', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', barcode: '006', name: 'تيشيرت قطني', sellingPrice: 99, costPrice: 50, categoryId: '2', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '7', barcode: '007', name: 'بنطلون جينز', sellingPrice: 199, costPrice: 100, categoryId: '2', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '8', barcode: '008', name: 'شوكولاتة', sellingPrice: 15, costPrice: 8, categoryId: '3', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '9', barcode: '009', name: 'عصير برتقال', sellingPrice: 10, costPrice: 5, categoryId: '4', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '10', barcode: '010', name: 'ماء معدني', sellingPrice: 5, costPrice: 2, categoryId: '4', unit: 'piece', hasVariants: false, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

/**
 * بيانات تجريبية للعملاء
 */
export const mockCustomers: Customer[] = [
  { id: '1', name: 'عميل نقدي', phone: '', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'أحمد محمد', phone: '0501234567', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'سارة علي', phone: '0509876543', isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

/**
 * مفتاح التخزين المحلي للإعدادات
 */
export const SETTINGS_STORAGE_KEY = 'pos-settings';
