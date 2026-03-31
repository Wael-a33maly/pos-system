// ============================================
// Shared Types - الأنواع المشتركة
// ============================================

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Common Types
export interface SelectOption {
  value: string;
  label: string;
  labelAr?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith';
  value: any;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// UI Types
export type ColorVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusBadge {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  label: string;
  color: ColorVariant;
}
