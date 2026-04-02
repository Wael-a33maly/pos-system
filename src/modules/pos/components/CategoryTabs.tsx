// ============================================
// CategoryTabs Component - تبويبات الفئات
// ============================================

import { memo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '../types/pos.types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  showSubcategories: boolean;
  onCategoryClick: (categoryId: string) => void;
  onBack: () => void;
}

/**
 * مكون تبويبات الفئات - يعرض الفئات الرئيسية والفرعية
 * مع دعم التنقل بينها
 */
const CategoryTabs = memo(function CategoryTabs({
  categories,
  selectedCategory,
  showSubcategories,
  onCategoryClick,
  onBack,
}: CategoryTabsProps) {
  return (
    <div className="p-2 border-b bg-card">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {showSubcategories && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4 ml-1" />
            رجوع
          </Button>
        )}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryClick(category.id)}
            className="shrink-0"
            style={{
              borderColor: category.color,
              ...(selectedCategory === category.id && { backgroundColor: category.color }),
            }}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
});

export { CategoryTabs };
