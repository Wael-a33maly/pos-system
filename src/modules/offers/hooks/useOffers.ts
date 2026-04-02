// ============================================
// useOffers Hook - هوك إدارة العروض
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  Offer, 
  OfferFormData, 
  OfferStats,
  OfferType,
  DiscountType 
} from '../types';

interface UseOffersReturn {
  // State
  offers: Offer[];
  loading: boolean;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  fetchData: () => Promise<void>;
  createOffer: (data: OfferFormData) => Promise<boolean>;
  updateOffer: (id: string, data: Partial<OfferFormData>) => Promise<boolean>;
  deleteOffer: (id: string) => Promise<boolean>;
  toggleOfferStatus: (id: string, isActive: boolean) => Promise<boolean>;
  
  // Computed
  filteredOffers: Offer[];
  stats: OfferStats;
}

export function useOffers(): UseOffersReturn {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState<OfferStats>({
    totalOffers: 0,
    activeOffers: 0,
    scheduledOffers: 0,
    expiredOffers: 0,
    totalUsages: 0,
    totalDiscount: 0,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await fetch(`/api/offers?${params.toString()}`);
      const data = await response.json();
      
      setOffers(data.offers || []);
      setStats(data.stats || {
        totalOffers: 0,
        activeOffers: 0,
        scheduledOffers: 0,
        expiredOffers: 0,
        totalUsages: 0,
        totalDiscount: 0,
      });
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      toast.error('فشل في تحميل العروض');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = 
        offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.nameAr && offer.nameAr.includes(searchQuery)) ||
        (offer.code && offer.code.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [offers, searchQuery]);

  // Create offer
  const createOffer = useCallback(async (data: OfferFormData): Promise<boolean> => {
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء العرض');
      }
      
      toast.success('تم إنشاء العرض بنجاح');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Update offer
  const updateOffer = useCallback(async (
    id: string, 
    data: Partial<OfferFormData>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في تحديث العرض');
      }
      
      toast.success('تم تحديث العرض بنجاح');
      await fetchData();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
      return false;
    }
  }, [fetchData]);

  // Delete offer
  const deleteOffer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('فشل في حذف العرض');
      
      const data = await response.json();
      toast.success(data.message || 'تم حذف العرض');
      await fetchData();
      return true;
    } catch {
      toast.error('فشل في حذف العرض');
      return false;
    }
  }, [fetchData]);

  // Toggle offer status
  const toggleOfferStatus = useCallback(async (
    id: string, 
    isActive: boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) throw new Error('فشل في تحديث حالة العرض');
      
      toast.success(isActive ? 'تم تفعيل العرض' : 'تم إلغاء تفعيل العرض');
      await fetchData();
      return true;
    } catch {
      toast.error('فشل في تحديث حالة العرض');
      return false;
    }
  }, [fetchData]);

  return {
    offers,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    fetchData,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleOfferStatus,
    filteredOffers,
    stats,
  };
}
