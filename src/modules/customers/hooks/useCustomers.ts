// ============================================
// useCustomers Hook - هوك إدارة العملاء
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Customer, CustomerFormData } from '../types';

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchCustomers: () => Promise<void>;
  saveCustomer: (data: CustomerFormData, selectedCustomer: Customer | null) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  filteredCustomers: Customer[];
  stats: {
    totalCustomers: number;
    activeCustomers: number;
  };
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.isActive).length,
  }), [customers]);

  const saveCustomer = useCallback(async (
    data: CustomerFormData,
    selectedCustomer: Customer | null
  ): Promise<boolean> => {
    try {
      if (selectedCustomer) {
        const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('فشل في التحديث');
      } else {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('فشل في الإنشاء');
      }
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Failed to save customer:', error);
      return false;
    }
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    try {
      await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Failed to delete customer:', error);
      return false;
    }
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    searchQuery,
    setSearchQuery,
    fetchCustomers,
    saveCustomer,
    deleteCustomer,
    filteredCustomers,
    stats,
  };
}
