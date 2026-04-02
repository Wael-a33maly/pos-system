'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  Package,
  Clock,
  FileText,
  RotateCcw,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// أنواع الإشعارات
export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'SHIFT_REMINDER'
  | 'NEW_INVOICE'
  | 'INVOICE_CANCELLED'
  | 'INVOICE_RETURNED'
  | 'RETURN_REQUEST'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'SALES_TARGET'
  | 'DAILY_GOAL_ACHIEVED'
  | 'SYSTEM'
  | 'SYSTEM_UPDATE'
  | 'BACKUP_COMPLETE'
  | 'NEW_USER'
  | 'NEW_CUSTOMER'
  | 'PAYMENT_RECEIVED';

// واجهة الإشعار
export interface Notification {
  id: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: NotificationType | string;
  isRead: boolean;
  link?: string;
  createdAt: string | Date;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLinkClick?: (link: string) => void;
  isRTL?: boolean;
}

// أيقونات حسب النوع
const typeIcons: Record<string, typeof Bell> = {
  LOW_STOCK: AlertTriangle,
  OUT_OF_STOCK: Package,
  SHIFT_OPENED: Clock,
  SHIFT_CLOSED: Clock,
  SHIFT_REMINDER: Clock,
  NEW_INVOICE: FileText,
  INVOICE_CANCELLED: XCircle,
  INVOICE_RETURNED: RotateCcw,
  RETURN_REQUEST: RotateCcw,
  RETURN_APPROVED: CheckCircle,
  RETURN_REJECTED: XCircle,
  SALES_TARGET: Target,
  DAILY_GOAL_ACHIEVED: Target,
  SYSTEM: Bell,
  SYSTEM_UPDATE: Info,
  BACKUP_COMPLETE: CheckCircle,
  NEW_USER: Users,
  NEW_CUSTOMER: Users,
  PAYMENT_RECEIVED: CheckCircle,
};

// ألوان حسب النوع
const typeColors: Record<string, { bg: string; icon: string; border: string }> = {
  LOW_STOCK: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
  OUT_OF_STOCK: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  SHIFT_OPENED: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  SHIFT_CLOSED: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-200' },
  SHIFT_REMINDER: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' },
  NEW_INVOICE: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
  INVOICE_CANCELLED: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  INVOICE_RETURNED: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
  RETURN_REQUEST: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-200' },
  RETURN_APPROVED: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
  RETURN_REJECTED: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  SALES_TARGET: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-200' },
  DAILY_GOAL_ACHIEVED: { bg: 'bg-teal-50', icon: 'text-teal-500', border: 'border-teal-200' },
  SYSTEM: { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' },
  SYSTEM_UPDATE: { bg: 'bg-cyan-50', icon: 'text-cyan-500', border: 'border-cyan-200' },
  BACKUP_COMPLETE: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
  NEW_USER: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  NEW_CUSTOMER: { bg: 'bg-violet-50', icon: 'text-violet-500', border: 'border-violet-200' },
  PAYMENT_RECEIVED: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onLinkClick,
  isRTL = true,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const colors = typeColors[notification.type] || typeColors.SYSTEM;

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: isRTL ? ar : undefined,
  });

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link && onLinkClick) {
      onLinkClick(notification.link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative flex gap-3 p-3 rounded-lg cursor-pointer transition-all',
        'border hover:shadow-md',
        notification.isRead ? 'bg-white border-gray-100' : `${colors.bg} ${colors.border}`,
        'group'
      )}
      onClick={handleClick}
    >
      {/* مؤشر عدم القراءة */}
      {!notification.isRead && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500"
        />
      )}

      {/* الأيقونة */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          colors.bg
        )}
      >
        <Icon className={cn('w-5 h-5', colors.icon)} />
      </div>

      {/* المحتوى */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium truncate',
              notification.isRead ? 'text-gray-700' : 'text-gray-900'
            )}
          >
            {isRTL ? notification.titleAr || notification.title : notification.title}
          </h4>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        
        <p
          className={cn(
            'mt-1 text-sm line-clamp-2',
            notification.isRead ? 'text-gray-500' : 'text-gray-600'
          )}
        >
          {isRTL ? notification.messageAr || notification.message : notification.message}
        </p>

        {/* رابط الإجراء */}
        {notification.link && (
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
            <span>عرض التفاصيل</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead?.(notification.id);
            }}
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(notification.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </motion.div>
  );
}

export default NotificationItem;
