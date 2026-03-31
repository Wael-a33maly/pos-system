import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');
    const shiftId = searchParams.get('shiftId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (search) where.invoiceNumber = { contains: search };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (shiftId) where.shiftId = shiftId;
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { items: true, payments: { include: { paymentMethod: true } }, customer: true, user: true, branch: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get last invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    
    const invoiceNumber = lastInvoice 
      ? `INV-${String(parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) + 1).padStart(6, '0')}`
      : 'INV-000001';

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        branchId: body.branchId,
        userId: body.userId,
        customerId: body.customerId,
        shiftId: body.shiftId,
        status: body.status || 'COMPLETED',
        paymentStatus: body.paymentStatus || 'PAID',
        subtotal: body.subtotal,
        taxAmount: body.taxAmount || 0,
        discountAmount: body.discountAmount || 0,
        totalAmount: body.totalAmount,
        paidAmount: body.paidAmount,
        changeAmount: body.changeAmount || 0,
        notes: body.notes,
        isReturn: body.isReturn || false,
        items: { create: body.items || [] },
        payments: { create: body.payments || [] },
      },
      include: { items: true, payments: true, customer: true },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الفاتورة' }, { status: 500 });
  }
}
