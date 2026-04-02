'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Check, Trash2, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem, NotificationItemSkeleton } from './NotificationItem';
import type { Notification } from '@/types/notification';

interface NotificationBellProps {
  userId: string | null | undefined;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export function NotificationBell({
  userId,
  onNotificationClick,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications({ userId, enableWebSocket: false });

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
    if (notification.link) {
      setOpen(false);
      // يمكن إضافة التنقل هنا
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="الإشعارات"
        >
          <motion.div
            animate={{
              rotate: hasUnread ? [0, -15, 15, -15, 15, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: hasUnread ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            {hasUnread ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </motion.div>

          {/* Badge للإشعارات غير المقروءة */}
          <AnimatePresence>
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -left-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" dir="rtl">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              الإشعارات
            </h3>
            {hasUnread && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} جديد
              </Badge>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 ml-1" />
                    تحديد الكل
                  </>
                )}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                disabled={deleteAllNotifications.isPending}
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleteAllNotifications.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف الكل
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* قائمة الإشعارات */}
        <ScrollArea className="max-h-96">
          {isLoading ? (
            // حالة التحميل
            <div className="p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <NotificationItemSkeleton key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // حالة فارغة
            <div className="flex flex-col items-center justify-center py-12 px-4" dir="rtl">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
              >
                <Bell className="h-8 w-8 text-gray-400" />
              </motion.div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                لا توجد إشعارات
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ستظهر الإشعارات الجديدة هنا
              </p>
            </div>
          ) : (
            // قائمة الإشعارات
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClick={handleNotificationClick}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700 w-full"
                onClick={() => setOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
