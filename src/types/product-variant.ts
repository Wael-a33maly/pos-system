// ============================================
// Product Variant Types - أنواع متغيرات المنتجات
// ============================================

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  attributes: VariantAttribute[];
  image?: string;
  barcode?: string;
  isActive: boolean;
}

export interface VariantAttribute {
  name: string;  // مثل: اللون، الحجم
  value: string; // مثل: أحمر، XL
}

// Form Data for Variant
export interface VariantFormData {
  id?: string;
  productId?: string;
  sku: string;
  name: string;
  nameAr?: string;
  price: number;
  costPrice: number;
  stock: number;
  attributes: VariantAttribute[];
  image?: string;
  barcode?: string;
  isActive: boolean;
}

// Variant Option for Generator
export interface VariantOption {
  id: string;
  name: string;       // اسم الخاصية (اللون، الحجم)
  values: VariantOptionValue[];
}

export interface VariantOptionValue {
  id: string;
  value: string;      // القيمة (أحمر، أزرق)
  color?: string;     // للعرض البصري (للألوان)
}

// Generated Variant Preview
export interface GeneratedVariant {
  sku: string;
  name: string;
  attributes: VariantAttribute[];
  price: number;
  costPrice: number;
  stock: number;
  barcode?: string;
  image?: string;
}

// API Response Types
export interface VariantsApiResponse {
  variants: ProductVariant[];
  total: number;
}

export interface VariantCreateRequest {
  productId: string;
  sku: string;
  name: string;
  nameAr?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  attributes?: string; // JSON string
  barcode?: string;
  isActive?: boolean;
}

export interface VariantUpdateRequest {
  id: string;
  sku?: string;
  name?: string;
  nameAr?: string;
  costPrice?: number;
  sellingPrice?: number;
  stock?: number;
  attributes?: string;
  barcode?: string;
  isActive?: boolean;
}

// Component Props
export interface VariantCardProps {
  variant: ProductVariant;
  onEdit?: (variant: ProductVariant) => void;
  onDelete?: (variantId: string) => void;
  onToggleActive?: (variantId: string, isActive: boolean) => void;
  currency?: string;
}

export interface VariantFormProps {
  variant?: ProductVariant | null;
  productId: string;
  onSubmit: (data: VariantFormData) => void;
  onCancel: () => void;
  defaultPrice?: number;
  defaultCostPrice?: number;
}

export interface VariantGeneratorProps {
  productId: string;
  onGenerate: (variants: GeneratedVariant[]) => void;
  onCancel: () => void;
  defaultPrice?: number;
  defaultCostPrice?: number;
}

export interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  defaultPrice?: number;
  defaultCostPrice?: number;
  currency?: string;
}
