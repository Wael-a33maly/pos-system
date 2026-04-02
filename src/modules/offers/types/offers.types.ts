// ============================================
// Offers Types - أنواع العروض والخصومات
// ============================================

// ==================== Enums ====================
export type OfferType = 
  | 'PRODUCT_DISCOUNT'
  | 'CATEGORY_DISCOUNT'
  | 'CART_DISCOUNT'
  | 'BUY_X_GET_Y'
  | 'BUNDLE'
  | 'FLASH_SALE'
  | 'SEASONAL'
  | 'LOYALTY'
  | 'FIRST_PURCHASE';

export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type ApplyType = 'ALL' | 'PRODUCTS' | 'CATEGORIES' | 'BRANDS';
export type CustomerTarget = 'ALL' | 'NEW' | 'RETURNING' | 'LOYALTY_TIERS';

// ==================== Offer ====================
export interface Offer {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  
  type: OfferType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  
  startDate: Date;
  endDate: Date;
  
  minPurchase?: number;
  minQuantity?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  currentUses: number;
  
  appliesTo: ApplyType;
  productIds?: string[];
  categoryIds?: string[];
  brandIds?: string[];
  
  branchIds?: string[];
  
  priority: number;
  isCombinable: boolean;
  
  targetCustomers: CustomerTarget;
  tierIds?: string[];
  
  activeDays?: number[];
  startTime?: string;
  endTime?: string;
  
  isActive: boolean;
  isAutoApplied: boolean;
  code?: string;
  
  items?: OfferItem[];
  usages?: OfferUsage[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferItem {
  id: string;
  offerId: string;
  productId: string;
  variationId?: string;
  
  discountValue?: number;
  discountType?: DiscountType;
  
  requiredQty: number;
  freeQty: number;
  freeProductId?: string;
  freeVariationId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferUsage {
  id: string;
  offerId: string;
  invoiceId: string;
  customerId?: string;
  userId: string;
  
  discountAmount: number;
  itemsCount: number;
  codeUsed?: string;
  
  createdAt: Date;
}

// ==================== Form Data ====================
export interface OfferFormData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  
  type: OfferType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  
  startDate: string;
  endDate: string;
  
  minPurchase?: number;
  minQuantity?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  
  appliesTo: ApplyType;
  productIds?: string[];
  categoryIds?: string[];
  brandIds?: string[];
  
  branchIds?: string[];
  
  priority: number;
  isCombinable: boolean;
  
  targetCustomers: CustomerTarget;
  tierIds?: string[];
  
  activeDays?: number[];
  startTime?: string;
  endTime?: string;
  
  isActive: boolean;
  isAutoApplied: boolean;
  code?: string;
  
  items: OfferItemFormData[];
}

export interface OfferItemFormData {
  productId: string;
  variationId?: string;
  
  discountValue?: number;
  discountType?: DiscountType;
  
  requiredQty: number;
  freeQty: number;
  freeProductId?: string;
  freeVariationId?: string;
}

// ==================== Stats ====================
export interface OfferStats {
  totalOffers: number;
  activeOffers: number;
  scheduledOffers: number;
  expiredOffers: number;
  totalUsages: number;
  totalDiscount: number;
}

// ==================== Labels ====================
export const OFFER_TYPE_LABELS: Record<OfferType, { label: string; labelAr: string; color: string }> = {
  PRODUCT_DISCOUNT: { label: 'Product Discount', labelAr: 'خصم على منتج', color: 'bg-blue-500' },
  CATEGORY_DISCOUNT: { label: 'Category Discount', labelAr: 'خصم على فئة', color: 'bg-purple-500' },
  CART_DISCOUNT: { label: 'Cart Discount', labelAr: 'خصم على السلة', color: 'bg-green-500' },
  BUY_X_GET_Y: { label: 'Buy X Get Y', labelAr: 'اشتري X واحصل على Y', color: 'bg-amber-500' },
  BUNDLE: { label: 'Bundle', labelAr: 'حزمة منتجات', color: 'bg-pink-500' },
  FLASH_SALE: { label: 'Flash Sale', labelAr: 'عرض سريع', color: 'bg-red-500' },
  SEASONAL: { label: 'Seasonal', labelAr: 'عرض موسمي', color: 'bg-cyan-500' },
  LOYALTY: { label: 'Loyalty', labelAr: 'عرض للمميزين', color: 'bg-yellow-500' },
  FIRST_PURCHASE: { label: 'First Purchase', labelAr: 'أول عملية شراء', color: 'bg-emerald-500' },
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, { label: string; labelAr: string }> = {
  PERCENTAGE: { label: 'Percentage', labelAr: 'نسبة مئوية' },
  FIXED: { label: 'Fixed Amount', labelAr: 'مبلغ ثابت' },
};

export const APPLY_TYPE_LABELS: Record<ApplyType, { label: string; labelAr: string }> = {
  ALL: { label: 'All Products', labelAr: 'جميع المنتجات' },
  PRODUCTS: { label: 'Specific Products', labelAr: 'منتجات محددة' },
  CATEGORIES: { label: 'Specific Categories', labelAr: 'فئات محددة' },
  BRANDS: { label: 'Specific Brands', labelAr: 'براندات محددة' },
};

export const CUSTOMER_TARGET_LABELS: Record<CustomerTarget, { label: string; labelAr: string }> = {
  ALL: { label: 'All Customers', labelAr: 'جميع العملاء' },
  NEW: { label: 'New Customers', labelAr: 'عملاء جدد' },
  RETURNING: { label: 'Returning Customers', labelAr: 'عملاء عائدون' },
  LOYALTY_TIERS: { label: 'Loyalty Tiers', labelAr: 'مستويات ولاء محددة' },
};
