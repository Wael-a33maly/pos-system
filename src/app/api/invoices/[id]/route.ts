import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { items: { include: { product: true, variant: true } }, payments: { include: { paymentMethod: true } }, customer: true, user: true, branch: true },
    });
    if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const invoice = await db.invoice.update({
      where: { id },
      data: { status: body.status, paymentStatus: body.paymentStatus, notes: body.notes },
    });
    return NextResponse.json({ invoice });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
