import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'today'; // today, week, month, year

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    let startDate: Date;
    let previousStartDate: Date;
    
    switch (period) {
      case 'today':
        startDate = today;
        previousStartDate = yesterday;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        previousStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = today;
        previousStartDate = yesterday;
    }

    // Build where clause
    const invoiceWhere: any = {
      createdAt: { gte: startDate },
      status: 'COMPLETED',
    };
    if (branchId) invoiceWhere.branchId = branchId;
    if (userId) invoiceWhere.userId = userId;

    const previousInvoiceWhere: any = {
      createdAt: { gte: previousStartDate, lt: startDate },
      status: 'COMPLETED',
    };
    if (branchId) previousInvoiceWhere.branchId = branchId;
    if (userId) previousInvoiceWhere.userId = userId;

    // Fetch invoices
    const [invoices, previousInvoices] = await Promise.all([
      db.invoice.findMany({
        where: invoiceWhere,
        include: {
          items: true,
          payments: { include: { paymentMethod: true } },
          user: true,
          branch: true,
        },
      }),
      db.invoice.findMany({
        where: previousInvoiceWhere,
        select: { totalAmount: true, isReturn: true },
      }),
    ]);

    // Calculate current period metrics
    const salesInvoices = invoices.filter(i => !i.isReturn);
    const returnInvoices = invoices.filter(i => i.isReturn);
    
    const totalSales = salesInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const netSales = totalSales - totalReturns;
    
    // Calculate profit
    const totalProfit = salesInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((itemSum, item) => {
        return itemSum + ((item.unitPrice - item.costPrice) * item.quantity);
      }, 0);
    }, 0);

    // Calculate previous period metrics for comparison
    const previousTotalSales = previousInvoices.filter(i => !i.isReturn).reduce((sum, i) => sum + i.totalAmount, 0);
    
    // Calculate growth percentages
    const salesGrowth = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 
      : 0;

    // Payment method breakdown
    const paymentBreakdown: Record<string, { amount: number; count: number }> = {};
    invoices.forEach(invoice => {
      invoice.payments?.forEach(payment => {
        const method = payment.paymentMethod?.name || 'أخرى';
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { amount: 0, count: 0 };
        }
        paymentBreakdown[method].amount += payment.amount;
        paymentBreakdown[method].count += 1;
      });
    });

    // Hourly sales distribution
    const hourlyData: Record<number, { sales: number; invoices: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { sales: 0, invoices: 0 };
    }
    salesInvoices.forEach(invoice => {
      const hour = new Date(invoice.createdAt).getHours();
      hourlyData[hour].sales += invoice.totalAmount;
      hourlyData[hour].invoices += 1;
    });

    // Daily sales for the period
    const dailySales: Record<string, { sales: number; returns: number; invoices: number }> = {};
    salesInvoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { sales: 0, returns: 0, invoices: 0 };
      }
      dailySales[date].sales += invoice.totalAmount;
      dailySales[date].invoices += 1;
    });
    returnInvoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { sales: 0, returns: 0, invoices: 0 };
      }
      dailySales[date].returns += invoice.totalAmount;
    });

    // Top products
    const productSales: Record<string, { name: string; quantity: number; amount: number; profit: number }> = {};
    salesInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const key = item.productId || item.productName;
        if (!productSales[key]) {
          productSales[key] = { 
            name: item.productName, 
            quantity: 0, 
            amount: 0,
            profit: 0,
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].amount += item.totalAmount;
        productSales[key].profit += (item.unitPrice - item.costPrice) * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Branch comparison
    const branchData: Record<string, { name: string; sales: number; invoices: number; profit: number }> = {};
    salesInvoices.forEach(invoice => {
      const branchName = invoice.branch?.name || 'غير محدد';
      if (!branchData[invoice.branchId]) {
        branchData[invoice.branchId] = { name: branchName, sales: 0, invoices: 0, profit: 0 };
      }
      branchData[invoice.branchId].sales += invoice.totalAmount;
      branchData[invoice.branchId].invoices += 1;
      branchData[invoice.branchId].profit += invoice.items.reduce(
        (sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0
      );
    });

    // Cashier performance
    const cashierData: Record<string, { name: string; sales: number; invoices: number; profit: number }> = {};
    salesInvoices.forEach(invoice => {
      const userName = invoice.user?.name || 'غير محدد';
      if (!cashierData[invoice.userId]) {
        cashierData[invoice.userId] = { name: userName, sales: 0, invoices: 0, profit: 0 };
      }
      cashierData[invoice.userId].sales += invoice.totalAmount;
      cashierData[invoice.userId].invoices += 1;
      cashierData[invoice.userId].profit += invoice.items.reduce(
        (sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0
      );
    });

    // Category distribution
    const categorySales: Record<string, { name: string; amount: number; quantity: number }> = {};
    // Get product categories
    const productIds = [...new Set(salesInvoices.flatMap(i => i.items.map(item => item.productId)).filter(Boolean))];
    if (productIds.length > 0) {
      const productsWithCategories = await db.product.findMany({
        where: { id: { in: productIds } },
        include: { category: true },
      });
      const productCategoryMap = new Map(productsWithCategories.map(p => [p.id, p.category?.name || 'غير مصنف']));
      
      salesInvoices.forEach(invoice => {
        invoice.items.forEach(item => {
          if (item.productId) {
            const categoryName = productCategoryMap.get(item.productId) || 'غير مصنف';
            if (!categorySales[categoryName]) {
              categorySales[categoryName] = { name: categoryName, amount: 0, quantity: 0 };
            }
            categorySales[categoryName].amount += item.totalAmount;
            categorySales[categoryName].quantity += item.quantity;
          }
        });
      });
    }

    // Get additional stats
    const [productsCount, customersCount, openShifts] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.customer.count({ where: { isActive: true } }),
      db.shift.count({ where: { status: 'OPEN' } }),
    ]);

    // Low stock products
    const lowStockProducts = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, minStock: true, inventory: true },
    });
    const lowStock = lowStockProducts
      .filter(p => {
        const totalStock = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        return totalStock <= p.minStock;
      })
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        stock: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        minStock: p.minStock,
      }));

    // Recent invoices
    const recentInvoices = await db.invoice.findMany({
      where: { ...invoiceWhere, isReturn: false },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      period,
      summary: {
        totalSales,
        totalReturns,
        netSales,
        totalProfit,
        invoiceCount: salesInvoices.length,
        returnCount: returnInvoices.length,
        averageOrder: salesInvoices.length > 0 ? totalSales / salesInvoices.length : 0,
        salesGrowth,
      },
      stats: {
        productsCount,
        customersCount,
        openShifts,
      },
      paymentBreakdown: Object.entries(paymentBreakdown).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
      })),
      hourlyDistribution: Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data,
      })),
      dailySales: Object.entries(dailySales)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topProducts,
      branchComparison: Object.entries(branchData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.sales - a.sales),
      cashierPerformance: Object.entries(cashierData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.sales - a.sales),
      categoryDistribution: Object.entries(categorySales)
        .map(([name, data]) => ({ ...data }))
        .sort((a, b) => b.amount - a.amount),
      lowStockProducts: lowStock,
      recentInvoices: recentInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer?.name || 'عميل نقدي',
        total: inv.totalAmount,
        status: inv.status,
        time: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل البيانات' }, { status: 500 });
  }
}
