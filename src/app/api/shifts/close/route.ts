import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST /api/shifts/close - إغلاق الوردية
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { shiftId, actualCash, varianceReason, notes } = body;

    if (!shiftId || actualCash === undefined) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    // جلب الوردية
    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: {
        invoices: {
          include: {
            payments: { include: { paymentMethod: true } }
          }
        },
        expenses: true
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'الوردية غير موجودة' }, { status: 404 });
    }

    if (shift.status === 'CLOSED') {
      return NextResponse.json({ error: 'الوردية مغلقة بالفعل' }, { status: 400 });
    }

    // حساب الإحصائيات
    const completedInvoices = shift.invoices.filter(i => i.status === 'COMPLETED' && !i.isReturn);
    const returnInvoices = shift.invoices.filter(i => i.isReturn);
    const cancelledInvoices = shift.invoices.filter(i => i.status === 'CANCELLED');

    // حساب المدفوعات
    const paymentBreakdown: Record<string, number> = {};
    completedInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod.code;
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + payment.amount;
      });
    });

    const returnsBreakdown: Record<string, number> = {};
    returnInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod.code;
        returnsBreakdown[method] = (returnsBreakdown[method] || 0) + payment.amount;
      });
    });

    const totalSales = completedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDiscounts = completedInvoices.reduce((sum, i) => sum + i.discountAmount, 0);
    const totalExpenses = shift.expenses.reduce((sum, e) => sum + e.amount, 0);

    const cashSales = paymentBreakdown['cash'] || 0;
    const cardSales = paymentBreakdown['card'] || 0;
    const otherPayments = Object.entries(paymentBreakdown)
      .filter(([k]) => !['cash', 'card'].includes(k))
      .reduce((sum, [, v]) => sum + v, 0);

    const expectedCash = shift.openingCash + cashSales - (returnsBreakdown['cash'] || 0) - totalExpenses;
    const cashDifference = actualCash - expectedCash;

    // التحقق من سبب الفرق
    if (Math.abs(cashDifference) > 0.01 && !varianceReason) {
      return NextResponse.json({ 
        error: 'يجب إدخال سبب الفرق',
        expectedCash,
        actualCash,
        variance: cashDifference
      }, { status: 400 });
    }

    // الحصول على رقم الإغلاق التالي للمستخدم
    const lastCloseDetail = await db.shiftCloseDetail.findFirst({
      where: { userId: user.id },
      orderBy: { closingNumber: 'desc' }
    });
    const nextClosingNumber = (lastCloseDetail?.closingNumber || 0) + 1;

    // تنفيذ الإغلاق
    const updatedShift = await db.shift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        closingCash: actualCash,
        expectedCash,
        totalSales,
        totalReturns,
        totalExpenses,
        closedBy: user.id,
        notes: notes || shift.notes
      }
    });

    // إنشاء تفاصيل الإغلاق
    await db.shiftCloseDetail.create({
      data: {
        shiftId,
        userId: user.id,
        closingNumber: nextClosingNumber,
        openingCash: shift.openingCash,
        cashSales,
        cardSales,
        otherPayments,
        totalSales,
        totalReturns,
        totalDiscounts,
        totalExpenses,
        expectedCash,
        actualCash,
        cashDifference,
        totalInvoices: shift.invoices.length,
        completedInvoices: completedInvoices.length,
        cancelledInvoices: cancelledInvoices.length,
        returnInvoices: returnInvoices.length,
        totalItems: 0,
        totalQuantity: 0,
        notes: varianceReason || notes
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إغلاق الوردية بنجاح',
      data: {
        shiftId: updatedShift.id,
        closingNumber: nextClosingNumber,
        expectedCash,
        actualCash,
        variance: cashDifference,
        closedAt: updatedShift.endTime
      }
    });
  } catch (error) {
    console.error('Shift close error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
