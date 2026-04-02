import type { User, Permission } from '@/types';
import type { PermissionAction, PermissionDetail } from '@/constants/permissions';
import { MODULES, hasPermissionInList, DEFAULT_PERMISSIONS } from '@/constants/permissions';

// واجهة نتيجة التحقق من الصلاحية
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: string;
}

// واجهة المستخدم مع الصلاحيات
export interface UserWithPermissions extends User {
  permissions?: Permission[];
}

/**
 * التحقق من صلاحية معينة لمستخدم
 */
export function checkPermission(
  user: UserWithPermissions | null,
  module: string,
  action: PermissionAction
): PermissionCheckResult {
  // إذا لم يكن المستخدم موجوداً
  if (!user) {
    return {
      allowed: false,
      reason: 'المستخدم غير مسجل الدخول',
    };
  }

  // إذا كان المستخدم غير مفعل
  if (!user.isActive) {
    return {
      allowed: false,
      reason: 'حساب المستخدم غير مفعل',
    };
  }

  // مدير النظام لديه كل الصلاحيات
  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // التحقق من وجود الوحدة
  const moduleConfig = MODULES.find(m => m.id === module);
  if (!moduleConfig) {
    return {
      allowed: false,
      reason: 'الوحدة غير موجودة',
    };
  }

  // التحقق من وجود الإجراء في الوحدة
  if (!moduleConfig.actions.includes(action)) {
    return {
      allowed: false,
      reason: 'الإجراء غير متوفر في هذه الوحدة',
    };
  }

  // التحقق من الصلاحيات المخزنة
  if (user.permissions && user.permissions.length > 0) {
    const permission = user.permissions.find(
      p => p.module === module && p.action === action
    );

    if (permission) {
      return {
        allowed: permission.allowed,
        reason: permission.allowed ? undefined : 'الصلاحية مرفوضة',
        requiredPermission: `${module}:${action}`,
      };
    }
  }

  // استخدام الصلاحيات الافتراضية للدور
  const defaultPermissions = DEFAULT_PERMISSIONS[user.role];
  if (defaultPermissions) {
    const hasDefault = hasPermissionInList(defaultPermissions, module, action);
    return {
      allowed: hasDefault,
      reason: hasDefault ? undefined : 'الصلاحية غير متوفرة لدورك',
      requiredPermission: `${module}:${action}`,
    };
  }

  // رفض افتراضي
  return {
    allowed: false,
    reason: 'الصلاحية غير متوفرة',
    requiredPermission: `${module}:${action}`,
  };
}

/**
 * التحقق من وجود أي صلاحية من مجموعة صلاحيات
 */
export function hasAnyPermission(
  user: UserWithPermissions | null,
  modules: string[],
  action: PermissionAction = 'read'
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  return modules.some(module => 
    checkPermission(user, module, action).allowed
  );
}

/**
 * التحقق من وجود جميع الصلاحيات المطلوبة
 */
export function hasAllPermissions(
  user: UserWithPermissions | null,
  modules: string[],
  action: PermissionAction = 'read'
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  return modules.every(module => 
    checkPermission(user, module, action).allowed
  );
}

/**
 * التحقق من صلاحيات متعددة
 */
export function checkMultiplePermissions(
  user: UserWithPermissions | null,
  permissions: Array<{ module: string; action: PermissionAction }>
): Record<string, PermissionCheckResult> {
  const results: Record<string, PermissionCheckResult> = {};

  permissions.forEach(({ module, action }) => {
    const key = `${module}:${action}`;
    results[key] = checkPermission(user, module, action);
  });

  return results;
}

/**
 * الحصول على جميع الصلاحيات المتاحة للمستخدم
 */
export function getUserPermissions(user: UserWithPermissions | null): PermissionDetail[] {
  if (!user) return [];
  
  // مدير النظام لديه كل الصلاحيات
  if (user.role === 'SUPER_ADMIN') {
    return MODULES.flatMap(module =>
      module.actions.map(action => ({
        module: module.id,
        action,
        allowed: true,
      }))
    );
  }

  // دمج الصلاحيات المخزنة مع الافتراضية
  const storedPermissions = (user.permissions || []).map(p => ({
    module: p.module,
    action: p.action as PermissionAction,
    allowed: p.allowed,
  }));

  const defaultPermissions = DEFAULT_PERMISSIONS[user.role] || [];

  // دمج مع تفضيل الصلاحيات المخزنة
  const permissionMap = new Map<string, PermissionDetail>();

  // إضافة الصلاحيات الافتراضية أولاً
  defaultPermissions.forEach(p => {
    permissionMap.set(`${p.module}:${p.action}`, p);
  });

  // تحديث بالصلاحيات المخزنة
  storedPermissions.forEach(p => {
    permissionMap.set(`${p.module}:${p.action}`, p);
  });

  return Array.from(permissionMap.values());
}

/**
 * الحصول على الوحدات المتاحة للمستخدم
 */
export function getAccessibleModules(user: UserWithPermissions | null): string[] {
  if (!user) return [];
  
  if (user.role === 'SUPER_ADMIN') {
    return MODULES.map(m => m.id);
  }

  const permissions = getUserPermissions(user);
  const accessibleModules = new Set<string>();

  permissions.forEach(p => {
    if (p.allowed) {
      accessibleModules.add(p.module);
    }
  });

  return Array.from(accessibleModules);
}

/**
 * التحقق من إمكانية الوصول لصفحة معينة
 */
export function canAccessPage(
  user: UserWithPermissions | null,
  page: string
): PermissionCheckResult {
  // خريطة الصفحات للوحدات
  const pageModuleMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'pos': 'pos',
    'products': 'products',
    'categories': 'categories',
    'brands': 'brands',
    'invoices': 'invoices',
    'returns': 'invoices',
    'customers': 'customers',
    'suppliers': 'suppliers',
    'users': 'users',
    'roles': 'roles',
    'shifts': 'shifts',
    'shift-close': 'shifts',
    'shift-closures': 'shifts',
    'audit-logs': 'shifts',
    'expenses': 'expenses',
    'expense-categories': 'expenses',
    'accounts': 'accounts',
    'reports': 'reports',
    'branches': 'branches',
    'settings': 'settings',
    'barcode': 'products',
    'import': 'products',
    'profile': 'dashboard', // صفحة الملف الشخصي متاحة للجميع
  };

  const permissionModule = pageModuleMap[page];
  
  if (!permissionModule) {
    // صفحة غير معروفة - نسمح بالوصول افتراضياً
    return { allowed: true };
  }

  return checkPermission(user, permissionModule, 'read');
}

/**
 * Helper function للتحقق السريع
 */
export function can(user: UserWithPermissions | null, permission: string): boolean {
  const [module, action] = permission.split(':') as [string, PermissionAction];
  if (!module || !action) return false;
  return checkPermission(user, module, action).allowed;
}

/**
 * تصدير دوال مختصرة
 */
export const permissions = {
  check: checkPermission,
  hasAny: hasAnyPermission,
  hasAll: hasAllPermissions,
  can,
  getUserPermissions,
  getAccessibleModules,
  canAccessPage,
};

export default permissions;
