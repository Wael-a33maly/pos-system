// ============================================
// Customers Types - أنواع العملاء
// ============================================

import type { Customer as GlobalCustomer } from '@/types';

// Re-export global type
export type { Customer };

// Form Data Types
export interface CustomerFormData {
  name: string;
  nameAr: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  notes: string;
  isActive: boolean;
}

// API Response Types
export interface CustomersApiResponse {
  customers: Customer[];
}

// State Types
export interface CustomersState {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
}

// Stats Types
export interface CustomersStats {
  totalCustomers: number;
  activeCustomers: number;
  totalPurchases: number;
}
