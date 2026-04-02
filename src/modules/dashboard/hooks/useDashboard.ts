// ============================================
// useDashboard Hook - هوك لوحة التحكم
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { 
  DashboardData, 
  CurrencySettings, 
  UseDashboardOptions, 
  UseDashboardReturn 
} from '../types';

const DEFAULT_CURRENCY: CurrencySettings = {
  code: 'SAR',
  symbol: 'ر.س',
  decimalPlaces: 2,
};

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { 
    selectedBranch: initialBranch = '', 
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [currency, setCurrency] = useState<CurrencySettings>(DEFAULT_CURRENCY);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);

  // Fetch settings for currency
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const result = await res.json();
          const settings = result.settings || {};
          if (settings.defaultCurrency) {
            try {
              const currencies = settings.currencies ? JSON.parse(settings.currencies) : [];
              const defaultCurrency = currencies.find((c: any) => c.code === settings.defaultCurrency || c.isDefault);
              if (defaultCurrency) {
                setCurrency({
                  code: defaultCurrency.code,
                  symbol: defaultCurrency.symbol,
                  decimalPlaces: defaultCurrency.decimalPlaces || 2,
                });
              }
            } catch {
              setCurrency(prev => ({ ...prev, code: settings.defaultCurrency }));
            }
          }
          if (settings.decimalPlaces) {
            setCurrency(prev => ({ ...prev, decimalPlaces: parseInt(settings.decimalPlaces) }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }
    };
    fetchSettings();
  }, []);

  // Fetch branches for filter
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || data || []);
        }
      } catch (e) {
        console.error('Failed to fetch branches:', e);
      }
    };
    fetchBranches();
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Request aborted due to timeout');
      } else {
        setError('حدث خطأ في تحميل البيانات');
        console.error('Dashboard fetch error:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch]);

  // Initial fetch and on branch change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refreshing,
    branches,
    currency,
    selectedBranch,
    setSelectedBranch,
    refresh: () => fetchData(true),
  };
}
