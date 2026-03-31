// ==================== User Types ====================
export type UserRole = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  nameAr?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: Branch;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  userId: string;
  module: string;
  action: string;
  allowed: boolean;
}

// ==================== Branch Types ====================
export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Product Types ====================
export interface Product {
  id: string;
  barcode: string;
  sku?: string;
  name: string;
  nameAr?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  branchId?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  image?: string;
  hasVariants: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
  variants?: ProductVariant[];
  inventory?: Inventory[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  nameAr?: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  attributes?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  image?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  branchId?: string;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  updatedAt: Date;
}

// ==================== Customer Types ====================
export interface Customer {
  id: string;
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Invoice Types ====================
export type InvoiceStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  branchId: string;
  userId: string;
  customerId?: string;
  shiftId?: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  notes?: string;
  isReturn: boolean;
  originalInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
  branch?: Branch;
  user?: User;
  customer?: Customer;
  shift?: Shift;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
  reference?: string;
  notes?: string;
  createdAt: Date;
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

// ==================== Shift Types ====================
export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  totalSales: number;
  totalReturns: number;
  totalExpenses: number;
  totalPayments: number;
  status: ShiftStatus;
  notes?: string;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  branch?: Branch;
  user?: User;
  closedByUser?: User;
}

// ==================== Expense Types ====================
export interface ExpenseCategory {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  isActive: boolean;
  expenses?: Expense[];
}

export interface Expense {
  id: string;
  branchId: string;
  shiftId?: string;
  categoryId: string;
  amount: number;
  description?: string;
  userId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: ExpenseCategory;
}

// ==================== Settings Types ====================
export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface Currency {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  symbol: string;
  decimalPlaces: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PrintTemplate {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  paperSize: string;
  width?: number;
  height?: number;
  template: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface BarcodeSetting {
  id: string;
  name: string;
  paperWidth: number;
  paperHeight: number;
  labelWidth: number;
  labelHeight: number;
  columns: number;
  rows: number;
  showProductName: boolean;
  showPrice: boolean;
  showBarcode: boolean;
  showSku: boolean;
  fontSize: number;
  barcodeHeight: number;
  isActive: boolean;
  isDefault: boolean;
}

// ==================== Cart Types ====================
export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountAmount: number;
  totalAmount: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  customer?: Customer;
  discountAmount: number;
  notes?: string;
}

// ==================== Notification Types ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// ==================== Dashboard Types ====================
export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  salesGrowth: number;
  ordersGrowth: number;
  recentSales: Invoice[];
  topProducts: { product: Product; quantity: number; revenue: number }[];
  lowStockProducts: Product[];
}

// ==================== App State Types ====================
export interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Branch
  currentBranch: Branch | null;
  branches: Branch[];
  
  // Shift
  currentShift: Shift | null;
  
  // UI
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  posMode: boolean;
  instantMode: boolean;
  fullscreen: boolean;
  
  // Cart
  cart: Cart;
  
  // Settings
  currency: Currency | null;
  decimalPlaces: number;
}
