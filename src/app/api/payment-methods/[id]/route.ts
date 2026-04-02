import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paymentMethod = await db.paymentMethod.findUnique({ where: { id } });
    if (!paymentMethod) return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 });
    return NextResponse.json({ paymentMethod });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const paymentMethod = await db.paymentMethod.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        isActive: body.isActive,
      },
    });
    return NextResponse.json({ paymentMethod });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.paymentMethod.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
