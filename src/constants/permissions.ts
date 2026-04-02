// ==================== تعريف الصلاحيات ====================

export const PERMISSIONS = {
  // لوحة التحكم
  dashboard: {
    read: 'dashboard:read',
    write: 'dashboard:write',
    delete: 'dashboard:delete',
  },
  
  // نقطة البيع
  pos: {
    read: 'pos:read',
    write: 'pos:write',
    delete: 'pos:delete',
  },
  
  // المنتجات
  products: {
    read: 'products:read',
    write: 'products:write',
    delete: 'products:delete',
  },
  
  // الفئات
  categories: {
    read: 'categories:read',
    write: 'categories:write',
    delete: 'categories:delete',
  },
  
  // البراندات
  brands: {
    read: 'brands:read',
    write: 'brands:write',
    delete: 'brands:delete',
  },
  
  // العملاء
  customers: {
    read: 'customers:read',
    write: 'customers:write',
    delete: 'customers:delete',
  },
  
  // الموردين
  suppliers: {
    read: 'suppliers:read',
    write: 'suppliers:write',
    delete: 'suppliers:delete',
  },
  
  // الفواتير
  invoices: {
    read: 'invoices:read',
    write: 'invoices:write',
    delete: 'invoices:delete',
  },
  
  // المرتجعات
  returns: {
    read: 'returns:read',
    write: 'returns:write',
    delete: 'returns:delete',
  },
  
  // المصروفات
  expenses: {
    read: 'expenses:read',
    write: 'expenses:write',
    delete: 'expenses:delete',
  },
  
  // الحسابات
  accounts: {
    read: 'accounts:read',
    write: 'accounts:write',
    delete: 'accounts:delete',
  },
  
  // التقارير
  reports: {
    read: 'reports:read',
    write: 'reports:write',
    delete: 'reports:delete',
  },
  
  // الورديات
  shifts: {
    read: 'shifts:read',
    write: 'shifts:write',
    delete: 'shifts:delete',
  },
  
  // المستخدمين
  users: {
    read: 'users:read',
    write: 'users:write',
    delete: 'users:delete',
  },
  
  // الأدوار
  roles: {
    read: 'roles:read',
    write: 'roles:write',
    delete: 'roles:delete',
  },
  
  // الإعدادات
  settings: {
    read: 'settings:read',
    write: 'settings:write',
    delete: 'settings:delete',
  },
  
  // المخزون
  inventory: {
    read: 'inventory:read',
    write: 'inventory:write',
    delete: 'inventory:delete',
  },
  
  // التحويلات
  transfers: {
    read: 'transfers:read',
    write: 'transfers:write',
    delete: 'transfers:delete',
  },
  
  // المشتريات
  purchases: {
    read: 'purchases:read',
    write: 'purchases:write',
    delete: 'purchases:delete',
  },
  
  // العروض
  offers: {
    read: 'offers:read',
    write: 'offers:write',
    delete: 'offers:delete',
  },
  
  // نظام الولاء
  loyalty: {
    read: 'loyalty:read',
    write: 'loyalty:write',
    delete: 'loyalty:delete',
  },
  
  // الطباعة
  printing: {
    read: 'printing:read',
    write: 'printing:write',
    delete: 'printing:delete',
  },
  
  // سجل التدقيق
  audit: {
    read: 'audit:read',
    write: 'audit:write',
    delete: 'audit:delete',
  },
} as const;

// ==================== وحدات النظام ====================

export const MODULES = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: 'LayoutDashboard' },
  { id: 'pos', name: 'نقطة البيع', icon: 'ShoppingCart' },
  { id: 'products', name: 'المنتجات', icon: 'Package' },
  { id: 'categories', name: 'الفئات', icon: 'Tags' },
  { id: 'brands', name: 'البراندات', icon: 'Layers' },
  { id: 'customers', name: 'العملاء', icon: 'Users' },
  { id: 'suppliers', name: 'الموردين', icon: 'Truck' },
  { id: 'invoices', name: 'الفواتير', icon: 'Receipt' },
  { id: 'returns', name: 'المرتجعات', icon: 'RotateCcw' },
  { id: 'expenses', name: 'المصروفات', icon: 'Wallet' },
  { id: 'accounts', name: 'الحسابات', icon: 'Calculator' },
  { id: 'reports', name: 'التقارير', icon: 'BarChart3' },
  { id: 'shifts', name: 'الورديات', icon: 'Clock' },
  { id: 'users', name: 'المستخدمين', icon: 'UserCog' },
  { id: 'roles', name: 'الأدوار', icon: 'Shield' },
  { id: 'settings', name: 'الإعدادات', icon: 'Settings' },
  { id: 'inventory', name: 'المخزون', icon: 'ClipboardList' },
  { id: 'transfers', name: 'التحويلات', icon: 'ArrowRightLeft' },
  { id: 'purchases', name: 'المشتريات', icon: 'ShoppingBag' },
  { id: 'offers', name: 'العروض', icon: 'Percent' },
  { id: 'loyalty', name: 'الولاء', icon: 'Gift' },
  { id: 'printing', name: 'الطباعة', icon: 'Printer' },
  { id: 'audit', name: 'سجل التدقيق', icon: 'FileText' },
] as const;

// ==================== أنواع الإجراءات ====================

export const ACTIONS = {
  read: { id: 'read', name: 'قراءة', nameAr: 'قراءة' },
  write: { id: 'write', name: 'كتابة', nameAr: 'كتابة' },
  delete: { id: 'delete', name: 'حذف', nameAr: 'حذف' },
} as const;

// ==================== الصلاحيات الافتراضية للأدوار ====================

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['all'], // جميع الصلاحيات
  
  BRANCH_ADMIN: [
    'dashboard:read', 'dashboard:write',
    'pos:read', 'pos:write',
    'products:read', 'products:write',
    'categories:read', 'categories:write',
    'customers:read', 'customers:write',
    'invoices:read', 'invoices:write',
    'returns:read', 'returns:write',
    'expenses:read', 'expenses:write',
    'reports:read',
    'shifts:read', 'shifts:write',
    'inventory:read', 'inventory:write',
    'offers:read', 'offers:write',
    'printing:read', 'printing:write',
  ],
  
  USER: [
    'dashboard:read',
    'pos:read', 'pos:write',
    'products:read',
    'customers:read',
    'invoices:read',
    'shifts:read',
  ],
};

// ==================== مساعدات ====================

export function getPermissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}

export function parsePermissionKey(key: string): { module: string; action: string } | null {
  const parts = key.split(':');
  if (parts.length !== 2) return null;
  return { module: parts[0], action: parts[1] };
}

export function hasPermission(
  userPermissions: string[],
  module: string,
  action: string
): boolean {
  if (userPermissions.includes('all')) return true;
  return userPermissions.includes(getPermissionKey(module, action));
}

export function hasAnyPermission(
  userPermissions: string[],
  modules: string[]
): boolean {
  if (userPermissions.includes('all')) return true;
  return modules.some(module => 
    userPermissions.some(p => p.startsWith(`${module}:`))
  );
}

export function hasAllPermissions(
  userPermissions: string[],
  modules: string[]
): boolean {
  if (userPermissions.includes('all')) return true;
  return modules.every(module => 
    userPermissions.some(p => p.startsWith(`${module}:`))
  );
}
