'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Permission {
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
  _count?: { users: number };
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  allowed: boolean;
  permission: Permission;
}

export interface UserPermissionData {
  id: string;
  userId: string;
  permissionId: string;
  allowed: boolean;
  grantedBy?: string;
  permission: Permission;
}

export interface GroupedPermissions {
  [group: string]: Permission[];
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/permissions?grouped=true');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      setGroupedPermissions(data.permissions);
      
      // Flatten for easy access
      const flat: Permission[] = [];
      Object.values(data.permissions).forEach((perms) => {
        flat.push(...(perms as Permission[]));
      });
      setPermissions(flat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب الصلاحيات');
    } finally {
      setLoading(false);
    }
  }, []);

  const initPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/permissions', { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to initialize permissions');
      const data = await res.json();
      await fetchPermissions();
      return data;
    } catch (err) {
      throw err;
    }
  }, [fetchPermissions]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    groupedPermissions,
    loading,
    error,
    refetch: fetchPermissions,
    initPermissions,
  };
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async (includePermissions = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/roles?includePermissions=${includePermissions}`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data.roles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب الأدوار');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: Partial<Role>) => {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل في إنشاء الدور');
    }
    const data = await res.json();
    await fetchRoles();
    return data.role;
  }, [fetchRoles]);

  const updateRole = useCallback(async (id: string, roleData: Partial<Role>) => {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل في تحديث الدور');
    }
    const data = await res.json();
    await fetchRoles();
    return data.role;
  }, [fetchRoles]);

  const deleteRole = useCallback(async (id: string) => {
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل في حذف الدور');
    }
    await fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

export function useUserPermissions(userId: string | null) {
  const [permissions, setPermissions] = useState<Record<string, { allowed: boolean; source: 'role' | 'user' }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = useCallback(async () => {
    if (!userId) {
      setPermissions({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}/permissions`);
      if (!res.ok) throw new Error('Failed to fetch user permissions');
      const data = await res.json();
      setPermissions(data.permissions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في جلب صلاحيات المستخدم');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const grantPermission = useCallback(async (permissionId: string, allowed: boolean, grantedBy?: string) => {
    if (!userId) return;
    
    const res = await fetch(`/api/users/${userId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionId, allowed, grantedBy }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل في تحديث الصلاحية');
    }
    await fetchUserPermissions();
  }, [userId, fetchUserPermissions]);

  const setAllPermissions = useCallback(async (perms: { permissionId: string; allowed: boolean }[], grantedBy?: string) => {
    if (!userId) return;
    
    const res = await fetch(`/api/users/${userId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: perms, grantedBy }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل في تحديث الصلاحيات');
    }
    await fetchUserPermissions();
  }, [userId, fetchUserPermissions]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    permissions,
    loading,
    error,
    refetch: fetchUserPermissions,
    grantPermission,
    setAllPermissions,
  };
}

// Helper to check permission
export function hasPermission(
  permissions: Record<string, { allowed: boolean; source: 'role' | 'user' }>,
  module: string,
  action: string
): boolean {
  const key = `${module}:${action}`;
  return permissions[key]?.allowed ?? false;
}
