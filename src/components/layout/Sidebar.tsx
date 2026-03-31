'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Building2,
  Truck,
  FileText,
  Receipt,
  Wallet,
  Calculator,
  BarChart3,
  Settings,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Store,
  Layers,
  UserCheck,
  Users2,
  Import,
  QrCode,
  RotateCcw,
  DollarSign,
  CreditCard,
  Globe,
  Bell,
  Briefcase,
  Palette,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import type { User as UserType } from '@/types';

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SidebarItem[];
  permission?: string;
  roles?: UserType['role'][];
  badge?: string | number;
  color?: string;
}

const sidebarItems: SidebarItem[] = [
  { 
    title: 'لوحة التحكم', 
    href: '/', 
    icon: LayoutDashboard,
    color: 'text-emerald-500',
  },
  {
    title: 'المستخدمين والأدوار',
    icon: Users,
    permission: 'users',
    color: 'text-blue-500',
    children: [
      { title: 'المستخدمين', href: '/?page=users', icon: Users2, permission: 'users', color: 'text-blue-400' },
      { title: 'الأدوار والصلاحيات', href: '/?page=roles', icon: UserCheck, permission: 'roles', color: 'text-blue-400' },
    ],
  },
  {
    title: 'العملاء والموردين',
    icon: Building2,
    permission: 'customers',
    color: 'text-purple-500',
    children: [
      { title: 'العملاء', href: '/?page=customers', icon: Users, permission: 'customers', color: 'text-purple-400' },
      { title: 'الموردين', href: '/?page=suppliers', icon: Truck, permission: 'suppliers', color: 'text-purple-400' },
    ],
  },
  {
    title: 'المنتجات',
    icon: Package,
    permission: 'products',
    color: 'text-amber-500',
    children: [
      { title: 'جميع المنتجات', href: '/?page=products', icon: Package, permission: 'products', color: 'text-amber-400' },
      { title: 'إضافة منتج', href: '/?page=products&action=add', icon: Package, permission: 'products', color: 'text-amber-400' },
      { title: 'الفئات', href: '/?page=categories', icon: Tags, permission: 'categories', color: 'text-amber-400' },
      { title: 'البراندات', href: '/?page=brands', icon: Layers, permission: 'brands', color: 'text-amber-400' },
      { title: 'الشركات الموردة', href: '/?page=supplier-companies', icon: Building2, permission: 'suppliers', color: 'text-amber-400' },
      { title: 'طباعة الباركود', href: '/?page=barcode', icon: QrCode, permission: 'products', color: 'text-amber-400' },
      { title: 'استيراد المنتجات', href: '/?page=import', icon: Import, permission: 'products', color: 'text-amber-400' },
    ],
  },
  {
    title: 'الفواتير والمرتجعات',
    icon: FileText,
    permission: 'invoices',
    color: 'text-rose-500',
    children: [
      { title: 'الفواتير', href: '/?page=invoices', icon: Receipt, permission: 'invoices', color: 'text-rose-400' },
      { title: 'المرتجعات', href: '/?page=returns', icon: RotateCcw, permission: 'invoices', color: 'text-rose-400' },
    ],
  },
  {
    title: 'المصروفات',
    icon: Wallet,
    permission: 'expenses',
    color: 'text-orange-500',
    children: [
      { title: 'المصروفات', href: '/?page=expenses', icon: Wallet, permission: 'expenses', color: 'text-orange-400' },
      { title: 'فئات المصروفات', href: '/?page=expense-categories', icon: Tags, permission: 'expenses', color: 'text-orange-400' },
    ],
  },
  { 
    title: 'الحسابات', 
    href: '/?page=accounts', 
    icon: Calculator, 
    permission: 'accounts',
    color: 'text-cyan-500',
  },
  { 
    title: 'التقارير والتحليلات', 
    href: '/?page=reports', 
    icon: BarChart3, 
    permission: 'reports',
    color: 'text-indigo-500',
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    permission: 'settings',
    color: 'text-gray-500',
    children: [
      { title: 'عام', href: '/?page=settings&tab=general', icon: Settings, permission: 'settings', color: 'text-gray-400' },
      { title: 'الشركة', href: '/?page=settings&tab=company', icon: Briefcase, permission: 'settings', color: 'text-blue-400' },
      { title: 'العملات', href: '/?page=settings&tab=currency', icon: DollarSign, permission: 'settings', color: 'text-green-400' },
      { title: 'طرق الدفع', href: '/?page=settings&tab=payment-methods', icon: CreditCard, permission: 'settings', color: 'text-purple-400' },
      { title: 'الفواتير', href: '/?page=settings&tab=invoice', icon: Receipt, permission: 'settings', color: 'text-rose-400' },
      { title: 'نقطة البيع', href: '/?page=settings&tab=pos', icon: Globe, permission: 'settings', color: 'text-amber-400' },
      { title: 'التنبيهات', href: '/?page=settings&tab=notifications', icon: Bell, permission: 'settings', color: 'text-cyan-400' },
      { title: 'الفروع', href: '/?page=settings&tab=branches', icon: Store, permission: 'settings', color: 'text-indigo-400' },
      { title: 'الطباعة', href: '/?page=settings&tab=print', icon: Printer, permission: 'settings', color: 'text-orange-400' },
      { title: 'الباركود', href: '/?page=settings&tab=barcode', icon: QrCode, permission: 'settings', color: 'text-teal-400' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarCollapsed, toggleSidebarCollapse, user } = useAppStore();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const currentPage = searchParams.get('page') || '';
  const currentTab = searchParams.get('tab') || '';

  const toggleExpanded = (title: string) => {
    setExpandedItem((prev) => (prev === title ? null : title));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    const url = new URL(href, 'http://localhost');
    const itemPage = url.searchParams.get('page');
    const itemTab = url.searchParams.get('tab');
    
    const pageMatches = itemPage ? currentPage === itemPage : href === pathname && !currentPage;
    
    if (itemTab) {
      return pageMatches && currentTab === itemTab;
    }
    
    if (itemPage === 'settings' && currentPage === 'settings') {
      return !currentTab;
    }
    
    return pageMatches;
  };

  const hasPermission = (item: SidebarItem): boolean => {
    // If no user, show all items (for development/demo purposes)
    if (!user) return true;
    
    if (user?.role === 'SUPER_ADMIN') return true;
    if (item.roles && user?.role && !item.roles.includes(user.role)) return false;
    if (item.permission && user?.role !== 'SUPER_ADMIN') {
      if (user?.role === 'BRANCH_ADMIN') return true;
      return (user?.permissions || []).some(p => p.module === item.permission && p.allowed);
    }
    return true;
  };

  const filteredItems = sidebarItems.filter(hasPermission).map(item => ({
    ...item,
    children: item.children?.filter(hasPermission),
  }));

  const renderNavItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItem === item.title;
    const active = isActive(item.href);
    const isHovered = hoveredItem === item.title;

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <motion.button
            onClick={() => toggleExpanded(item.title)}
            onMouseEnter={() => setHoveredItem(item.title)}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
              "flex-row-reverse",
              "relative overflow-hidden group",
              isExpanded ? "bg-primary/10" : "hover:bg-muted/50"
            )}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background glow effect */}
            <motion.div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-l from-transparent via-primary/5 to-transparent"
              )}
              initial={false}
              animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            />
            
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors duration-300",
                item.color || "text-muted-foreground",
                isExpanded && "text-primary"
              )} />
            </motion.div>
            
            {!sidebarCollapsed && (
              <>
                <span className={cn(
                  "flex-1 font-medium text-right transition-colors duration-300",
                  isExpanded && "text-primary"
                )}>
                  {item.title}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </>
            )}
          </motion.button>
          
          <AnimatePresence initial={false}>
            {isExpanded && !sidebarCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mr-3 pr-3 border-r-2 border-primary/20 my-1 space-y-1">
                  {item.children?.map((child) => renderNavItem(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        key={item.title + item.href}
        href={item.href || '#'}
        onClick={() => window.innerWidth < 768 && onClose()}
        onMouseEnter={() => setHoveredItem(item.title)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
          "flex-row-reverse",
          "relative overflow-hidden group",
          depth > 0 && "mr-0",
          active 
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
            : "hover:bg-muted/50"
        )}
      >
        {/* Shimmer effect for active items */}
        {active && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        <motion.div
          whileHover={{ scale: 1.1, rotate: active ? 0 : 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <item.icon className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-300",
            active ? "text-primary-foreground" : (item.color || "text-muted-foreground")
          )} />
        </motion.div>
        
        {!sidebarCollapsed && (
          <>
            <span className="font-medium text-right flex-1 relative z-10">
              {item.title}
            </span>
            {item.badge && (
              <Badge 
                variant={active ? "secondary" : "outline"} 
                className={cn(
                  "text-xs px-2 py-0.5",
                  active && "bg-primary-foreground/20 text-primary-foreground border-0"
                )}
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        className={cn(
          "fixed top-0 right-0 z-50 h-screen",
          "bg-gradient-to-b from-background via-background to-muted/30",
          "border-l border-border/50",
          "flex flex-col",
          "shadow-2xl shadow-black/5",
          "md:block",
          isOpen ? "block" : "hidden md:block"
        )}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0 relative">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div 
                  className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Store className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <span className="font-bold text-lg bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                    نقاط البيع
                  </span>
                  <p className="text-xs text-muted-foreground">نظام متكامل</p>
                </div>
              </Link>
            </motion.div>
          )}
          
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarCollapse}
              className={cn(
                "h-9 w-9 rounded-xl transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary",
                sidebarCollapsed && "mx-auto"
              )}
            >
              <motion.div
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Quick Stats when collapsed */}
        {sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-2 py-2 border-b border-border/50"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-1">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {renderNavItem(item)}
              </motion.div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-border/50 shrink-0"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-l from-primary/5 to-transparent">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
              <div>
                <p className="text-xs font-medium">نظام نقاط البيع</p>
                <p className="text-xs text-muted-foreground">الإصدار 1.0.0</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.aside>
    </>
  );
}
