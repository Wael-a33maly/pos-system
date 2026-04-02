import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Dashboard Stats API - Updated to fix inventory query

// Types
interface KPIStats {
  todaySales: number;
  yesterdaySales: number;
  salesChange: number;
  todayInvoices: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  topBranch: { id: string; name: string; sales: number } | null;
  topProduct: { id: string; name: string; quantity: number } | null;
  topCashier: { id: string; name: string; sales: number } | null;
  activeShifts: number;
  lowStockProducts: number;
}

interface HourlySales {
  hour: number;
  sales: number;
  invoices: number;
}

interface PaymentDistribution {
  method: string;
  methodAr: string;
  amount: number;
  count: number;
  percentage: number;
}

interface DailySales {
  date: string;
  sales: number;
  profit: number;
  invoices: number;
}

interface TopProduct {
  id: string;
  name: string;
  nameAr: string | null;
  quantity: number;
  revenue: number;
  profit: number;
}

interface BranchPerformance {
  id: string;
  name: string;
  sales: number;
  profit: number;
  invoices: number;
  growth: number;
}

interface DashboardResponse {
  kpis: KPIStats;
  hourlySales: HourlySales[];
  paymentDistribution: PaymentDistribution[];
  dailySales: DailySales[];
  topProducts: TopProduct[];
  branchPerformance: BranchPerformance[];
  recentInvoices: any[];
  lowStockAlert: any[];
}

export async function GET(request: NextRequest): Promise<NextResponse<DashboardResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();
    
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

    // Build where clauses
    const branchFilter = branchId ? { branchId } : {};
    
    // ===== KPIs =====
    // Today's invoices
    const todayInvoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: 'COMPLETED',
        isReturn: false,
        ...branchFilter,
      },
      include: {
        items: true,
        branch: true,
        user: true,
      },
    });

    // Yesterday's invoices
    const yesterdayInvoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        status: 'COMPLETED',
        isReturn: false,
        ...branchFilter,
      },
    });

    // Calculate totals
    const todaySales = todayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const yesterdaySales = yesterdayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

    // Calculate profit
    const todayProfit = todayInvoices.reduce((sum, invoice) => {
      return sum + invoice.items.reduce((itemSum, item) => {
        return itemSum + ((item.unitPrice - item.costPrice) * item.quantity);
      }, 0);
    }, 0);

    // Top branch
    const branchSales = new Map<string, { name: string; sales: number }>();
    todayInvoices.forEach(inv => {
      if (!branchSales.has(inv.branchId)) {
        branchSales.set(inv.branchId, { name: inv.branch?.name || '', sales: 0 });
      }
      branchSales.get(inv.branchId)!.sales += inv.totalAmount;
    });
    const topBranch = branchSales.size > 0 
      ? Array.from(branchSales.entries()).sort((a, b) => b[1].sales - a[1].sales)[0]
      : null;

    // Top product
    const productSales = new Map<string, { name: string; quantity: number }>();
    todayInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productSales.has(item.productId || '')) {
          productSales.set(item.productId || '', { name: item.productName, quantity: 0 });
        }
        productSales.get(item.productId || '')!.quantity += item.quantity;
      });
    });
    const topProduct = productSales.size > 0
      ? Array.from(productSales.entries()).sort((a, b) => b[1].quantity - a[1].quantity)[0]
      : null;

    // Top cashier
    const cashierSales = new Map<string, { name: string; sales: number }>();
    todayInvoices.forEach(inv => {
      if (!cashierSales.has(inv.userId)) {
        cashierSales.set(inv.userId, { name: inv.user?.name || '', sales: 0 });
      }
      cashierSales.get(inv.userId)!.sales += inv.totalAmount;
    });
    const topCashier = cashierSales.size > 0
      ? Array.from(cashierSales.entries()).sort((a, b) => b[1].sales - a[1].sales)[0]
      : null;

    // Active shifts
    const activeShifts = await db.shift.count({
      where: { status: 'OPEN', ...branchFilter },
    });

    // Low stock products
    const lowStockProducts = await db.inventory.count({
      where: {
        quantity: { lte: 0 },
      },
    });

    const kpis: KPIStats = {
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
      lowStockProducts,
    };

    // ===== Hourly Sales =====
    const hourlyData: HourlySales[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(todayStart);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour, 59, 59, 999);

      const hourInvoices = todayInvoices.filter(inv => 
        inv.createdAt >= hourStart && inv.createdAt <= hourEnd
      );

      hourlyData.push({
        hour,
        sales: hourInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
        invoices: hourInvoices.length,
      });
    }

    // ===== Payment Distribution =====
    const payments = await db.payment.findMany({
      where: {
        invoice: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: 'COMPLETED',
          ...branchFilter,
        },
      },
      include: { paymentMethod: true },
    });

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

    const paymentDistribution: PaymentDistribution[] = Array.from(paymentMap.values()).map(p => ({
      ...p,
      percentage: totalPayments > 0 ? (p.amount / totalPayments) * 100 : 0,
    }));

    // ===== Daily Sales (Last 7 days) =====
    const weekInvoices = await db.invoice.findMany({
      where: {
        createdAt: { gte: weekAgo, lte: todayEnd },
        status: 'COMPLETED',
        isReturn: false,
        ...branchFilter,
      },
      include: { items: true },
    });

    const dailySalesMap = new Map<string, { sales: number; profit: number; invoices: number }>();
    for (let i = 0; i < 7; i++) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      dailySalesMap.set(dateStr, { sales: 0, profit: 0, invoices: 0 });
    }

    weekInvoices.forEach(inv => {
      const dateStr = inv.createdAt.toISOString().split('T')[0];
      if (dailySalesMap.has(dateStr)) {
        const data = dailySalesMap.get(dateStr)!;
        data.sales += inv.totalAmount;
        data.invoices += 1;
        data.profit += inv.items.reduce((sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0);
      }
    });

    const dailySales: DailySales[] = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ===== Top Products =====
    const weekItems = await db.invoiceItem.findMany({
      where: {
        invoice: {
          createdAt: { gte: weekAgo, lte: todayEnd },
          status: 'COMPLETED',
          isReturn: false,
          ...branchFilter,
        },
      },
    });

    const productStats = new Map<string, { name: string; nameAr: string | null; quantity: number; revenue: number; profit: number }>();
    weekItems.forEach(item => {
      if (!item.productId) return;
      if (!productStats.has(item.productId)) {
        productStats.set(item.productId, {
          name: item.productName,
          nameAr: null,
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

    const topProducts: TopProduct[] = Array.from(productStats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ===== Branch Performance =====
    const branches = await db.branch.findMany({
      where: { isActive: true },
      include: {
        invoices: {
          where: {
            createdAt: { gte: weekAgo, lte: todayEnd },
            status: 'COMPLETED',
            isReturn: false,
          },
          include: { items: true },
        },
      },
    });

    const branchPerformance: BranchPerformance[] = branches.map(branch => {
      const sales = branch.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const profit = branch.invoices.reduce((sum, inv) => 
        sum + inv.items.reduce((itemSum, item) => itemSum + ((item.unitPrice - item.costPrice) * item.quantity), 0)
      , 0);
      const invoices = branch.invoices.length;
      
      return {
        id: branch.id,
        name: branch.name,
        sales,
        profit,
        invoices,
        growth: 0, // Would need historical data to calculate
      };
    }).sort((a, b) => b.sales - a.sales);

    // ===== Recent Invoices =====
    const recentInvoices = await db.invoice.findMany({
      where: {
        status: 'COMPLETED',
        ...branchFilter,
      },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // ===== Low Stock Alert - Fixed Query =====
    // Get products with their inventory and check if quantity <= minStock
    const lowStockRecords = await db.inventory.findMany({
      where: { quantity: { lte: 0 } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            barcode: true,
            minStock: true,
            category: { select: { name: true } },
          },
        },
        branch: { select: { name: true } },
      },
      take: 10,
    });

    const lowStockAlert = lowStockRecords.map(inv => ({
      id: inv.product.id,
      name: inv.product.name,
      nameAr: inv.product.nameAr,
      barcode: inv.product.barcode,
      quantity: inv.quantity,
      minStock: inv.product.minStock,
      category: inv.product.category,
      branch: inv.branch,
    }));

    const response: DashboardResponse = {
      kpis,
      hourlySales: hourlyData,
      paymentDistribution,
      dailySales,
      topProducts,
      branchPerformance,
      recentInvoices,
      lowStockAlert,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل البيانات' }, { status: 500 });
  }
}
