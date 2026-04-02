import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const branchId = searchParams.get('branchId');
    
    const where: any = {};
    if (role) where.role = role;
    if (branchId) where.branchId = branchId;

    const users = await db.user.findMany({
      where,
      include: { branch: true, permissions: true },
      orderBy: { name: 'asc' },
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json({ users: usersWithoutPasswords });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hashedPassword = hashPassword(body.password);
    
    const user = await db.user.create({
      data: {
        email: body.email, password: hashedPassword, name: body.name, nameAr: body.nameAr,
        phone: body.phone, avatar: body.avatar, role: body.role || 'USER',
        branchId: body.branchId, isActive: body.isActive ?? true,
        permissions: body.permissions ? { create: body.permissions } : undefined,
      },
      include: { branch: true, permissions: true },
    });

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
