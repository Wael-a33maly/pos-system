import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const branchId = searchParams.get('branchId');

    const where: any = {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      status: 'COMPLETED',
    };
    if (branchId) where.branchId = branchId;

    const invoices = await db.invoice.findMany({
      where,
      include: { items: true, payments: { include: { paymentMethod: true } } },
    });

    const totalSales = invoices.filter(i => !i.isReturn).reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = invoices.filter(i => i.isReturn).reduce((sum, i) => sum + i.totalAmount, 0);
    const totalInvoices = invoices.length;
    const averageOrder = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {};
    invoices.forEach(invoice => {
      invoice.payments?.forEach(payment => {
        const method = payment.paymentMethod?.name || 'Other';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + payment.amount;
      });
    });

    // Daily sales
    const dailySales: Record<string, { sales: number; invoices: number }> = {};
    invoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) dailySales[date] = { sales: 0, invoices: 0 };
      if (!invoice.isReturn) {
        dailySales[date].sales += invoice.totalAmount;
        dailySales[date].invoices += 1;
      }
    });

    return NextResponse.json({
      summary: { totalSales, totalReturns, netSales: totalSales - totalReturns, totalInvoices, averageOrder },
      paymentBreakdown,
      dailySales: Object.entries(dailySales).map(([date, data]) => ({ date, ...data })),
    });
  } catch (error) {
    console.error('Sales report error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
