'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  User,
  Users,
  BarChart3,
  Printer,
  Moon,
  Sun,
  HelpCircle,
  Search,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ==================== الأنواع ====================
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category?: string;
  action?: () => void;
  href?: string;
  disabled?: boolean;
}

interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  commands?: CommandItem[];
}

// ==================== الأوامر الافتراضية ====================
const defaultCommands: CommandItem[] = [
  // التنقل
  { id: 'home', label: 'الرئيسية', icon: <Home className="h-4 w-4" />, category: 'navigation', href: '/' },
  { id: 'pos', label: 'نقطة البيع', icon: <ShoppingCart className="h-4 w-4" />, category: 'navigation', shortcut: 'F2', href: '?mode=pos' },
  { id: 'products', label: 'المنتجات', icon: <Package className="h-4 w-4" />, category: 'navigation', shortcut: 'F3', href: '?page=products' },
  { id: 'invoices', label: 'الفواتير', icon: <FileText className="h-4 w-4" />, category: 'navigation', shortcut: 'F4', href: '?page=invoices' },
  { id: 'customers', label: 'العملاء', icon: <Users className="h-4 w-4" />, category: 'navigation', shortcut: 'F5', href: '?page=customers' },
  { id: 'reports', label: 'التقارير', icon: <BarChart3 className="h-4 w-4" />, category: 'navigation', shortcut: 'F6', href: '?page=reports' },
  { id: 'shifts', label: 'الورديات', icon: <Calendar className="h-4 w-4" />, category: 'navigation', shortcut: 'F7', href: '?page=shifts' },
  { id: 'settings', label: 'الإعدادات', icon: <Settings className="h-4 w-4" />, category: 'navigation', shortcut: 'F8', href: '?page=settings' },
  
  // الإجراءات
  { id: 'new-product', label: 'إضافة منتج جديد', icon: <Plus className="h-4 w-4" />, category: 'actions', shortcut: 'Ctrl+N' },
  { id: 'new-invoice', label: 'فاتورة جديدة', icon: <FileText className="h-4 w-4" />, category: 'actions', shortcut: 'F2' },
  { id: 'new-customer', label: 'إضافة عميل', icon: <User className="h-4 w-4" />, category: 'actions' },
  { id: 'print', label: 'طباعة', icon: <Printer className="h-4 w-4" />, category: 'actions', shortcut: 'Ctrl+P' },
  { id: 'calculate', label: 'الآلة الحاسبة', icon: <Calculator className="h-4 w-4" />, category: 'actions' },
  { id: 'payment', label: 'معالجة الدفع', icon: <CreditCard className="h-4 w-4" />, category: 'actions', shortcut: 'F12' },
  
  // الأدوات
  { id: 'theme', label: 'تبديل الوضع المظلم', icon: <Sun className="h-4 w-4" />, category: 'tools' },
  { id: 'help', label: 'المساعدة', icon: <HelpCircle className="h-4 w-4" />, category: 'tools', shortcut: '?' },
  { id: 'logout', label: 'تسجيل الخروج', icon: <LogOut className="h-4 w-4" />, category: 'tools' },
];

// ==================== المكون الرئيسي ====================
export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  commands = defaultCommands,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // اختصار لوحة المفاتيح لفتح Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + P أو F1
      if ((e.ctrlKey && e.shiftKey && e.key === 'P') || e.key === 'F1') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        if (selectedGroup) {
          setSelectedGroup(null);
          setQuery('');
        } else {
          setOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen, selectedGroup]);

  // التركيز على حقل الإدخال
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
        setSelectedGroup(null);
      }, 100);
    }
  }, [open]);

  // تصفية الأوامر
  const filteredCommands = useMemo(() => {
    let items = commands;
    
    if (selectedGroup) {
      items = commands.filter(c => c.category === selectedGroup);
    }
    
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        c =>
          c.label.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }
    
    return items;
  }, [commands, query, selectedGroup]);

  // تجميع الأوامر
  const groupedCommands = useMemo(() => {
    const groups: CommandGroup[] = [];
    
    const navigationItems = filteredCommands.filter(c => c.category === 'navigation');
    if (navigationItems.length > 0) {
      groups.push({ id: 'navigation', label: 'التنقل', items: navigationItems });
    }
    
    const actionItems = filteredCommands.filter(c => c.category === 'actions');
    if (actionItems.length > 0) {
      groups.push({ id: 'actions', label: 'الإجراءات', items: actionItems });
    }
    
    const toolItems = filteredCommands.filter(c => c.category === 'tools');
    if (toolItems.length > 0) {
      groups.push({ id: 'tools', label: 'الأدوات', items: toolItems });
    }
    
    return groups;
  }, [filteredCommands]);

  // إجمالي النتائج
  const totalResults = filteredCommands.length;

  // تنفيذ الأمر
  const executeCommand = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      
      setOpen(false);
      
      if (item.href) {
        window.location.href = item.href;
      } else if (item.action) {
        item.action();
      }
    },
    [setOpen]
  );

  // معالج التنقل بلوحة المفاتيح
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter': {
          e.preventDefault();
          const item = filteredCommands[selectedIndex];
          if (item) {
            executeCommand(item);
          }
          break;
        }
        case 'Backspace':
          if (query === '' && selectedGroup) {
            setSelectedGroup(null);
          }
          break;
      }
    },
    [totalResults, selectedIndex, filteredCommands, query, selectedGroup, executeCommand]
  );

  // أيقونة المجموعة
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return <ChevronRight className="h-4 w-4" />;
      case 'actions':
        return <Sparkles className="h-4 w-4" />;
      case 'tools':
        return <Settings className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-xl" dir="rtl">
        {/* الشريط العلوي */}
        <div className="flex items-center border-b px-4 py-2 bg-muted/30">
          {selectedGroup && (
            <Badge variant="secondary" className="ml-2">
              {selectedGroup === 'navigation' ? 'التنقل' :
               selectedGroup === 'actions' ? 'الإجراءات' : 'الأدوات'}
            </Badge>
          )}
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedGroup ? `بحث في ${selectedGroup === 'navigation' ? 'التنقل' : selectedGroup === 'actions' ? 'الإجراءات' : 'الأدوات'}...` : 'اكتب أمر أو ابحث...'}
            className="border-0 focus-visible:ring-0 text-base bg-transparent"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>

        {/* قائمة الأوامر */}
        <ScrollArea className="max-h-[350px]">
          {groupedCommands.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">لا توجد أوامر مطابقة</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence mode="popLayout">
                {groupedCommands.map((group, groupIndex) => {
                  const startIndex = groupedCommands
                    .slice(0, groupIndex)
                    .reduce((sum, g) => sum + g.items.length, 0);

                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {getCategoryIcon(group.id)}
                        {group.label}
                      </div>

                      {group.items.map((item, index) => {
                        const globalIndex = startIndex + index;
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            disabled={item.disabled}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors',
                              isSelected && !item.disabled
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted',
                              item.disabled && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={() => executeCommand(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            {item.icon && (
                              <div className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                isSelected && !item.disabled
                                  ? 'bg-primary-foreground/20'
                                  : 'bg-muted'
                              )}>
                                {item.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.label}</div>
                              {item.description && (
                                <div className={cn(
                                  'text-sm truncate',
                                  isSelected && !item.disabled
                                    ? 'text-primary-foreground/80'
                                    : 'text-muted-foreground'
                                )}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.shortcut && (
                              <kbd className={cn(
                                'hidden sm:flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded',
                                isSelected && !item.disabled
                                  ? 'bg-primary-foreground/20'
                                  : 'bg-muted'
                              )}>
                                {item.shortcut}
                              </kbd>
                            )}
                          </motion.button>
                        );
                      })}

                      {groupIndex < groupedCommands.length - 1 && (
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
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5">↑↓</kbd>
            <span>للتصفح</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5">Enter</kbd>
            <span>للاختيار</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5">Esc</kbd>
            <span>للإغلاق</span>
          </div>
          <div className="mr-auto">
            <kbd className="rounded border bg-background px-1.5 py-0.5 ml-1">Ctrl+Shift+P</kbd>
            أو
            <kbd className="rounded border bg-background px-1.5 py-0.5 mx-1">F1</kbd>
            للفتح
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
