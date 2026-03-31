import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      include: { branch: true, permissions: true },
    });
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: any = {
      email: body.email, name: body.name, nameAr: body.nameAr,
      phone: body.phone, avatar: body.avatar, role: body.role,
      branchId: body.branchId, isActive: body.isActive,
    };
    if (body.password) updateData.password = hashPassword(body.password);

    const user = await db.user.update({ where: { id }, data: updateData, include: { branch: true, permissions: true } });
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
