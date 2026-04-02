// ============================================
// Roles & Permissions Types
// ============================================

export interface SystemPermission {
  id: string;
  module: string;
  action: string;
  name: string;
  nameAr: string;
  description?: string;
  group: string;
  groupAr: string;
  isActive: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  allowed: boolean;
  permission: SystemPermission;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  allowed: boolean;
  grantedBy?: string;
  grantedAt: Date;
  permission: SystemPermission;
}

export interface Role {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  priority: number;
  permissions?: RolePermission[];
  users?: { id: string; name: string; email: string }[];
  _count?: { users: number };
}

export interface User {
  id: string;
  email: string;
  name: string;
  nameAr?: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  branchId?: string;
  isActive: boolean;
  role?: Role | null;
  userPermissions?: UserPermission[];
}

export interface PermissionCheck {
  allowed: boolean;
  source: 'role' | 'user';
}

export interface UserWithPermissions extends User {
  permissions: Record<string, PermissionCheck>;
}

// Permission Groups
export const PERMISSION_GROUPS = {
  dashboard: { name: 'Dashboard', nameAr: 'لوحة التحكم' },
  products: { name: 'Products', nameAr: 'المنتجات' },
  pos: { name: 'Point of Sale', nameAr: 'نقطة البيع' },
  invoices: { name: 'Invoices', nameAr: 'الفواتير' },
  customers: { name: 'Customers', nameAr: 'العملاء' },
  suppliers: { name: 'Suppliers', nameAr: 'الموردين' },
  shifts: { name: 'Shifts', nameAr: 'الورديات' },
  expenses: { name: 'Expenses', nameAr: 'المصروفات' },
  reports: { name: 'Reports', nameAr: 'التقارير' },
  users: { name: 'Users', nameAr: 'المستخدمين' },
  settings: { name: 'Settings', nameAr: 'الإعدادات' },
  accounts: { name: 'Accounts', nameAr: 'الحسابات' },
} as const;

// Action Labels
export const ACTION_LABELS: Record<string, string> = {
  view: 'عرض',
  create: 'إنشاء',
  edit: 'تعديل',
  delete: 'حذف',
  export: 'تصدير',
  import: 'استيراد',
  approve: 'اعتماد',
  manage: 'إدارة',
  open: 'فتح',
  close: 'إغلاق',
  force_close: 'إغلاق إجباري',
  view_all: 'عرض الكل',
  discount: 'خصم',
  return: 'مرتجع',
  sales: 'مبيعات',
  profits: 'أرباح',
  branches: 'فروع',
  payment_methods: 'طرق دفع',
  currencies: 'عملات',
  print: 'طباعة',
  manage_permissions: 'إدارة الصلاحيات',
};
