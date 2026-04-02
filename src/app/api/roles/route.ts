import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// جلب جميع الأدوار
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';

    const roles = await db.role.findMany({
      include: {
        permissions: includePermissions ? {
          include: {
            permission: true
          }
        } : false,
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الأدوار' },
      { status: 500 }
    );
  }
}

// إنشاء دور جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameAr, description, color, permissions, priority } = body;

    // التحقق من عدم وجود الدور
    const existingRole = await db.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'الدور موجود مسبقاً' },
        { status: 400 }
      );
    }

    // إنشاء الدور
    const role = await db.role.create({
      data: {
        name,
        nameAr,
        description,
        color: color || '#3b82f6',
        priority: priority || 0,
        permissions: permissions ? {
          create: permissions.map((p: { permissionId: string; allowed: boolean }) => ({
            permissionId: p.permissionId,
            allowed: p.allowed
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الدور' },
      { status: 500 }
    );
  }
}
