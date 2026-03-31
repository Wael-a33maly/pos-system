/**
 * useApi Hook Tests
 * اختبارات هوك useApi
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useLogin,
  useLogout,
  useCurrentUser,
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useInvoices,
  useCreateInvoice,
} from '@/hooks/useApi';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useApi Hooks', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
  });

  describe('Auth Hooks', () => {
    describe('useLogin', () => {
      it('should call login mutation with correct parameters', async () => {
        const mockMutate = jest.fn();
        const mockMutateAsync = jest.fn().mockResolvedValue({
          user: { id: '1', email: 'test@example.com' },
          token: 'test-token',
        });

        (useMutation as jest.Mock).mockReturnValue({
          mutate: mockMutate,
          mutateAsync: mockMutateAsync,
          isLoading: false,
          error: null,
        });

        const { result } = renderHook(() => useLogin());

        await act(async () => {
          await result.current.mutateAsync({
            email: 'test@example.com',
            password: 'password123',
          });
        });

        expect(useMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            mutationFn: expect.any(Function),
          })
        );
      });

      it('should invalidate auth queries on success', () => {
        (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
          if (onSuccess) onSuccess();
          return { mutate: jest.fn(), isLoading: false };
        });

        renderHook(() => useLogin());

        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['auth'],
        });
      });
    });

    describe('useLogout', () => {
      it('should call logout mutation', () => {
        const mockMutate = jest.fn();

        (useMutation as jest.Mock).mockReturnValue({
          mutate: mockMutate,
          isLoading: false,
        });

        const { result } = renderHook(() => useLogout());

        expect(useMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            mutationFn: expect.any(Function),
          })
        );
      });
    });

    describe('useCurrentUser', () => {
      it('should fetch current user', () => {
        const mockUser = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        };

        (useQuery as jest.Mock).mockReturnValue({
          data: { user: mockUser },
          isLoading: false,
          error: null,
        });

        const { result } = renderHook(() => useCurrentUser());

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['auth', 'me'],
          })
        );
        expect(result.current.data?.user).toEqual(mockUser);
      });

      it('should not retry on error', () => {
        renderHook(() => useCurrentUser());

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            retry: false,
          })
        );
      });
    });
  });

  describe('Products Hooks', () => {
    describe('useProducts', () => {
      it('should fetch products without params', () => {
        const mockProducts = [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' },
        ];

        (useQuery as jest.Mock).mockReturnValue({
          data: { products: mockProducts, total: 2 },
          isLoading: false,
        });

        const { result } = renderHook(() => useProducts());

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['products', undefined],
          })
        );
      });

      it('should fetch products with search params', () => {
        renderHook(() => useProducts({ search: 'test' }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['products', { search: 'test' }],
          })
        );
      });

      it('should fetch products with category filter', () => {
        renderHook(() => useProducts({ categoryId: 'cat-1' }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['products', { categoryId: 'cat-1' }],
          })
        );
      });

      it('should fetch products with branch filter', () => {
        renderHook(() => useProducts({ branchId: 'branch-1' }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['products', { branchId: 'branch-1' }],
          })
        );
      });
    });

    describe('useProduct', () => {
      it('should fetch single product by id', () => {
        const mockProduct = { id: '1', name: 'Product 1' };

        (useQuery as jest.Mock).mockReturnValue({
          data: { product: mockProduct },
          isLoading: false,
        });

        const { result } = renderHook(() => useProduct('1'));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['products', '1'],
            enabled: true,
          })
        );
      });

      it('should not fetch when id is empty', () => {
        renderHook(() => useProduct(''));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            enabled: false,
          })
        );
      });
    });

    describe('useCreateProduct', () => {
      it('should create product and invalidate queries', async () => {
        const mockProduct = { id: '1', name: 'New Product' };
        const mockMutate = jest.fn();

        (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
          if (onSuccess) onSuccess();
          return {
            mutate: mockMutate,
            mutateAsync: jest.fn().mockResolvedValue({ product: mockProduct }),
          };
        });

        const { result } = renderHook(() => useCreateProduct());

        expect(useMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            onSuccess: expect.any(Function),
          })
        );
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['products'],
        });
      });
    });

    describe('useUpdateProduct', () => {
      it('should update product and invalidate queries', () => {
        (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
          if (onSuccess) onSuccess();
          return { mutate: jest.fn() };
        });

        renderHook(() => useUpdateProduct());

        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['products'],
        });
      });
    });

    describe('useDeleteProduct', () => {
      it('should delete product and invalidate queries', () => {
        (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
          if (onSuccess) onSuccess();
          return { mutate: jest.fn() };
        });

        renderHook(() => useDeleteProduct());

        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['products'],
        });
      });
    });
  });

  describe('Invoices Hooks', () => {
    describe('useInvoices', () => {
      it('should fetch invoices without params', () => {
        const mockInvoices = [
          { id: '1', invoiceNumber: 'INV-000001' },
          { id: '2', invoiceNumber: 'INV-000002' },
        ];

        (useQuery as jest.Mock).mockReturnValue({
          data: { invoices: mockInvoices, total: 2 },
          isLoading: false,
        });

        const { result } = renderHook(() => useInvoices());

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['invoices', undefined],
          })
        );
      });

      it('should fetch invoices with status filter', () => {
        renderHook(() => useInvoices({ status: 'COMPLETED' }));

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['invoices', { status: 'COMPLETED' }],
          })
        );
      });

      it('should fetch invoices with date range', () => {
        renderHook(() =>
          useInvoices({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          })
        );

        expect(useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['invoices', { startDate: '2024-01-01', endDate: '2024-01-31' }],
          })
        );
      });
    });

    describe('useCreateInvoice', () => {
      it('should create invoice and invalidate relevant queries', () => {
        (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
          if (onSuccess) onSuccess();
          return { mutate: jest.fn() };
        });

        renderHook(() => useCreateInvoice());

        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['invoices'],
        });
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['shifts'],
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const error = new Error('Network error');

      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error,
      });

      const { result } = renderHook(() => useProducts());

      expect(result.current.error).toBe(error);
    });

    it('should handle mutation errors', async () => {
      const error = new Error('Mutation failed');

      (useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn().mockRejectedValue(error),
        isLoading: false,
        error,
      });

      const { result } = renderHook(() => useCreateProduct());

      expect(result.current.error).toBe(error);
    });
  });

  describe('Loading States', () => {
    it('should return loading state for queries', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useProducts());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading state for mutations', () => {
      (useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useCreateProduct());

      expect(result.current.isLoading).toBe(true);
    });
  });
});
