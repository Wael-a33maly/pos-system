// ============================================
// useApi Hook - إدارة طلبات API
// ============================================

import { useState, useCallback } from 'react';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  autoFetch?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook موحد للتعامل مع API
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'حدث خطأ غير متوقع';
        setError(errorMessage);
        onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook للطلبات GET مع تخزين مؤقت
 */
export function useQuery<T = any>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  } = {}
) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  return useApi(fetcher, {
    autoFetch: enabled,
  });
}

/**
 * Hook للطلبات POST/PUT/DELETE
 */
export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseApiOptions = {}
) {
  return useApi<T>(mutationFn as any, options);
}
