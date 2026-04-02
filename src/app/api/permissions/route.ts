import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MODULES, DEFAULT_PERMISSIONS, ROLE_NAMES, type PermissionAction, type PermissionDetail } from '@/constants/permissions';

// واجهة المستخدم مع الصلاحيات
interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: Array<{
    id: string;
    module: string;
    action: string;
    allowed: boolean;
  }>;
}

// واجهة الصلاحيات المجمعّة
interface GroupedPermissions {
  module: string;
  moduleName: string;
  moduleIcon: string;
  moduleDescription: string;
  actions: {
    read: { allowed: boolean; count: number };
    write: { allowed: boolean; count: number };
    delete: { allowed: boolean; count: number };
  };
}

// واجهة صلاحيات المستخدم
interface UserPermissions {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  roleName: string;
  permissions: PermissionDetail[];
  accessibleModules: string[];
}

/**
 * GET - جلب جميع الصلاحيات مع التجميع
 * يمكن تمرير userId لجلب صلاحيات مستخدم محدد
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    // التحقق من الصلاحية
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      // السماح للمستخدمين بجلب صلاحياتهم الخاصة
      const requestedUserId = request.nextUrl.searchParams.get('userId');
      
      if (!requestedUserId || requestedUserId !== currentUser?.id) {
        return NextResponse.json(
          { error: 'غير مصرح بالوصول' },
          { status: 403 }
        );
      }
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const grouped = request.nextUrl.searchParams.get('grouped') === 'true';

    // جلب صلاحيات مستخدم محدد
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          permissions: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        );
      }

      // دمج الصلاحيات المخزنة مع الافتراضية
      const defaultPerms = DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS] || [];
      const storedPerms = user.permissions.map(p => ({
        module: p.module,
        action: p.action as PermissionAction,
        allowed: p.allowed,
      }));

      // إنشاء خريطة للصلاحيات
      const permMap = new Map<string, PermissionDetail>();
      
      defaultPerms.forEach(p => {
        permMap.set(`${p.module}:${p.action}`, p);
      });
      
      storedPerms.forEach(p => {
        permMap.set(`${p.module}:${p.action}`, p);
      });

      const permissions = Array.from(permMap.values());
      const accessibleModules = [...new Set(permissions.filter(p => p.allowed).map(p => p.module))];

      const result: UserPermissions = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        roleName: ROLE_NAMES[user.role]?.name || user.role,
        permissions,
        accessibleModules,
      };

      return NextResponse.json(result);
    }

    // جلب جميع المستخدمين مع صلاحياتهم
    const users = await db.user.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // تجميع الصلاحيات
    if (grouped) {
      const groupedPermissions: GroupedPermissions[] = MODULES.map(module => {
        const moduleUsers = users.filter(u => {
          const userPerms = u.permissions.filter(p => p.module === module.id);
          return userPerms.some(p => p.allowed) || u.role === 'SUPER_ADMIN';
        });

        return {
          module: module.id,
          moduleName: module.name,
          moduleIcon: module.icon.name,
          moduleDescription: module.description,
          actions: {
            read: {
              allowed: module.actions.includes('read'),
              count: moduleUsers.filter(u => 
                u.role === 'SUPER_ADMIN' || 
                u.permissions.some(p => p.module === module.id && p.action === 'read' && p.allowed)
              ).length,
            },
            write: {
              allowed: module.actions.includes('write'),
              count: moduleUsers.filter(u => 
                u.role === 'SUPER_ADMIN' || 
                u.permissions.some(p => p.module === module.id && p.action === 'write' && p.allowed)
              ).length,
            },
            delete: {
              allowed: module.actions.includes('delete'),
              count: moduleUsers.filter(u => 
                u.role === 'SUPER_ADMIN' || 
                u.permissions.some(p => p.module === module.id && p.action === 'delete' && p.allowed)
              ).length,
            },
          },
        };
      });

      return NextResponse.json({
        modules: MODULES,
        groupedPermissions,
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          roleName: ROLE_NAMES[u.role]?.name || u.role,
          isActive: u.isActive,
        })),
        roles: Object.entries(ROLE_NAMES).map(([key, value]) => ({
          id: key,
          ...value,
        })),
      });
    }

    // إرجاع قائمة المستخدمين مع صلاحياتهم
    return NextResponse.json({
      modules: MODULES,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        roleName: ROLE_NAMES[u.role]?.name || u.role,
        isActive: u.isActive,
        permissions: u.permissions,
      })),
      roles: Object.entries(ROLE_NAMES).map(([key, value]) => ({
        id: key,
        ...value,
      })),
      defaultPermissions: DEFAULT_PERMISSIONS,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الصلاحيات' },
      { status: 500 }
    );
  }
}

/**
 * PUT - تحديث صلاحيات مستخدم
 */
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    // التحقق من الصلاحية - فقط مدير النظام يمكنه تعديل الصلاحيات
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح بتعديل الصلاحيات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, permissions, resetToDefault, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // منع تعديل صلاحيات مدير النظام
    if (user.role === 'SUPER_ADMIN' && currentUser.id !== user.id) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل صلاحيات مدير النظام' },
        { status: 403 }
      );
    }

    // إعادة تعيين للصلاحيات الافتراضية
    if (resetToDefault) {
      // حذف جميع الصلاحيات الحالية
      await db.permission.deleteMany({
        where: { userId },
      });

      return NextResponse.json({
        message: 'تم إعادة تعيين الصلاحيات للوضع الافتراضي',
        permissions: [],
      });
    }

    // تحديث دور المستخدم
    if (role && role !== user.role) {
      await db.user.update({
        where: { id: userId },
        data: { role },
      });

      // حذف الصلاحيات القديمة عند تغيير الدور
      await db.permission.deleteMany({
        where: { userId },
      });
    }

    // تحديث الصلاحيات
    if (permissions && Array.isArray(permissions)) {
      // حذف الصلاحيات القديمة
      await db.permission.deleteMany({
        where: { userId },
      });

      // إضافة الصلاحيات الجديدة
      const validPermissions = permissions.filter((p: PermissionDetail) => {
        const permModule = MODULES.find(m => m.id === p.module);
        return permModule && permModule.actions.includes(p.action);
      });

      if (validPermissions.length > 0) {
        await db.permission.createMany({
          data: validPermissions.map((p: PermissionDetail) => ({
            userId,
            module: p.module,
            action: p.action,
            allowed: p.allowed,
          })),
        });
      }
    }

    // جلب الصلاحيات المحدثة
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    return NextResponse.json({
      message: 'تم تحديث الصلاحيات بنجاح',
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        permissions: updatedUser?.permissions,
      },
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الصلاحيات' },
      { status: 500 }
    );
  }
}

/**
 * POST - إضافة صلاحية جديدة للمستخدم
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح بإضافة صلاحيات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, module, action, allowed } = body;

    if (!userId || !module || !action) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة الوحدة والإجراء
    const moduleConfig = MODULES.find(m => m.id === module);
    if (!moduleConfig || !moduleConfig.actions.includes(action as PermissionAction)) {
      return NextResponse.json(
        { error: 'وحدة أو إجراء غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود الصلاحية مسبقاً
    const existingPermission = await db.permission.findUnique({
      where: {
        userId_module_action: {
          userId,
          module,
          action,
        },
      },
    });

    if (existingPermission) {
      // تحديث الصلاحية الموجودة
      const updated = await db.permission.update({
        where: { id: existingPermission.id },
        data: { allowed },
      });
      return NextResponse.json(updated);
    }

    // إنشاء صلاحية جديدة
    const permission = await db.permission.create({
      data: {
        userId,
        module,
        action,
        allowed: allowed ?? true,
      },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الصلاحية' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - حذف صلاحية
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح بحذف الصلاحيات' },
        { status: 403 }
      );
    }

    const permissionId = request.nextUrl.searchParams.get('id');
    const userId = request.nextUrl.searchParams.get('userId');
    const permModule = request.nextUrl.searchParams.get('module');
    const action = request.nextUrl.searchParams.get('action');

    if (permissionId) {
      // حذف بواسطة معرف الصلاحية
      await db.permission.delete({
        where: { id: permissionId },
      });
    } else if (userId && permModule && action) {
      // حذف بواسطة المستخدم والوحدة والإجراء
      await db.permission.delete({
        where: {
          userId_module_action: {
            userId,
            module: permModule,
            action,
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: 'معرف الصلاحية أو تفاصيلها مطلوبة' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'تم حذف الصلاحية بنجاح' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الصلاحية' },
      { status: 500 }
    );
  }
}
