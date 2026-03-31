import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/shifts/[id] - تفاصيل الوردية
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    // جلب بيانات الوردية
    const shift = await db.shift.findUnique({
      where: { id },
      include: {
        branch: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        closedByUser: {
          select: { id: true, name: true }
        },
        invoices: {
          include: {
            items: true,
            payments: {
              include: { paymentMethod: true }
            }
          }
        },
        expenses: {
          include: { category: true }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'الوردية غير موجودة' }, { status: 404 });
    }

    // حساب الإحصائيات
    const completedInvoices = shift.invoices.filter(i => i.status === 'COMPLETED' && !i.isReturn);
    const returnInvoices = shift.invoices.filter(i => i.isReturn);
    const cancelledInvoices = shift.invoices.filter(i => i.status === 'CANCELLED');

    // حساب المدفوعات حسب الطريقة
    const paymentBreakdown: Record<string, { amount: number; count: number }> = {};
    
    completedInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod.code;
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { amount: 0, count: 0 };
        }
        paymentBreakdown[method].amount += payment.amount;
        paymentBreakdown[method].count += 1;
      });
    });

    // حساب المرتجعات حسب طريقة الدفع
    const returnsBreakdown: Record<string, number> = {};
    returnInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod.code;
        returnsBreakdown[method] = (returnsBreakdown[method] || 0) + payment.amount;
      });
    });

    // حساب إجمالي المبيعات
    const totalSales = completedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDiscounts = completedInvoices.reduce((sum, i) => sum + i.discountAmount, 0);
    const totalTax = completedInvoices.reduce((sum, i) => sum + i.taxAmount, 0);
    const totalExpenses = shift.expenses.reduce((sum, e) => sum + e.amount, 0);

    // عدد العناصر المباعة
    const totalItems = completedInvoices.reduce((sum, i) => sum + i.items.length, 0);
    const totalQuantity = completedInvoices.reduce((sum, i) => 
      sum + i.items.reduce((s, item) => s + item.quantity, 0), 0
    );

    // أعلى فاتورة
    const highestInvoice = Math.max(...completedInvoices.map(i => i.totalAmount), 0);
    
    // متوسط الفاتورة
    const avgInvoice = completedInvoices.length > 0 ? totalSales / completedInvoices.length : 0;

    // مدة الوردية
    const duration = shift.endTime 
      ? Math.floor((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 1000 / 60)
      : Math.floor((Date.now() - new Date(shift.startTime).getTime()) / 1000 / 60);

    // حساب النقد المتوقع
    const cashSales = paymentBreakdown['cash']?.amount || 0;
    const cashReturns = returnsBreakdown['cash'] || 0;
    const expectedCash = shift.openingCash + cashSales - cashReturns - totalExpenses;

    return NextResponse.json({
      shift: {
        id: shift.id,
        status: shift.status,
        startTime: shift.startTime,
        endTime: shift.endTime,
        openingCash: shift.openingCash,
        closingCash: shift.closingCash,
        expectedCash: shift.expectedCash,
        notes: shift.notes,
        duration,
        branch: shift.branch,
        user: shift.user,
        closedByUser: shift.closedByUser,
      },
      stats: {
        totalInvoices: shift.invoices.length,
        completedInvoices: completedInvoices.length,
        returnInvoices: returnInvoices.length,
        cancelledInvoices: cancelledInvoices.length,
        totalSales,
        totalReturns,
        totalDiscounts,
        totalTax,
        totalExpenses,
        totalItems,
        totalQuantity,
        highestInvoice,
        avgInvoice,
      },
      payments: {
        breakdown: paymentBreakdown,
        returns: returnsBreakdown,
      },
      expenses: shift.expenses,
      expectedCash,
      cashVariance: shift.closingCash ? shift.closingCash - expectedCash : null,
    });
  } catch (error) {
    console.error('Shift fetch error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
