import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// جلب صلاحيات مستخدم معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // جلب المستخدم مع دوره وصلاحياته
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // دمج الصلاحيات من الدور والصلاحيات الفردية
    const permissions: Record<string, { allowed: boolean; source: 'role' | 'user' }> = {};

    // إضافة صلاحيات الدور
    if (user.role?.permissions) {
      for (const rp of user.role.permissions) {
        const key = `${rp.permission.module}:${rp.permission.action}`;
        permissions[key] = {
          allowed: rp.allowed,
          source: 'role'
        };
      }
    }

    // إضافة/تحديث الصلاحيات الفردية (لها أولوية أعلى)
    for (const up of user.userPermissions) {
      const key = `${up.permission.module}:${up.permission.action}`;
      permissions[key] = {
        allowed: up.allowed,
        source: 'user'
      };
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      permissions 
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'فشل في جلب صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}

// تحديث صلاحيات مستخدم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { permissions, grantedBy } = body;

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حذف الصلاحيات الفردية القديمة
    await db.userPermission.deleteMany({
      where: { userId }
    });

    // إنشاء الصلاحيات الجديدة
    if (permissions && permissions.length > 0) {
      await db.userPermission.createMany({
        data: permissions.map((p: { permissionId: string; allowed: boolean }) => ({
          userId,
          permissionId: p.permissionId,
          allowed: p.allowed,
          grantedBy
        }))
      });
    }

    // جلب الصلاحيات المحدثة
    const updatedPermissions = await db.userPermission.findMany({
      where: { userId },
      include: {
        permission: true
      }
    });

    return NextResponse.json({ 
      message: 'تم تحديث الصلاحيات بنجاح',
      permissions: updatedPermissions 
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}

// تحديث صلاحية واحدة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { permissionId, allowed, grantedBy } = body;

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحديث أو إنشاء الصلاحية
    const permission = await db.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      update: {
        allowed,
        grantedBy
      },
      create: {
        userId,
        permissionId,
        allowed,
        grantedBy
      },
      include: {
        permission: true
      }
    });

    return NextResponse.json({ 
      message: allowed ? 'تم منح الصلاحية' : 'تم إلغاء الصلاحية',
      permission 
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث الصلاحية' },
      { status: 500 }
    );
  }
}

// حذف صلاحية فردية
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'معرف الصلاحية مطلوب' },
        { status: 400 }
      );
    }

    await db.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });

    return NextResponse.json({ 
      message: 'تم حذف الصلاحية الفردية' 
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'فشل في حذف الصلاحية' },
      { status: 500 }
    );
  }
}
