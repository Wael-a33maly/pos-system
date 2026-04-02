import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();
    
    // Check cache first (cache for 30 seconds for dashboard)
    const cacheKey = CacheKeys.dashboardKPIs(branchId || undefined, date.toISOString().split('T')[0]);
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate date ranges
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(date);
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const branchFilter = branchId ? { branchId } : {};

    // Execute all queries in parallel for better performance
    const [
      todayInvoices,
      yesterdayInvoices,
      activeShifts,
      lowStockCount,
      payments,
      recentInvoices,
      lowStockInventory,
    ] = await Promise.all([
      // Today's invoices
      db.invoice.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: 'COMPLETED',
          isReturn: false,
          ...branchFilter,
        },
        include: { items: true, branch: true, user: true },
      }),
      
      // Yesterday's invoices
      db.invoice.findMany({
        where: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: 'COMPLETED',
          isReturn: false,
          ...branchFilter,
        },
      }),
      
      // Active shifts
      db.shift.count({
        where: { status: 'OPEN', ...branchFilter },
      }),
      
      // Low stock products count
      db.inventory.count({
        where: { quantity: { lte: 5 } },
      }),
      
      // Today's payments
      db.payment.findMany({
        where: {
          invoice: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
            ...branchFilter,
          },
        },
        include: { paymentMethod: true },
      }),
      
      // Recent invoices
      db.invoice.findMany({
        where: { status: 'COMPLETED', ...branchFilter },
        include: {
          branch: { select: { name: true } },
          user: { select: { name: true } },
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Low stock inventory
      db.inventory.findMany({
        where: { quantity: { lte: 5 } },
        include: {
          product: {
            include: { category: { select: { name: true } } },
          },
        },
        take: 10,
      }),
    ]);

    // Calculate totals from today's invoices
    const todaySales = todayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const yesterdaySales = yesterdayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

    // Calculate profit
    const todayProfit = todayInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((itemSum, item) => {
        return itemSum + ((item.unitPrice - item.costPrice) * item.quantity);
      }, 0);
    }, 0);

    // Top branch
    const branchSalesMap = new Map<string, { name: string; sales: number }>();
    todayInvoices.forEach(inv => {
      if (!branchSalesMap.has(inv.branchId)) {
        branchSalesMap.set(inv.branchId, { name: inv.branch?.name || '', sales: 0 });
      }
      branchSalesMap.get(inv.branchId)!.sales += inv.totalAmount;
    });
    const topBranch = branchSalesMap.size > 0 
      ? Array.from(branchSalesMap.entries()).sort((a, b) => b[1].sales - a[1].sales)[0]
      : null;

    // Top product
    const productSalesMap = new Map<string, { name: string; quantity: number }>();
    todayInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productSalesMap.has(item.productId || '')) {
          productSalesMap.set(item.productId || '', { name: item.productName, quantity: 0 });
        }
        productSalesMap.get(item.productId || '')!.quantity += item.quantity;
      });
    });
    const topProduct = productSalesMap.size > 0
      ? Array.from(productSalesMap.entries()).sort((a, b) => b[1].quantity - a[1].quantity)[0]
      : null;

    // Top cashier
    const cashierSalesMap = new Map<string, { name: string; sales: number }>();
    todayInvoices.forEach(inv => {
      if (!cashierSalesMap.has(inv.userId)) {
        cashierSalesMap.set(inv.userId, { name: inv.user?.name || '', sales: 0 });
      }
      cashierSalesMap.get(inv.userId)!.sales += inv.totalAmount;
    });
    const topCashier = cashierSalesMap.size > 0
      ? Array.from(cashierSalesMap.entries()).sort((a, b) => b[1].sales - a[1].sales)[0]
      : null;

    // Hourly sales
    const hourlySales = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(todayStart);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour, 59, 59, 999);

      const hourInvoices = todayInvoices.filter(inv => 
        inv.createdAt >= hourStart && inv.createdAt <= hourEnd
      );

      hourlySales.push({
        hour,
        sales: hourInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
        invoices: hourInvoices.length,
      });
    }

    // Payment distribution
    const paymentMap = new Map<string, { method: string; methodAr: string; amount: number; count: number }>();
    let totalPayments = 0;
    payments.forEach(payment => {
      const key = payment.paymentMethodId;
      if (!paymentMap.has(key)) {
        paymentMap.set(key, {
          method: payment.paymentMethod?.name || 'Unknown',
          methodAr: payment.paymentMethod?.nameAr || payment.paymentMethod?.name || 'غير معروف',
          amount: 0,
          count: 0,
        });
      }
      paymentMap.get(key)!.amount += payment.amount;
      paymentMap.get(key)!.count += 1;
      totalPayments += payment.amount;
    });

    const paymentDistribution = Array.from(paymentMap.values()).map(p => ({
      ...p,
      percentage: totalPayments > 0 ? (p.amount / totalPayments) * 100 : 0,
    }));

    // Daily sales (from today's invoices - simplified)
    const dailySalesMap = new Map<string, { sales: number; profit: number; invoices: number }>();
    for (let i = 0; i < 7; i++) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      dailySalesMap.set(dateStr, { sales: 0, profit: 0, invoices: 0 });
    }

    // Get week invoices in a single query
    const weekInvoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: weekAgo, lte: todayEnd },
        status: 'COMPLETED',
        isReturn: false,
        ...branchFilter,
      },
      include: { items: true },
    });

    weekInvoices.forEach(inv => {
      const dateStr = inv.createdAt.toISOString().split('T')[0];
      if (dailySalesMap.has(dateStr)) {
        const data = dailySalesMap.get(dateStr)!;
        data.sales += inv.totalAmount;
        data.invoices += 1;
        data.profit += inv.items.reduce((sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0);
      }
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products of the week
    const productStats = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
    weekInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!item.productId) return;
        if (!productStats.has(item.productId)) {
          productStats.set(item.productId, {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          });
        }
        const stats = productStats.get(item.productId)!;
        stats.quantity += item.quantity;
        stats.revenue += item.totalAmount;
        stats.profit += (item.unitPrice - item.costPrice) * item.quantity;
      });
    });

    const topProducts = Array.from(productStats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Branch performance (simplified - use already fetched data)
    const branchPerformance = Array.from(branchSalesMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        sales: data.sales,
        profit: 0, // Would need separate calculation
        invoices: todayInvoices.filter(i => i.branchId === id).length,
        growth: 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    // Low stock alert
    const lowStockAlert = lowStockInventory.map(inv => ({
      id: inv.product.id,
      name: inv.product.name,
      nameAr: inv.product.nameAr,
      category: inv.product.category,
      inventory: [{ quantity: inv.quantity }],
      minStock: inv.product.minStock,
    }));

    const result = {
      kpis: {
        todaySales,
        yesterdaySales,
        salesChange,
        todayInvoices: todayInvoices.length,
        averageOrderValue: todayInvoices.length > 0 ? todaySales / todayInvoices.length : 0,
        totalProfit: todayProfit,
        profitMargin: todaySales > 0 ? (todayProfit / todaySales) * 100 : 0,
        topBranch: topBranch ? { id: topBranch[0], ...topBranch[1] } : null,
        topProduct: topProduct ? { id: topProduct[0], ...topProduct[1] } : null,
        topCashier: topCashier ? { id: topCashier[0], ...topCashier[1] } : null,
        activeShifts,
        lowStockProducts: lowStockCount,
      },
      hourlySales,
      paymentDistribution,
      dailySales,
      topProducts,
      branchPerformance,
      recentInvoices,
      lowStockAlert,
    };

    // Cache for 30 seconds
    cache.set(cacheKey, result, 30 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل البيانات' }, { status: 500 });
  }
}
