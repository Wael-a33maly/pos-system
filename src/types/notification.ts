// ==================== Notification Types ====================

export type NotificationType = 
  | 'LOW_STOCK'
  | 'NEW_ORDER'
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'PAYMENT_RECEIVED'
  | 'RETURN_REQUEST'
  | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  data?: Record<string, any>;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface NotificationApiResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  data?: Record<string, any>;
  link?: string;
}

export interface UpdateNotificationData {
  isRead?: boolean;
  ids?: string[];
}

// ==================== Notification Config ====================

export interface NotificationConfig {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  labelAr: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  LOW_STOCK: {
    icon: 'AlertTriangle',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Low Stock',
    labelAr: 'مخزون منخفض',
  },
  NEW_ORDER: {
    icon: 'ShoppingCart',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'New Order',
    labelAr: 'طلب جديد',
  },
  SHIFT_OPENED: {
    icon: 'Clock',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Shift Opened',
    labelAr: 'وردية مفتوحة',
  },
  SHIFT_CLOSED: {
    icon: 'Clock',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Shift Closed',
    labelAr: 'وردية مغلقة',
  },
  PAYMENT_RECEIVED: {
    icon: 'CreditCard',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Payment Received',
    labelAr: 'دفعة مستلمة',
  },
  RETURN_REQUEST: {
    icon: 'RotateCcw',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Return Request',
    labelAr: 'طلب إرجاع',
  },
  SYSTEM_ALERT: {
    icon: 'AlertCircle',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'System Alert',
    labelAr: 'تنبيه النظام',
  },
};
