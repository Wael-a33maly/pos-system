import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/shifts/[id]/z-report - Get Z Report for a shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params;

    // Get shift with all related data
    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: {
        branch: true,
        user: { select: { id: true, name: true, email: true } },
        closedByUser: { select: { id: true, name: true } },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'الوردية غير موجودة' }, { status: 404 });
    }

    // Get all invoices for this shift
    const invoices = await db.invoice.findMany({
      where: { shiftId },
      include: {
        items: true,
        customer: { select: { name: true } },
        payments: {
          include: { paymentMethod: true },
        },
      },
    });

    // Get expenses for this shift (by branch and within shift time)
    const expenses = await db.expense.findMany({
      where: {
        branchId: shift.branchId,
        createdAt: {
          gte: shift.startTime,
          lte: shift.endTime || new Date(),
        },
      },
      include: { category: true },
    });

    // Calculate duration
    const endTime = shift.endTime || new Date();
    const duration = Math.round((endTime.getTime() - shift.startTime.getTime()) / (1000 * 60));

    // Calculate stats
    const completedInvoices = invoices.filter(i => i.status === 'COMPLETED' && !i.isReturn);
    const returnInvoices = invoices.filter(i => i.isReturn);
    const cancelledInvoices = invoices.filter(i => i.status === 'CANCELLED');

    const totalSales = completedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDiscounts = invoices.reduce((sum, i) => sum + i.discountAmount, 0);
    const totalTax = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalItems = completedInvoices.reduce((sum, i) => sum + i.items.length, 0);
    const totalQuantity = completedInvoices.reduce((sum, i) => 
      sum + i.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    const invoiceAmounts = completedInvoices.map(i => i.totalAmount);
    const highestInvoice = invoiceAmounts.length > 0 ? Math.max(...invoiceAmounts) : 0;
    const avgInvoice = completedInvoices.length > 0 ? totalSales / completedInvoices.length : 0;

    // Calculate payments breakdown
    const paymentBreakdown: Record<string, {
      name: string;
      nameAr: string;
      amount: number;
      count: number;
      returns: number;
    }> = {};

    // Get all payment methods to ensure we have names
    const paymentMethods = await db.paymentMethod.findMany();
    const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));

    // Process completed invoice payments
    completedInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = paymentMethodMap.get(payment.paymentMethodId);
        const code = method?.code || payment.paymentMethodId;
        
        if (!paymentBreakdown[code]) {
          paymentBreakdown[code] = {
            name: method?.name || 'Unknown',
            nameAr: method?.nameAr || method?.name || 'غير معروف',
            amount: 0,
            count: 0,
            returns: 0,
          };
        }
        paymentBreakdown[code].amount += payment.amount;
        paymentBreakdown[code].count += 1;
      });
    });

    // Process return invoice payments
    returnInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = paymentMethodMap.get(payment.paymentMethodId);
        const code = method?.code || payment.paymentMethodId;
        
        if (!paymentBreakdown[code]) {
          paymentBreakdown[code] = {
            name: method?.name || 'Unknown',
            nameAr: method?.nameAr || method?.name || 'غير معروف',
            amount: 0,
            count: 0,
            returns: 0,
          };
        }
        paymentBreakdown[code].returns += payment.amount;
      });
    });

    // Calculate cash details
    const cashMethod = paymentMethods.find(pm => pm.code === 'CASH');
    const cashBreakdown = cashMethod ? paymentBreakdown['CASH'] : { amount: 0, returns: 0 };
    
    const expectedCash = shift.openingCash + cashBreakdown.amount - cashBreakdown.returns - totalExpenses;
    const actualCash = shift.closingCash || expectedCash;
    const variance = actualCash - expectedCash;

    // Calculate expenses by category
    const expensesByCategory: { name: string; amount: number; count: number }[] = [];
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenses.forEach(expense => {
      const catName = expense.category?.nameAr || expense.category?.name || 'أخرى';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { amount: 0, count: 0 });
      }
      const cat = categoryMap.get(catName)!;
      cat.amount += expense.amount;
      cat.count += 1;
    });

    categoryMap.forEach((value, key) => {
      expensesByCategory.push({ name: key, ...value });
    });

    // Get products sold
    const productMap = new Map<string, {
      id: string;
      name: string;
      barcode: string;
      quantity: number;
      totalAmount: number;
      count: number;
    }>();

    completedInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!item.productId) return;
        
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, {
            id: item.productId,
            name: item.productName,
            barcode: '', // We don't have this in invoice items
            quantity: 0,
            totalAmount: 0,
            count: 0,
          });
        }
        const product = productMap.get(item.productId)!;
        product.quantity += item.quantity;
        product.totalAmount += item.totalAmount;
        product.count += 1;
      });
    });

    const productsItems = Array.from(productMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Prepare invoices lists
    const completedInvoicesList = completedInvoices.map(invoice => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      total: invoice.totalAmount,
      discount: invoice.discountAmount,
      paymentMethod: invoice.payments[0]?.paymentMethod?.nameAr || 'نقدي',
      customer: invoice.customer?.name,
      time: invoice.createdAt,
    }));

    const returnInvoicesList = returnInvoices.map(invoice => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      total: invoice.totalAmount,
      originalInvoice: invoice.originalInvoiceId,
      time: invoice.createdAt,
    }));

    // Calculate Z number
    const closedShiftsCount = await db.shift.count({
      where: { status: 'CLOSED' },
    });

    const zNumber = closedShiftsCount + (shift.status === 'OPEN' ? 0 : 1);
    const zNumberFormatted = `Z-${String(zNumber).padStart(6, '0')}`;

    // Build report
    const report = {
      zNumber,
      zNumberFormatted,
      isOpen: shift.status === 'OPEN',
      reportDate: shift.endTime || new Date(),
      generatedAt: new Date(),
      shift: {
        id: shift.id,
        status: shift.status,
        startTime: shift.startTime,
        endTime: shift.endTime || new Date(),
        duration,
        branch: { id: shift.branch.id, name: shift.branch.name, nameAr: shift.branch.nameAr },
        user: { id: shift.user.id, name: shift.user.name, email: shift.user.email },
        closedByUser: shift.closedByUser,
      },
      stats: {
        totalInvoices: invoices.length,
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
        total: Object.values(paymentBreakdown).reduce((sum, p) => sum + p.amount - p.returns, 0),
      },
      cash: {
        opening: shift.openingCash,
        sales: cashBreakdown.amount,
        returns: cashBreakdown.returns,
        expenses: totalExpenses,
        expected: expectedCash,
        actual: actualCash,
        variance,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        list: expenses,
      },
      products: {
        total: productsItems.length,
        quantity: totalQuantity,
        items: productsItems,
      },
      invoices: {
        completed: completedInvoicesList,
        returns: returnInvoicesList,
      },
      notes: shift.notes,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating Z report:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء التقرير' }, { status: 500 });
  }
}
