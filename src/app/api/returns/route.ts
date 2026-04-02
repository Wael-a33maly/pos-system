import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع المرتجعات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const refundMethod = searchParams.get('refundMethod');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { returnNumber: { contains: search } },
        { originalInvoice: { invoiceNumber: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (refundMethod) where.refundMethod = refundMethod;
    if (branchId) where.branchId = branchId;
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          originalInvoice: {
            include: {
              customer: true,
            },
          },
          customer: true,
          branch: true,
          user: true,
          processedByUser: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.returnRequest.count({ where }),
    ]);

    // حساب الإحصائيات
    const stats = await db.returnRequest.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const pendingCount = await db.returnRequest.count({ where: { status: 'PENDING' } });
    const approvedCount = await db.returnRequest.count({ where: { status: 'APPROVED' } });
    const rejectedCount = await db.returnRequest.count({ where: { status: 'REJECTED' } });
    const completedCount = await db.returnRequest.count({ where: { status: 'COMPLETED' } });

    const pendingAmount = await db.returnRequest.aggregate({
      where: { status: 'PENDING' },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      returns,
      total,
      page,
      limit,
      stats: {
        total: stats._count.id,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        completed: completedCount,
        totalAmount: stats._sum.totalAmount || 0,
        pendingAmount: pendingAmount._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Get returns error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المرتجعات' }, { status: 500 });
  }
}

// POST - إنشاء مرتجع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من الفاتورة الأصلية
    const originalInvoice = await db.invoice.findUnique({
      where: { id: body.originalInvoiceId },
      include: { items: true },
    });

    if (!originalInvoice) {
      return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
    }

    // الحصول على رقم المرتجع الأخير
    const lastReturn = await db.returnRequest.findFirst({
      orderBy: { returnNumber: 'desc' },
      select: { returnNumber: true },
    });

    const returnNumber = lastReturn
      ? `RET-${String(parseInt(lastReturn.returnNumber.replace('RET-', '')) + 1).padStart(6, '0')}`
      : 'RET-000001';

    // حساب المبلغ الإجمالي
    const totalAmount = body.items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) => 
        sum + item.quantity * item.unitPrice,
      0
    );

    // إنشاء المرتجع
    const returnRequest = await db.returnRequest.create({
      data: {
        returnNumber,
        originalInvoiceId: body.originalInvoiceId,
        customerId: body.customerId || originalInvoice.customerId,
        branchId: body.branchId || originalInvoice.branchId,
        userId: body.userId,
        reason: body.reason,
        refundMethod: body.refundMethod,
        notes: body.notes,
        totalAmount,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            invoiceItemId: item.invoiceItemId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.quantity * item.unitPrice,
            reason: item.reason,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        originalInvoice: true,
        customer: true,
        branch: true,
        user: true,
      },
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المرتجع' }, { status: 500 });
  }
}
