// ============================================
// useTransfers Hook - هوك إدارة التحويلات
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  StockTransfer, 
  TransferFormData, 
  TransferStats,
  StockTransferStatus 
} from '../types';

interface UseTransfersReturn {
  // State
  transfers: StockTransfer[];
  loading: boolean;
  searchQuery: string;
  statusFilter: StockTransferStatus | 'all';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: StockTransferStatus | 'all') => void;
  fetchData: () => Promise<void>;
  createTransfer: (data: TransferFormData) => Promise<boolean>;
  updateTransferStatus: (id: string, status: StockTransferStatus, data?: any) => Promise<boolean>;
  deleteTransfer: (id: string) => Promise<boolean>;
  
  // Computed
  filteredTransfers: StockTransfer[];
  stats: TransferStats;
}

export function useTransfers(): UseTransfersReturn {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockTransferStatus | 'all'>('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transfers');
      const data = await response.json();
      setTransfers(data.transfers || []);
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
      toast.error('فشل في تحميل التحويلات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesSearch = t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.fromBranch?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.toBranch?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo((): TransferStats => ({
    totalTransfers: transfers.length,
    pendingTransfers: transfers.filter(t => t.status === 'PENDING').length,
    inTransitTransfers: transfers.filter(t => t.status === 'IN_TRANSIT').length,
    completedTransfers: transfers.filter(t => t.status === 'RECEIVED').length,
    totalValue: transfers.reduce((sum, t) => sum + t.totalValue, 0),
  }), [transfers]);

  // Create transfer
  const createTransfer = useCallback(async (data: TransferFormData): Promise<boolean> => {
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء التحويل');
      }
      
      toast.success('تم إنشاء التحويل بنجاح');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update transfer status
  const updateTransferStatus = useCallback(async (
    id: string, 
    status: StockTransferStatus, 
    data?: any
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/transfers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...data }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث التحويل');
      }
      
      const statusMessages: Record<StockTransferStatus, string> = {
        PENDING: 'تم إعادة التحويل للانتظار',
        APPROVED: 'تم اعتماد التحويل',
        REJECTED: 'تم رفض التحويل',
        IN_TRANSIT: 'تم بدء الشحن',
        RECEIVED: 'تم استلام التحويل',
        PARTIAL: 'تم الاستلام الجزئي',
        CANCELLED: 'تم إلغاء التحويل',
      };
      
      toast.success(statusMessages[status]);
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Delete transfer
  const deleteTransfer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/transfers/${id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('فشل في حذف التحويل');
      
      toast.success('تم حذف التحويل');
      await fetchData();
      return true;
    } catch {
      toast.error('فشل في حذف التحويل');
      return false;
    }
  }, [fetchData]);

  return {
    transfers,
    loading,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    fetchData,
    createTransfer,
    updateTransferStatus,
    deleteTransfer,
    filteredTransfers,
    stats,
  };
}
