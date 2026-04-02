// ============================================
// useProducts Hook - هوك إدارة المنتجات
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  Product, 
  Category, 
  Brand, 
  Supplier, 
  ProductFormData, 
  VariantFormData 
} from '../types';

interface UseProductsReturn {
  // State
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  fetchData: () => Promise<void>;
  saveProduct: (data: ProductFormData, variants: VariantFormData[], selectedProduct: Product | null) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  
  // Computed
  filteredProducts: Product[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    productsWithVariants: number;
  };
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes, brandsRes, suppliersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/suppliers'),
      ]);
      
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();
      const suppliersData = await suppliersRes.json();
      
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);
      setBrands(brandsData.brands || []);
      setSuppliers(suppliersData.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.barcode.includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory && p.isActive;
    });
  }, [products, searchQuery, selectedCategory]);

  // Stats - calculate all product statistics
  const stats = useMemo(() => ({
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    lowStockProducts: products.filter(p => p.stock !== undefined && p.stock <= p.minStock).length,
    productsWithVariants: products.filter(p => p.hasVariants).length,
  }), [products]);

  // Save product (create or update)
  const saveProduct = useCallback(async (
    data: ProductFormData, 
    variants: VariantFormData[], 
    selectedProduct: Product | null
  ): Promise<boolean> => {
    try {
      const payload = { ...data, variants: data.hasVariants ? variants : undefined };
      
      if (selectedProduct) {
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('فشل في التحديث');
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('فشل في الإنشاء');
        toast.success('تم إنشاء المنتج بنجاح');
      }
      
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Delete product
  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      toast.success('تم حذف المنتج بنجاح');
      await fetchData();
      return true;
    } catch {
      toast.error('فشل في حذف المنتج');
      return false;
    }
  }, [fetchData]);

  return {
    products,
    categories,
    brands,
    suppliers,
    loading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    fetchData,
    saveProduct,
    deleteProduct,
    filteredProducts,
    stats,
  };
}
