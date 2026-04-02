// ============================================
// useProducts Hook - إدارة المنتجات
// ============================================

import { useState, useMemo, useCallback } from 'react';
import type { Product, Category } from '../types/pos.types';
import { mockProducts, mockCategories } from '../constants/defaults';

interface UseProductsOptions {
  initialProducts?: Product[];
  initialCategories?: Category[];
}

interface UseProductsReturn {
  // Data
  products: Product[];
  categories: Category[];
  filteredProducts: Product[];
  mainCategories: Category[];
  subCategories: Category[];
  
  // State
  searchQuery: string;
  selectedCategory: string | null;
  showSubcategories: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  handleCategoryClick: (categoryId: string) => void;
  goBackToMainCategories: () => void;
}

/**
 * Hook لإدارة المنتجات والفئات والبحث والفلترة
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    initialProducts = mockProducts,
    initialCategories = mockCategories,
  } = options;

  // State
  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Derived data
  const mainCategories = useMemo(() => 
    categories.filter(c => !c.parentId), 
    [categories]
  );

  const subCategories = useMemo(() => 
    selectedCategory ? categories.filter(c => c.parentId === selectedCategory) : [], 
    [categories, selectedCategory]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.barcode.includes(searchQuery);
      const matchesCategory = !selectedCategory || 
                             p.categoryId === selectedCategory ||
                             categories.find(c => c.id === p.categoryId)?.parentId === selectedCategory;
      return matchesSearch && matchesCategory && p.isActive;
    });
  }, [products, searchQuery, selectedCategory, categories]);

  // Actions
  const handleCategoryClick = useCallback((categoryId: string) => {
    const hasSubcategories = categories.some(c => c.parentId === categoryId);
    if (hasSubcategories) {
      setSelectedCategory(categoryId);
      setShowSubcategories(true);
    } else {
      setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
      setShowSubcategories(false);
    }
  }, [categories, selectedCategory]);

  const goBackToMainCategories = useCallback(() => {
    setShowSubcategories(false);
    setSelectedCategory(null);
  }, []);

  return {
    // Data
    products,
    categories,
    filteredProducts,
    mainCategories,
    subCategories,
    
    // State
    searchQuery,
    selectedCategory,
    showSubcategories,
    
    // Actions
    setSearchQuery,
    setSelectedCategory,
    handleCategoryClick,
    goBackToMainCategories,
  };
}
