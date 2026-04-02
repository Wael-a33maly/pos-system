import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const branch = await db.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const branch = await db.branch.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        address: body.address,
        phone: body.phone,
        email: body.email,
        invoicePrefix: body.invoicePrefix,
        isActive: body.isActive,
      },
    });
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.branch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
