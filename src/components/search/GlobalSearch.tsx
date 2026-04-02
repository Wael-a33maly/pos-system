'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  FileText,
  Users,
  ShoppingBag,
  Settings,
  BarChart3,
  Clock,
  Hash,
  Tag,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/shared/hooks/useDebounce';

// ==================== الأنواع ====================
interface SearchResult {
  id: string;
  type: 'product' | 'invoice' | 'customer' | 'category' | 'brand' | 'user' | 'setting';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  metadata?: Record<string, unknown>;
}

interface SearchGroup {
  type: string;
  label: string;
  results: SearchResult[];
}

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onResultClick?: (result: SearchResult) => void;
}

// ==================== البيانات الوهمية ====================
const mockProducts = [
  { id: '1', name: 'قهوة عربية', barcode: '5000112637922', price: 15 },
  { id: '2', name: 'شاي بالنعناع', barcode: '5000112637923', price: 10 },
  { id: '3', name: 'كيكة شوكولاتة', barcode: '5000112637924', price: 25 },
  { id: '4', name: 'عصير برتقال', barcode: '5000112637925', price: 8 },
  { id: '5', name: 'ماء معدني', barcode: '5000112637926', price: 2 },
];

const mockInvoices = [
  { id: '1', number: 'INV-2024-001234', customer: 'محمد أحمد', total: 150 },
  { id: '2', number: 'INV-2024-001235', customer: 'خالد محمود', total: 85 },
  { id: '3', number: 'INV-2024-001236', customer: 'سارة علي', total: 220 },
];

const mockCustomers = [
  { id: '1', name: 'محمد أحمد', phone: '0501234567', email: 'mohammed@example.com' },
  { id: '2', name: 'خالد محمود', phone: '0507654321', email: 'khaled@example.com' },
  { id: '3', name: 'سارة علي', phone: '0509876543', email: 'sara@example.com' },
];

// ==================== المكون الرئيسي ====================
export function GlobalSearch({
  open: controlledOpen,
  onOpenChange,
  onResultClick,
}: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const debouncedQuery = useDebounce(query, 300);

  // اختصار لوحة المفاتيح لفتح البحث
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // التركيز على حقل البحث عند الفتح
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 100);
    }
  }, [open]);

  // البحث في البيانات
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    const q = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    // البحث في المنتجات
    const productResults = mockProducts.filter(
      p => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    );
    productResults.forEach(p => {
      results.push({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: `${p.barcode} • ${p.price} ر.س`,
        icon: <Package className="h-4 w-4" />,
        href: `?page=products&id=${p.id}`,
      });
    });

    // البحث في الفواتير
    const invoiceResults = mockInvoices.filter(
      i => i.number.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q)
    );
    invoiceResults.forEach(i => {
      results.push({
        id: i.id,
        type: 'invoice',
        title: i.number,
        subtitle: `${i.customer} • ${i.total} ر.س`,
        icon: <FileText className="h-4 w-4" />,
        href: `?page=invoices&id=${i.id}`,
      });
    });

    // البحث في العملاء
    const customerResults = mockCustomers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );
    customerResults.forEach(c => {
      results.push({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: `${c.phone} • ${c.email}`,
        icon: <Users className="h-4 w-4" />,
        href: `?page=customers&id=${c.id}`,
      });
    });

    return results;
  }, [debouncedQuery]);

  // تجميع النتائج
  const groupedResults = useMemo(() => {
    const groups: SearchGroup[] = [];
    
    const productResults = searchResults.filter(r => r.type === 'product');
    if (productResults.length > 0) {
      groups.push({ type: 'product', label: 'المنتجات', results: productResults.slice(0, 5) });
    }
    
    const invoiceResults = searchResults.filter(r => r.type === 'invoice');
    if (invoiceResults.length > 0) {
      groups.push({ type: 'invoice', label: 'الفواتير', results: invoiceResults.slice(0, 5) });
    }
    
    const customerResults = searchResults.filter(r => r.type === 'customer');
    if (customerResults.length > 0) {
      groups.push({ type: 'customer', label: 'العملاء', results: customerResults.slice(0, 5) });
    }

    return groups;
  }, [searchResults]);

  // مؤشر النتائج الكلي
  const totalResults = groupedResults.reduce((sum, g) => sum + g.results.length, 0);

  // النقر على نتيجة
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      if (result.href) {
        window.location.href = result.href;
      }
      onResultClick?.(result);
    },
    [onResultClick, setOpen]
  );

  // التنقل بين النتائج
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(searchResults[selectedIndex]);
      }
    },
    [totalResults, selectedIndex, searchResults, handleResultClick]
  );

  // أيقونة النوع
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'invoice':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'customer':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'category':
        return <Tag className="h-4 w-4 text-orange-500" />;
      case 'brand':
        return <Hash className="h-4 w-4 text-pink-500" />;
      case 'setting':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-2xl" dir="rtl">
        {/* حقل البحث */}
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="بحث في المنتجات، الفواتير، العملاء..."
            className="border-0 focus-visible:ring-0 text-lg"
          />
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          )}
        </div>

        {/* النتائج */}
        <ScrollArea className="max-h-[400px]">
          {query.trim() === '' ? (
            // الحالة الافتراضية
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">البحث الشامل</h3>
              <p className="text-muted-foreground text-sm mb-4">
                ابحث في جميع البيانات: المنتجات، الفواتير، العملاء، والمزيد
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">
                  <kbd className="ml-1">Ctrl</kbd>+<kbd className="mr-1">K</kbd>
                  للفتح السريع
                </Badge>
              </div>
              
              <Separator className="my-6" />
              
              {/* اقتراحات سريعة */}
              <div className="text-right">
                <p className="text-sm font-medium mb-3">اقتراحات سريعة</p>
                <div className="flex flex-wrap gap-2">
                  {['قهوة', 'INV-2024', 'محمد', '05'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : groupedResults.length === 0 ? (
            // لا توجد نتائج
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground text-sm">
                لم نتمكن من العثور على نتائج لـ "{query}"
              </p>
            </div>
          ) : (
            // عرض النتائج
            <div className="p-2">
              <AnimatePresence mode="popLayout">
                {groupedResults.map((group, groupIndex) => {
                  const startIndex = groupedResults
                    .slice(0, groupIndex)
                    .reduce((sum, g) => sum + g.results.length, 0);

                  return (
                    <motion.div
                      key={group.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                        {getTypeIcon(group.type)}
                        {group.label}
                        <Badge variant="secondary" className="mr-auto">
                          {group.results.length}
                        </Badge>
                      </div>
                      
                      {group.results.map((result, index) => {
                        const globalIndex = startIndex + index;
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors',
                              isSelected
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                              {result.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </motion.button>
                        );
                      })}

                      {groupIndex < groupedResults.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* شريط التلميحات */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd>
            <span>للتصفح</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd>
            <span>للاختيار</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd>
            <span>للإغلاق</span>
          </div>
          <div className="mr-auto">
            {totalResults > 0 && (
              <span>{totalResults} نتيجة</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearch;
