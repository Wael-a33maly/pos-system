// ============================================
// useInventoryCount Hook - هوك إدارة الجرد الدوري
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  InventoryCount, 
  InventoryCountFormData,
  InventoryStats,
  CountStatus,
  CountType
} from '../types';

interface UseInventoryCountReturn {
  // State
  counts: InventoryCount[];
  adjustments: any[];
  loading: boolean;
  searchQuery: string;
  statusFilter: CountStatus | 'all';
  typeFilter: CountType | 'all';
  activeTab: 'counts' | 'adjustments';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: CountStatus | 'all') => void;
  setTypeFilter: (type: CountType | 'all') => void;
  setActiveTab: (tab: 'counts' | 'adjustments') => void;
  fetchData: () => Promise<void>;
  createCount: (data: InventoryCountFormData) => Promise<boolean>;
  updateCountStatus: (id: string, status: CountStatus, data?: any) => Promise<boolean>;
  updateCountItems: (id: string, items: any[]) => Promise<boolean>;
  deleteCount: (id: string) => Promise<boolean>;
  
  // Computed
  filteredCounts: InventoryCount[];
  stats: InventoryStats;
}

export function useInventoryCount(): UseInventoryCountReturn {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CountType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'counts' | 'adjustments'>('counts');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [countsRes, adjustmentsRes] = await Promise.all([
        fetch('/api/inventory-count'),
        fetch('/api/inventory-adjustment')
      ]);
      
      const countsData = await countsRes.json();
      const adjustmentsData = await adjustmentsRes.json();
      
      setCounts(countsData.counts || []);
      setAdjustments(adjustmentsData.adjustments || []);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast.error('فشل في تحميل بيانات الجرد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered counts
  const filteredCounts = useMemo(() => {
    return counts.filter(c => {
      const matchesSearch = c.countNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.branch?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesType = typeFilter === 'all' || c.countType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [counts, searchQuery, statusFilter, typeFilter]);

  // Stats
  const stats = useMemo((): InventoryStats => ({
    totalCounts: counts.length,
    completedCounts: counts.filter(c => c.status === 'COMPLETED').length,
    inProgressCounts: counts.filter(c => c.status === 'IN_PROGRESS').length,
    pendingReviewCounts: counts.filter(c => c.status === 'PENDING_REVIEW').length,
    totalAdjustments: adjustments.length,
    pendingAdjustments: adjustments.filter((a: any) => a.status === 'PENDING').length,
    totalAdjustmentValue: adjustments.reduce((sum: number, a: any) => sum + (a.totalValue || 0), 0),
  }), [counts, adjustments]);

  // Create count
  const createCount = useCallback(async (data: InventoryCountFormData): Promise<boolean> => {
    try {
      const response = await fetch('/api/inventory-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء عملية الجرد');
      }
      
      toast.success('تم إنشاء عملية الجرد بنجاح');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update count status
  const updateCountStatus = useCallback(async (
    id: string, 
    status: CountStatus, 
    data?: any
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory-count/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...data }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث حالة الجرد');
      }
      
      const statusMessages: Record<CountStatus, string> = {
        DRAFT: 'تم إعادة الجرد للمسودة',
        SCHEDULED: 'تم جدولة الجرد',
        IN_PROGRESS: 'تم بدء الجرد',
        PENDING_REVIEW: 'تم إرسال الجرد للمراجعة',
        APPROVED: 'تم اعتماد الجرد',
        COMPLETED: 'تم إكمال الجرد',
        CANCELLED: 'تم إلغاء الجرد',
      };
      
      toast.success(statusMessages[status]);
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update count items
  const updateCountItems = useCallback(async (
    id: string, 
    items: any[]
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory-count/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث عناصر الجرد');
      }
      
      toast.success('تم حفظ الكميات');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Delete count
  const deleteCount = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory-count/${id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في حذف الجرد');
      }
      
      toast.success('تم حذف عملية الجرد');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  return {
    counts,
    adjustments,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    activeTab,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setActiveTab,
    fetchData,
    createCount,
    updateCountStatus,
    updateCountItems,
    deleteCount,
    filteredCounts,
    stats,
  };
}
