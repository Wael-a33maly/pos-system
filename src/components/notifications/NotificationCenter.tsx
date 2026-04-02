'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NotificationItem, type Notification } from './NotificationItem';
import { NotificationBadge } from './NotificationBadge';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onRefresh?: () => void;
  onLinkClick?: (link: string) => void;
  isLoading?: boolean;
  className?: string;
}

type FilterType = 'all' | 'unread' | 'read';
type CategoryType = 'all' | 'inventory' | 'shifts' | 'invoices' | 'sales' | 'system';

const categoryFilters: { value: CategoryType; label: string; types: string[] }[] = [
  { value: 'all', label: 'الكل', types: [] },
  { value: 'inventory', label: 'المخزون', types: ['LOW_STOCK', 'OUT_OF_STOCK'] },
  { value: 'shifts', label: 'الورديات', types: ['SHIFT_OPENED', 'SHIFT_CLOSED', 'SHIFT_REMINDER'] },
  { value: 'invoices', label: 'الفواتير', types: ['NEW_INVOICE', 'INVOICE_CANCELLED', 'INVOICE_RETURNED', 'RETURN_REQUEST', 'RETURN_APPROVED', 'RETURN_REJECTED'] },
  { value: 'sales', label: 'المبيعات', types: ['SALES_TARGET', 'DAILY_GOAL_ACHIEVED', 'PAYMENT_RECEIVED'] },
  { value: 'system', label: 'النظام', types: ['SYSTEM', 'SYSTEM_UPDATE', 'BACKUP_COMPLETE', 'NEW_USER', 'NEW_CUSTOMER'] },
];

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onRefresh,
  onLinkClick,
  isLoading = false,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');

  // تطبيق الفلاتر
  const filteredNotifications = notifications.filter((n) => {
    // فلتر القراءة
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;

    // فلتر الفئة
    if (category !== 'all') {
      const categoryFilter = categoryFilters.find((c) => c.value === category);
      if (categoryFilter && !categoryFilter.types.includes(n.type)) return false;
    }

    return true;
  });

  // عداد الإشعارات المفلترة
  const filteredUnreadCount = filteredNotifications.filter((n) => !n.isRead).length;

  const handleLinkClick = useCallback(
    (link: string) => {
      onLinkClick?.(link);
      setIsOpen(false);
    },
    [onLinkClick]
  );

  return (
    <div className={cn('relative', className)}>
      {/* زر الإشعارات */}
      <NotificationBadge
        count={unreadCount}
        onClick={() => setIsOpen(!isOpen)}
        size="md"
      />

      {/* لوحة الإشعارات */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* خلفية شفافة للإغلاق */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* لوحة الإشعارات */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-96 top-16 z-50"
            >
              <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
                {/* الترويسة */}
                <div className="bg-gradient-to-l from-blue-600 to-blue-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-white" />
                      <h3 className="text-white font-bold">الإشعارات</h3>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {unreadCount} جديد
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onMarkAllAsRead}
                          className="text-white hover:bg-white/20 h-8"
                        >
                          <CheckCheck className="w-4 h-4 ml-1" />
                          تحديد الكل كمقروء
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-white/20 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* فلاتر الفئات */}
                  <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                    {categoryFilters.map((cat) => (
                      <Button
                        key={cat.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'h-7 px-2 text-xs whitespace-nowrap transition-all',
                          category === cat.value
                            ? 'bg-white text-blue-700'
                            : 'text-white/80 hover:bg-white/20 hover:text-white'
                        )}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* التبويبات */}
                <div className="border-b bg-gray-50 px-4 py-2">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilter('all')}
                      className={cn(
                        'h-7 text-xs',
                        filter === 'all' ? 'text-blue-600 font-bold' : 'text-gray-500'
                      )}
                    >
                      الكل ({notifications.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilter('unread')}
                      className={cn(
                        'h-7 text-xs',
                        filter === 'unread' ? 'text-blue-600 font-bold' : 'text-gray-500'
                      )}
                    >
                      غير مقروء ({unreadCount})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilter('read')}
                      className={cn(
                        'h-7 text-xs',
                        filter === 'read' ? 'text-blue-600 font-bold' : 'text-gray-500'
                      )}
                    >
                      مقروء
                    </Button>
                  </div>
                </div>

                {/* قائمة الإشعارات */}
                <ScrollArea className="h-[400px]">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">لا توجد إشعارات</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {filter !== 'all'
                          ? 'جرب تغيير الفلتر'
                          : 'ستظهر الإشعارات الجديدة هنا'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      <AnimatePresence initial={false}>
                        {filteredNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onDelete={onDelete}
                            onLinkClick={handleLinkClick}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </ScrollArea>

                {/* التذييل */}
                {notifications.length > 0 && (
                  <div className="border-t p-3 bg-gray-50 flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDeleteAll}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف الكل
                    </Button>
                    {onRefresh && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                      >
                        تحديث
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
