import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, Category, Brand, Customer, Supplier, Invoice, Shift, Expense, User, Branch, Setting, PaymentMethod, Currency } from '@/types';

// Base fetcher
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'حدث خطأ');
  }

  return response.json();
}

// ==================== Auth ====================
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      fetcher('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => fetcher('/api/auth/logout', { method: 'POST' }),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => fetcher<{ user: User }>('/api/auth/me'),
    retry: false,
  });
}

// ==================== Products ====================
export function useProducts(params?: { search?: string; categoryId?: string; branchId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetcher<{ products: Product[]; total: number }>(`/api/products?${searchParams}`),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => fetcher<{ product: Product }>(`/api/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Product>) =>
      fetcher('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      fetcher(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ==================== Categories ====================
export function useCategories(parentId?: string) {
  const searchParams = new URLSearchParams();
  if (parentId) searchParams.set('parentId', parentId);
  
  return useQuery({
    queryKey: ['categories', parentId],
    queryFn: () => fetcher<{ categories: Category[] }>(`/api/categories?${searchParams}`),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Category>) =>
      fetcher('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      fetcher(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ==================== Brands ====================
export function useBrands(search?: string) {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set('search', search);
  
  return useQuery({
    queryKey: ['brands', search],
    queryFn: () => fetcher<{ brands: Brand[] }>(`/api/brands?${searchParams}`),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Brand>) =>
      fetcher('/api/brands', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

// ==================== Customers ====================
export function useCustomers(search?: string) {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set('search', search);
  
  return useQuery({
    queryKey: ['customers', search],
    queryFn: () => fetcher<{ customers: Customer[] }>(`/api/customers?${searchParams}`),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      fetcher('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ==================== Suppliers ====================
export function useSuppliers(search?: string) {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set('search', search);
  
  return useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => fetcher<{ suppliers: Supplier[] }>(`/api/suppliers?${searchParams}`),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Supplier>) =>
      fetcher('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// ==================== Invoices ====================
export function useInvoices(params?: { status?: string; branchId?: string; startDate?: string; endDate?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => fetcher<{ invoices: Invoice[]; total: number }>(`/api/invoices?${searchParams}`),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => fetcher<{ invoice: Invoice }>(`/api/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Invoice>) =>
      fetcher('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// ==================== Shifts ====================
export function useShifts(params?: { branchId?: string; userId?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.userId) searchParams.set('userId', params.userId);
  if (params?.status) searchParams.set('status', params.status);
  
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: () => fetcher<{ shifts: Shift[] }>(`/api/shifts?${searchParams}`),
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { branchId: string; userId: string; openingCash?: number }) =>
      fetcher('/api/shifts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { closingCash: number; notes?: string; closedBy: string } }) =>
      fetcher(`/api/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// ==================== Expenses ====================
export function useExpenses(params?: { branchId?: string; categoryId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => fetcher<{ expenses: Expense[] }>(`/api/expenses?${searchParams}`),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Expense>) =>
      fetcher('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// ==================== Users ====================
export function useUsers(params?: { role?: string; branchId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetcher<{ users: User[] }>(`/api/users?${searchParams}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) =>
      fetcher('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) =>
      fetcher(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ==================== Branches ====================
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => fetcher<{ branches: Branch[] }>('/api/branches'),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Branch>) =>
      fetcher('/api/branches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

// ==================== Settings ====================
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetcher<{ settings: Record<string, string> }>('/api/settings'),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetcher('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ==================== Reports ====================
export function useSalesReport(params?: { startDate?: string; endDate?: string; branchId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => fetcher<{
      summary: { totalSales: number; totalReturns: number; netSales: number; totalInvoices: number; averageOrder: number };
      paymentBreakdown: Record<string, number>;
      dailySales: { date: string; sales: number; invoices: number }[];
    }>(`/api/reports/sales?${searchParams}`),
  });
}

export function useShiftsReport(params?: { startDate?: string; endDate?: string; branchId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  
  return useQuery({
    queryKey: ['reports', 'shifts', params],
    queryFn: () => fetcher<{
      shifts: Shift[];
      summary: { totalShifts: number; totalSales: number; totalReturns: number; totalExpenses: number };
    }>(`/api/reports/shifts?${searchParams}`),
  });
}
