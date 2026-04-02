// ============================================
// Products Types - أنواع المنتجات
// ============================================

import type { Product as GlobalProduct, ProductVariant as GlobalProductVariant, Category, Brand, Supplier } from '@/types';

// Re-export global types
export type { Category, Brand, Supplier };

// Extended Product type for module
export interface Product extends GlobalProduct {
  variants?: ProductVariant[];
}

export interface ProductVariant extends GlobalProductVariant {
  id: string;
  productId: string;
  name: string;
  nameAr?: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  attributes?: string;
}

// Form Data Types
export interface ProductFormData {
  barcode: string;
  sku: string;
  name: string;
  nameAr: string;
  description: string;
  categoryId: string;
  brandId: string;
  supplierId: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  minStock: number;
  maxStock: number;
  unit: string;
  hasVariants: boolean;
  isActive: boolean;
}

export interface VariantFormData {
  name: string;
  nameAr: string;
  sku: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  attributes: string;
}

// API Response Types
export interface ProductsApiResponse {
  products: Product[];
}

export interface CategoriesApiResponse {
  categories: Category[];
}

export interface BrandsApiResponse {
  brands: Brand[];
}

export interface SuppliersApiResponse {
  suppliers: Supplier[];
}

// Component Props
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  delay?: number;
}

// State Types
export interface ProductsState {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
}
