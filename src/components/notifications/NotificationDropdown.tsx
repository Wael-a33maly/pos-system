'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  Check,
  Trash2,
  Loader2,
  Settings,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem, NotificationItemSkeleton } from './NotificationItem';
import type { Notification, NotificationType } from '@/types/notification';
import { NOTIFICATION_CONFIG } from '@/types/notification';

interface NotificationDropdownProps {
  userId: string | null | undefined;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
  showFilters?: boolean;
}

export function NotificationDropdown({
  userId,
  onNotificationClick,
  className,
  showFilters = true,
}: NotificationDropdownProps) {
  const [filter, setFilter] = React.useState<'all' | NotificationType>('all');
  const [isOpen, setIsOpen] = React.useState(false);

  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications({ userId, enableWebSocket: false });

  // تصفية الإشعارات
  const filteredNotifications = React.useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  // حساب عدد الإشعارات لكل نوع
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    notifications.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications.mutateAsync();
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="relative">
            {hasUnread ? (
              <BellRing className="h-5 w-5 text-blue-500" />
            ) : (
              <Bell className="h-5 w-5 text-gray-500" />
            )}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              مركز الإشعارات
            </h3>
            <p className="text-xs text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} إشعار غير مقروء`
                : 'جميع الإشعارات مقروءة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="h-8 text-xs"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
              ) : (
                <Check className="h-3 w-3 ml-1" />
              )}
              تحديد الكل كمقروء
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deleteAllNotifications.isPending}
              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleteAllNotifications.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
              ) : (
                <Trash2 className="h-3 w-3 ml-1" />
              )}
              حذف الكل
            </Button>
          )}
        </div>
      </div>

      {/* الفلاتر */}
      {showFilters && notifications.length > 0 && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50" dir="rtl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7 text-xs flex-shrink-0"
            >
              الكل
              <Badge variant="secondary" className="mr-1 h-4 px-1.5 text-[10px]">
                {typeCounts.all}
              </Badge>
            </Button>
            {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => {
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              return (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type as NotificationType)}
                  className="h-7 text-xs flex-shrink-0"
                >
                  {config.labelAr}
                  <Badge variant="secondary" className="mr-1 h-4 px-1.5 text-[10px]">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* قائمة الإشعارات */}
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          // حالة التحميل
          <div className="p-2">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <NotificationItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          // حالة فارغة
          <div className="flex flex-col items-center justify-center py-16 px-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
            >
              {filter === 'all' ? (
                <Bell className="h-10 w-10 text-gray-400" />
              ) : (
                <Filter className="h-10 w-10 text-gray-400" />
              )}
            </motion.div>
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">
              {filter === 'all' ? 'لا توجد إشعارات' : 'لا توجد إشعارات بهذا النوع'}
            </p>
            <p className="text-sm text-gray-400 mt-1 text-center">
              {filter === 'all'
                ? 'ستظهر الإشعارات الجديدة هنا عند وصولها'
                : 'جرب تغيير الفلتر لعرض إشعارات أخرى'}
            </p>
          </div>
        ) : (
          // قائمة الإشعارات
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50" dir="rtl">
            <span className="text-xs text-gray-500">
              إجمالي {total} إشعار
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <Settings className="h-3 w-3 ml-1" />
              إعدادات الإشعارات
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// نسخة مبسطة للقائمة المنسدلة
export function NotificationDropdownSimple({
  userId,
  onNotificationClick,
  className,
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    deleteNotification,
  } = useNotifications({ userId, enableWebSocket: false });

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  return (
    <div className={cn('w-full', className)}>
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center" dir="rtl">
          <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">لا توجد إشعارات</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          {notifications.slice(0, 10).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              onClick={onNotificationClick}
            />
          ))}
        </ScrollArea>
      )}
    </div>
  );
}
