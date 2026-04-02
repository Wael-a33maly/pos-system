'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionAction } from '@/constants/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

// واجهة Props للمكون الأساسي
export interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action?: PermissionAction;
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

/**
 * مكون حماية العناصر بناءً على الصلاحيات
 * 
 * @example
 * // استخدام أساسي
 * <PermissionGuard module="products" action="write">
 *   <Button>إضافة منتج</Button>
 * </PermissionGuard>
 * 
 * @example
 * // مع fallback مخصص
 * <PermissionGuard 
 *   module="products" 
 *   action="delete"
 *   fallback={<span>لا تملك صلاحية الحذف</span>}
 * >
 *   <Button variant="destructive">حذف</Button>
 * </PermissionGuard>
 * 
 * @example
 * // مع عرض رسالة خطأ
 * <PermissionGuard 
 *   module="users" 
 *   action="write"
 *   showError
 * >
 *   <UserForm />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  module,
  action = 'read',
  fallback = null,
  showError = false,
  errorMessage,
}: PermissionGuardProps) {
  const { can } = usePermissions();

  if (can(module, action)) {
    return <>{children}</>;
  }

  if (showError) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          {errorMessage || `لا تملك صلاحية ${getActionText(action)} في ${module}`}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{fallback}</>;
}

// واجهة Props للتحقق من صلاحيات متعددة
export interface MultiPermissionGuardProps {
  children: ReactNode;
  permissions: Array<{ module: string; action?: PermissionAction }>;
  requireAll?: boolean;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * مكون للتحقق من صلاحيات متعددة
 * 
 * @example
 * // يتطلب جميع الصلاحيات
 * <MultiPermissionGuard 
 *   permissions={[
 *     { module: 'products', action: 'write' },
 *     { module: 'categories', action: 'read' }
 *   ]}
 *   requireAll
 * >
 *   <ProductForm />
 * </MultiPermissionGuard>
 * 
 * @example
 * // يتطلب أي صلاحية
 * <MultiPermissionGuard 
 *   permissions={[
 *     { module: 'products', action: 'write' },
 *     { module: 'products', action: 'delete' }
 *   ]}
 * >
 *   <Button>إدارة المنتجات</Button>
 * </MultiPermissionGuard>
 */
export function MultiPermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
  showError = false,
}: MultiPermissionGuardProps) {
  const { can, hasAny, hasAll } = usePermissions();

  const hasPermission = requireAll
    ? hasAll(
        permissions.map(p => p.module),
        permissions[0]?.action || 'read'
      )
    : hasAny(
        permissions.map(p => p.module),
        permissions[0]?.action || 'read'
      );

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showError) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          لا تملك الصلاحيات المطلوبة للوصول إلى هذا المحتوى
        </AlertDescription>
      </Alert>
    );
  }

  return <>{fallback}</>;
}

// واجهة Props للتحقق من الوصول لصفحة
export interface PageGuardProps {
  children: ReactNode;
  page: string;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * مكون للتحقق من الوصول لصفحة معينة
 * 
 * @example
 * <PageGuard page="users">
 *   <UsersPage />
 * </PageGuard>
 */
export function PageGuard({
  children,
  page,
  fallback = null,
  showAccessDenied = true,
}: PageGuardProps) {
  const { canAccessPage } = usePermissions();
  const result = canAccessPage(page);

  if (result.allowed) {
    return <>{children}</>;
  }

  if (showAccessDenied) {
    return <AccessDeniedPage reason={result.reason} />;
  }

  return <>{fallback}</>;
}

// واجهة Props للتحقق من الدور
export interface RoleGuardProps {
  children: ReactNode;
  roles: string | string[];
  fallback?: ReactNode;
}

/**
 * مكون للتحقق من دور المستخدم
 * 
 * @example
 * <RoleGuard roles="SUPER_ADMIN">
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * <RoleGuard roles={['SUPER_ADMIN', 'BRANCH_ADMIN']}>
 *   <ManagementPanel />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  roles,
  fallback = null,
}: RoleGuardProps) {
  const { user } = usePermissions();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasRole = user && allowedRoles.includes(user.role);

  if (hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// مكون صفحة الوصول المرفوض
function AccessDeniedPage({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" dir="rtl">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">الوصول مرفوض</h2>
      <p className="text-gray-600 mb-4 max-w-md">
        {reason || 'ليس لديك الصلاحية للوصول إلى هذه الصفحة'}
      </p>
      <Button variant="outline" onClick={() => window.history.back()}>
        العودة للخلف
      </Button>
    </div>
  );
}

// مكون زر محمي بصلاحية
export interface ProtectedButtonProps {
  children: ReactNode;
  module: string;
  action?: PermissionAction;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  hideIfNoPermission?: boolean;
}

/**
 * زر محمي بصلاحية - يتم تعطيله أو إخفاؤه إذا لم تكن الصلاحية متوفرة
 * 
 * @example
 * <ProtectedButton 
 *   module="products" 
 *   action="delete"
 *   variant="destructive"
 *   onClick={handleDelete}
 * >
 *   حذف المنتج
 * </ProtectedButton>
 */
export function ProtectedButton({
  children,
  module,
  action = 'write',
  onClick,
  disabled = false,
  className,
  variant = 'default',
  size = 'default',
  hideIfNoPermission = false,
}: ProtectedButtonProps) {
  const { can } = usePermissions();
  const hasPermission = can(module, action);

  if (!hasPermission && hideIfNoPermission) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      disabled={disabled || !hasPermission}
      title={!hasPermission ? 'ليس لديك صلاحية لهذا الإجراء' : undefined}
    >
      {children}
    </Button>
  );
}

// دوال مساعدة
function getActionText(action: PermissionAction): string {
  const texts: Record<PermissionAction, string> = {
    read: 'القراءة',
    write: 'الكتابة',
    delete: 'الحذف',
  };
  return texts[action];
}

// تصدير جميع المكونات
export default PermissionGuard;
