// ============================================
// usePurchases Hook - هوك إدارة المشتريات
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  PurchaseOrder, 
  PurchaseOrderFormData,
  PurchaseStats,
  PurchaseStatus 
} from '../types';

interface UsePurchasesReturn {
  // State
  orders: PurchaseOrder[];
  loading: boolean;
  searchQuery: string;
  statusFilter: PurchaseStatus | 'all';
  supplierFilter: string;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
  setSupplierFilter: (supplierId: string) => void;
  fetchData: () => Promise<void>;
  createOrder: (data: PurchaseOrderFormData) => Promise<boolean>;
  updateOrderStatus: (id: string, status: PurchaseStatus, data?: any) => Promise<boolean>;
  updateOrder: (id: string, data: any) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Computed
  filteredOrders: PurchaseOrder[];
  stats: PurchaseStats;
}

export function usePurchases(): UsePurchasesReturn {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (supplierFilter !== 'all') params.append('supplierId', supplierFilter);
      
      const response = await fetch(`/api/purchases?${params.toString()}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      toast.error('فشل في تحميل أوامر الشراء');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, supplierFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.nameAr?.includes(searchQuery);
      return matchesSearch;
    });
  }, [orders, searchQuery]);

  // Stats
  const stats = useMemo((): PurchaseStats => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'PENDING' || o.status === 'DRAFT').length,
    completedOrders: orders.filter(o => o.status === 'RECEIVED').length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalPaid: orders.reduce((sum, o) => sum + o.paidAmount, 0),
    totalPending: orders.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0),
    overdueOrders: orders.filter(o => {
      if (!o.expectedDate || o.status === 'RECEIVED' || o.status === 'CANCELLED') return false;
      return new Date(o.expectedDate) < new Date();
    }).length,
  }), [orders]);

  // Create order
  const createOrder = useCallback(async (data: PurchaseOrderFormData): Promise<boolean> => {
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء أمر الشراء');
      }
      
      toast.success('تم إنشاء أمر الشراء بنجاح');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update order status
  const updateOrderStatus = useCallback(async (
    id: string, 
    status: PurchaseStatus, 
    data?: any
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...data }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث أمر الشراء');
      }
      
      const statusMessages: Record<PurchaseStatus, string> = {
        DRAFT: 'تم إعادة الأمر للمسودة',
        PENDING: 'تم إرسال الأمر للمراجعة',
        APPROVED: 'تم اعتماد أمر الشراء',
        ORDERED: 'تم تأكيد الطلب للمورد',
        PARTIAL: 'تم الاستلام الجزئي',
        RECEIVED: 'تم الاستلام بالكامل',
        CANCELLED: 'تم إلغاء أمر الشراء',
      };
      
      toast.success(statusMessages[status]);
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update order
  const updateOrder = useCallback(async (id: string, data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث أمر الشراء');
      }
      
      toast.success('تم تحديث أمر الشراء');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Delete order
  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في حذف أمر الشراء');
      }
      
      toast.success('تم حذف أمر الشراء');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  return {
    orders,
    loading,
    searchQuery,
    statusFilter,
    supplierFilter,
    setSearchQuery,
    setStatusFilter,
    setSupplierFilter,
    fetchData,
    createOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    filteredOrders,
    stats,
  };
}
