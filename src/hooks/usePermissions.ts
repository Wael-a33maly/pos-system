'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/constants/permissions';

export function usePermissions() {
  const { user } = useAppStore();

  const isSuperAdmin = useMemo(() => {
    return user?.role === 'SUPER_ADMIN';
  }, [user?.role]);

  const userPermissions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'SUPER_ADMIN') return ['all'];
    // استخراج الصلاحيات من المستخدم
    const permissions = (user as any).permissions || [];
    return permissions.map((p: any) => p.module && p.action ? `${p.module}:${p.action}` : p);
  }, [user]);

  const can = (module: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    if (isSuperAdmin) return true;
    return hasPermission(userPermissions, module, action);
  };

  const canRead = (module: string): boolean => can(module, 'read');
  const canWrite = (module: string): boolean => can(module, 'write');
  const canDelete = (module: string): boolean => can(module, 'delete');

  const canAny = (modules: string[]): boolean => {
    if (isSuperAdmin) return true;
    return hasAnyPermission(userPermissions, modules);
  };

  const canAll = (modules: string[]): boolean => {
    if (isSuperAdmin) return true;
    return hasAllPermissions(userPermissions, modules);
  };

  return {
    user,
    isSuperAdmin,
    userPermissions,
    can,
    canRead,
    canWrite,
    canDelete,
    canAny,
    canAll,
  };
}
