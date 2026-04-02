import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// جلب دور محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const role = await db.role.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true }
        },
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'فشل في جلب الدور' }, { status: 500 });
  }
}

// تحديث دور
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nameAr, description, color, priority, permissions, isActive } = body;

    // التحقق من وجود الدور
    const existingRole = await db.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم
    if (name && name !== existingRole.name) {
      const nameExists = await db.role.findUnique({
        where: { name }
      });
      if (nameExists) {
        return NextResponse.json({ error: 'اسم الدور مستخدم بالفعل' }, { status: 400 });
      }
    }

    // تحديث الدور
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;

    // تحديث الصلاحيات إذا تم تمريرها
    if (permissions !== undefined) {
      // حذف الصلاحيات القديمة
      await db.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // إضافة الصلاحيات الجديدة
      if (permissions.length > 0) {
        await db.rolePermission.createMany({
          data: permissions.map((p: { permissionId: string; allowed: boolean }) => ({
            roleId: id,
            permissionId: p.permissionId,
            allowed: p.allowed
          }))
        });
      }
    }

    const role = await db.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'فشل في تحديث الدور' }, { status: 500 });
  }
}

// حذف دور
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الدور
    const role = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // التحقق من أن الدور ليس دور نظام
    if (role.isSystem) {
      return NextResponse.json({ error: 'لا يمكن حذف أدوار النظام' }, { status: 400 });
    }

    // التحقق من عدم وجود مستخدمين مرتبطين
    if (role._count.users > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف دور مرتبط بمستخدمين' },
        { status: 400 }
      );
    }

    // حذف الصلاحيات المرتبطة أولاً
    await db.rolePermission.deleteMany({
      where: { roleId: id }
    });

    // حذف الدور
    await db.role.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'تم حذف الدور بنجاح' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'فشل في حذف الدور' }, { status: 500 });
  }
}
