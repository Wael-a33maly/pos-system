'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

// أنواع البيانات
export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string | Date;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

interface UseNotificationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableWebSocket?: boolean;
  wsUrl?: string;
}

interface UseNotificationsReturn {
  // البيانات
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  
  // الحالات
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  isConnected: boolean;
  
  // الإجراءات
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  
  // WebSocket
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook لإدارة الإشعارات
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000, // 30 ثانية
    enableWebSocket = false,
    wsUrl = '',
  } = options;

  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // جلب الإشعارات
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', { limit, offset }],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    staleTime: 10000, // 10 ثواني
    refetchOnWindowFocus: true,
  });

  // تحديث حالة القراءة
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // تحديث جميع الإشعارات كمقروءة
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // حذف إشعار
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // حذف جميع الإشعارات
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // الحصول على معرفات جميع الإشعارات
      const notificationIds = data?.notifications.map(n => n.id) || [];
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteIds: notificationIds }),
      });
      if (!response.ok) throw new Error('Failed to delete all notifications');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // جلب المزيد
  const fetchMore = useCallback(async () => {
    if (!data?.hasMore) return;
    setOffset((prev) => prev + limit);
  }, [data?.hasMore, limit]);

  // تحديث
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setOffset(0);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // تحديد كمقروء
  const markAsRead = useCallback(
    async (id: string) => {
      await markAsReadMutation.mutateAsync(id);
    },
    [markAsReadMutation]
  );

  // تحديد الكل كمقروء
  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  // حذف إشعار
  const deleteNotification = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  // حذف الكل
  const deleteAll = useCallback(async () => {
    await deleteAllMutation.mutateAsync();
  }, [deleteAllMutation]);

  // إعداد WebSocket
  const connect = useCallback(() => {
    if (!enableWebSocket || socketRef.current?.connected) return;

    const socketUrl = wsUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    
    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('notification', (notification: Notification) => {
      // إضافة الإشعار الجديد للقائمة
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', { limit, offset: 0 }],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: [notification, ...old.notifications],
            total: old.total + 1,
            unreadCount: old.unreadCount + 1,
          };
        }
      );

      // إظهار إشعار المتصفح
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.titleAr || notification.title, {
          body: notification.messageAr || notification.message,
          icon: '/icon-192x192.png',
        });
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }, [enableWebSocket, wsUrl, limit, offset, queryClient]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // تهيئة WebSocket
  useEffect(() => {
    if (enableWebSocket) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enableWebSocket, connect, disconnect]);

  // التحديث التلقائي
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // طلب إذن الإشعارات
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  return {
    // البيانات
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    total: data?.total || 0,
    hasMore: data?.hasMore || false,

    // الحالات
    isLoading,
    isRefreshing,
    error: error as Error | null,
    isConnected,

    // الإجراءات
    fetchMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,

    // WebSocket
    connect,
    disconnect,
  };
}

export default useNotifications;
