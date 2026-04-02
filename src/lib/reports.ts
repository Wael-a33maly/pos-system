// ==================== مكتبة التقارير المتقدمة ====================
import { db } from '@/lib/db';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, subDays, subMonths, format, differenceInDays
} from 'date-fns';

// ==================== أنواع البيانات ====================
export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  branchIds?: string[];
  userIds?: string[];
  categoryIds?: string[];
  productIds?: string[];
  paymentMethodIds?: string[];
  shiftIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeReturns?: boolean;
  comparePrevious?: boolean;
}

export interface ReportResult<T> {
  success: boolean;
  data: T;
  meta: {
    generatedAt: Date;
    period: { startDate: Date; endDate: Date };
    executionTime: number;
    cacheHit?: boolean;
  };
  error?: string;
}

export interface KPIResult {
  todaySales: number;
  yesterdaySales: number;
  salesGrowth: number;
  invoiceCount: number;
  todayInvoiceCount: number;
  avgInvoiceValue: number;
  topBranch: { id: string; name: string; sales: number } | null;
  topProduct: { id: string; name: string; sales: number; quantity: number } | null;
  topCashier: { id: string; name: string; sales: number } | null;
  lowStockCount: number;
  pendingShifts: number;
}

// ==================== Helper Functions ====================
export function getDateRange(
  period: string, 
  customStart?: string, 
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    case 'week':
      return { startDate: startOfWeek(now, { weekStartsOn: 6 }), endDate: endOfWeek(now, { weekStartsOn: 6 }) };
    case 'month':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), quarterStart.getMonth() + 3, 0);
      return { startDate: startOfDay(quarterStart), endDate: endOfDay(quarterEnd) };
    case 'year':
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    case 'custom':
      return { 
        startDate: customStart ? startOfDay(new Date(customStart)) : startOfDay(now), 
        endDate: customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now) 
      };
    default:
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
  }
}

export function getPreviousPeriod(
  startDate: Date, 
  endDate: Date
): { startDate: Date; endDate: Date } {
  const periodLength = endDate.getTime() - startDate.getTime();
  const previousEnd = new Date(startDate);
  previousEnd.setTime(previousEnd.getTime() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousStart.getTime() - periodLength);
  
  return { startDate: previousStart, endDate: previousEnd };
}

// ==================== تقرير المبيعات المتقدم ====================
export async function getSalesReportAdvanced(filters: ReportFilters) {
  const startTime = Date.now();
  const { startDate, endDate, branchIds, userIds, paymentMethodIds, includeReturns } = filters;

  // جلب الفواتير
  const whereClause: any = {
    createdAt: { gte: startDate, lte: endDate },
    ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
    ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
    ...(includeReturns === false ? { isReturn: false } : {}),
  };

  const invoices = await db.invoice.findMany({
    where: whereClause,
    include: {
      items: true,
      payments: paymentMethodIds && paymentMethodIds.length > 0 
        ? { where: { paymentMethodId: { in: paymentMethodIds } } }
        : true,
      branch: true,
      user: true,
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // حساب الإجماليات
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
  const totalCost = invoices.reduce((sum, inv) => 
    sum + inv.items.reduce((s, item) => s + (item.costPrice * item.quantity), 0), 0
  );
  const totalItems = invoices.reduce((sum, inv) => 
    sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0
  );
  const totalReturns = invoices
    .filter(inv => inv.isReturn)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // المبيعات حسب طريقة الدفع
  const salesByPaymentMethod: Record<string, { amount: number; count: number; name: string }> = {};
  invoices.forEach(inv => {
    inv.payments.forEach(payment => {
      if (!salesByPaymentMethod[payment.paymentMethodId]) {
        salesByPaymentMethod[payment.paymentMethodId] = { 
          amount: 0, 
          count: 0, 
          name: '' 
        };
      }
      salesByPaymentMethod[payment.paymentMethodId].amount += payment.amount;
      salesByPaymentMethod[payment.paymentMethodId].count += 1;
    });
  });

  // جلب أسماء طرق الدفع
  const paymentMethods = await db.paymentMethod.findMany({
    where: { id: { in: Object.keys(salesByPaymentMethod) } },
    select: { id: true, name: true, nameAr: true }
  });
  paymentMethods.forEach(pm => {
    if (salesByPaymentMethod[pm.id]) {
      salesByPaymentMethod[pm.id].name = pm.nameAr || pm.name;
    }
  });

  // الاتجاه اليومي
  const dailyTrend = await getDailyTrend(startDate, endDate, branchIds);

  // المقارنة مع الفترة السابقة
  const previousPeriod = getPreviousPeriod(startDate, endDate);
  const previousInvoices = await db.invoice.findMany({
    where: {
      createdAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
      status: 'COMPLETED',
      ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
    },
    select: { totalAmount: true },
  });
  const previousTotal = previousInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return {
    success: true,
    data: {
      period: { startDate, endDate },
      summary: {
        totalSales,
        totalSubtotal,
        totalDiscount,
        totalTax,
        totalCost,
        totalReturns,
        grossProfit: totalSubtotal - totalCost,
        netProfit: totalSales - totalCost,
        invoiceCount: invoices.length,
        itemCount: totalItems,
        avgInvoiceValue: invoices.length > 0 ? totalSales / invoices.length : 0,
        profitMargin: totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0,
        returnRate: totalSales > 0 ? (totalReturns / totalSales) * 100 : 0,
      },
      comparison: {
        previousPeriod,
        previousTotal,
        growthAmount: totalSales - previousTotal,
        growthPercentage: previousTotal > 0 
          ? ((totalSales - previousTotal) / previousTotal) * 100 
          : 0,
        trend: totalSales > previousTotal ? 'up' : totalSales < previousTotal ? 'down' : 'stable',
      },
      byPaymentMethod: Object.entries(salesByPaymentMethod).map(([id, data]) => ({
        methodId: id,
        name: data.name,
        amount: data.amount,
        count: data.count,
        percentage: totalSales > 0 ? (data.amount / totalSales) * 100 : 0,
      })),
      dailyTrend,
      recentInvoices: invoices.slice(0, 10).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.totalAmount,
        customer: inv.customer?.name,
        cashier: inv.user.name,
        branch: inv.branch.name,
        createdAt: inv.createdAt,
      })),
    },
    meta: {
      generatedAt: new Date(),
      period: { startDate, endDate },
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== تقرير المخزون ====================
export async function getInventoryReport(filters: ReportFilters & { 
  lowStock?: boolean; 
  outOfStock?: boolean;
  categoryId?: string;
}) {
  const startTime = Date.now();
  const { branchIds, lowStock, outOfStock, categoryId } = filters;

  const whereClause: any = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  };

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      category: true,
      brand: true,
      inventory: {
        where: branchIds && branchIds.length > 0 
          ? { branchId: { in: branchIds } }
          : undefined,
      },
    },
  });

  // حساب المخزون لكل منتج
  const inventoryData = products.map(product => {
    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalValue = totalQuantity * product.costPrice;
    const retailValue = totalQuantity * product.sellingPrice;
    const potentialProfit = retailValue - totalValue;
    
    return {
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      sku: product.sku,
      category: product.category?.name,
      brand: product.brand?.name,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      minStock: product.minStock,
      maxStock: product.maxStock,
      quantity: totalQuantity,
      value: totalValue,
      retailValue,
      potentialProfit,
      profitMargin: product.sellingPrice > 0 
        ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
        : 0,
      status: totalQuantity <= 0 
        ? 'out_of_stock' 
        : totalQuantity <= product.minStock 
          ? 'low_stock' 
          : 'in_stock',
    };
  });

  // تطبيق الفلاتر
  let filteredData = inventoryData;
  if (lowStock) {
    filteredData = filteredData.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock');
  }
  if (outOfStock) {
    filteredData = filteredData.filter(p => p.status === 'out_of_stock');
  }

  // الإحصائيات
  const stats = {
    totalProducts: products.length,
    totalQuantity: inventoryData.reduce((sum, p) => sum + p.quantity, 0),
    totalValue: inventoryData.reduce((sum, p) => sum + p.value, 0),
    totalRetailValue: inventoryData.reduce((sum, p) => sum + p.retailValue, 0),
    inStockCount: inventoryData.filter(p => p.status === 'in_stock').length,
    lowStockCount: inventoryData.filter(p => p.status === 'low_stock').length,
    outOfStockCount: inventoryData.filter(p => p.status === 'out_of_stock').length,
  };

  return {
    success: true,
    data: {
      products: filteredData.sort((a, b) => a.quantity - b.quantity),
      stats,
    },
    meta: {
      generatedAt: new Date(),
      period: filters,
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== تقرير العملاء ====================
export async function getCustomersReport(filters: ReportFilters) {
  const startTime = Date.now();
  const { startDate, endDate, branchIds } = filters;

  const customers = await db.customer.findMany({
    where: {
      isActive: true,
      ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
    },
    include: {
      invoices: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  const customerData = customers.map(customer => {
    const totalPurchases = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const invoiceCount = customer.invoices.length;
    const avgPurchase = invoiceCount > 0 ? totalPurchases / invoiceCount : 0;
    const lastPurchase = customer.invoices.length > 0 
      ? customer.invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : null;

    return {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      taxNumber: customer.taxNumber,
      totalPurchases,
      invoiceCount,
      avgPurchase,
      lastPurchase,
      daysSinceLastPurchase: lastPurchase 
        ? differenceInDays(new Date(), lastPurchase)
        : null,
    };
  }).sort((a, b) => b.totalPurchases - a.totalPurchases);

  // الإحصائيات
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customerData.filter(c => c.invoiceCount > 0).length,
    newCustomers: customerData.filter(c => c.daysSinceLastPurchase && c.daysSinceLastPurchase <= 30).length,
    totalRevenue: customerData.reduce((sum, c) => sum + c.totalPurchases, 0),
    avgRevenuePerCustomer: customerData.length > 0 
      ? customerData.reduce((sum, c) => sum + c.totalPurchases, 0) / customerData.length 
      : 0,
  };

  return {
    success: true,
    data: {
      customers: customerData,
      topCustomers: customerData.slice(0, 10),
      stats,
    },
    meta: {
      generatedAt: new Date(),
      period: { startDate, endDate },
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== Z-Report ====================
export async function getZReport(shiftId: string) {
  const startTime = Date.now();

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      user: true,
      branch: true,
      invoices: {
        where: { status: 'COMPLETED' },
        include: {
          items: true,
          payments: { include: { paymentMethod: true } },
        },
      },
      expenses: true,
    },
  });

  if (!shift) {
    return {
      success: false,
      error: 'الوردية غير موجودة',
      data: null,
      meta: {
        generatedAt: new Date(),
        period: { startDate: new Date(), endDate: new Date() },
        executionTime: Date.now() - startTime,
      },
    };
  }

  // حساب الإحصائيات
  const totalSales = shift.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalSubtotal = shift.invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalTax = shift.invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
  const totalDiscount = shift.invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalCost = shift.invoices.reduce((sum, inv) => 
    sum + inv.items.reduce((s, item) => s + (item.costPrice * item.quantity), 0), 0
  );
  const totalReturns = shift.invoices
    .filter(inv => inv.isReturn)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalExpenses = shift.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const itemCount = shift.invoices.reduce((sum, inv) => 
    sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0
  );

  // المبيعات حسب طريقة الدفع
  const paymentSummary: Record<string, { 
    methodId: string;
    name: string; 
    amount: number; 
    count: number;
  }> = {};

  shift.invoices.forEach(inv => {
    inv.payments.forEach(payment => {
      const key = payment.paymentMethodId;
      if (!paymentSummary[key]) {
        paymentSummary[key] = {
          methodId: key,
          name: payment.paymentMethod.nameAr || payment.paymentMethod.name,
          amount: 0,
          count: 0,
        };
      }
      paymentSummary[key].amount += payment.amount;
      paymentSummary[key].count += 1;
    });
  });

  // حساب الفرق في الصندوق
  const expectedCash = shift.openingCash + 
    (paymentSummary['cash']?.amount || 0) - 
    totalExpenses - 
    totalReturns;
  const difference = shift.closingCash !== null 
    ? shift.closingCash - expectedCash 
    : null;

  return {
    success: true,
    data: {
      shiftInfo: {
        id: shift.id,
        zReportNumber: shift.zReportNumber,
        branch: shift.branch,
        cashier: shift.user,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        openingCash: shift.openingCash,
        closingCash: shift.closingCash,
        notes: shift.notes,
      },
      summary: {
        invoiceCount: shift.invoices.length,
        itemCount,
        totalSubtotal,
        totalDiscount,
        totalTax,
        totalSales,
        totalCost,
        totalReturns,
        grossProfit: totalSubtotal - totalCost,
        netProfit: totalSales - totalCost,
        profitMargin: totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0,
      },
      payments: Object.values(paymentSummary),
      expenses: shift.expenses.map(exp => ({
        id: exp.id,
        amount: exp.amount,
        description: exp.description,
      })),
      cashSummary: {
        openingCash: shift.openingCash,
        cashSales: paymentSummary['cash']?.amount || 0,
        cashReturns: 0, // TODO: حساب المرتجعات النقدية
        expenses: totalExpenses,
        expectedCash,
        closingCash: shift.closingCash,
        difference,
      },
    },
    meta: {
      generatedAt: new Date(),
      period: { startDate: shift.startTime, endDate: shift.endTime || new Date() },
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== Dashboard KPIs ====================
export async function getDashboardKPIsAdvanced(branchIds?: string[]) {
  const startTime = Date.now();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterday = subDays(now, 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);
  const monthStart = startOfMonth(now);

  // Parallel queries for performance
  const [
    todayInvoices,
    yesterdayInvoices,
    monthInvoices,
    topBranch,
    topProduct,
    topCashier,
    lowStockCount,
    openShifts,
  ] = await Promise.all([
    // مبيعات اليوم
    db.invoice.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: 'COMPLETED',
        ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
      select: { totalAmount: true },
    }),
    // مبيعات أمس
    db.invoice.findMany({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        status: 'COMPLETED',
        ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
      select: { totalAmount: true },
    }),
    // عدد فواتير الشهر
    db.invoice.count({
      where: {
        createdAt: { gte: monthStart, lte: now },
        status: 'COMPLETED',
        ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
    }),
    // أفضل فرع
    db.branch.findFirst({
      where: {
        isActive: true,
        ...(branchIds && branchIds.length > 0 ? { id: { in: branchIds } } : {}),
        invoices: {
          some: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
          },
        },
      },
      include: {
        invoices: {
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
          },
          select: { totalAmount: true },
        },
      },
    }),
    // أفضل منتج
    db.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: 'COMPLETED',
          ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
        },
      },
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 1,
    }),
    // أفضل كاشير
    db.user.findFirst({
      where: {
        isActive: true,
        invoices: {
          some: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
            ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
          },
        },
      },
      include: {
        invoices: {
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
            ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
          },
          select: { totalAmount: true },
        },
      },
    }),
    // المنتجات منخفضة المخزون
    db.product.count({
      where: {
        isActive: true,
        inventory: {
          some: {
            quantity: { lte: db.product.fields.minStock },
          },
        },
      },
    }),
    // الورديات المفتوحة
    db.shift.count({
      where: {
        status: 'OPEN',
        ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
    }),
  ]);

  // حساب الإحصائيات
  const todaySales = todayInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const yesterdaySales = yesterdayInvoices.reduce((s, i) => s + i.totalAmount, 0);

  // جلب معلومات المنتج الأفضل
  let topProductInfo = null;
  if (topProduct.length > 0 && topProduct[0].productId) {
    topProductInfo = await db.product.findUnique({
      where: { id: topProduct[0].productId },
      select: { id: true, name: true, barcode: true },
    });
  }

  return {
    success: true,
    data: {
      todaySales,
      yesterdaySales,
      salesGrowth: yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
        : 0,
      invoiceCount: monthInvoices,
      todayInvoiceCount: todayInvoices.length,
      avgInvoiceValue: todayInvoices.length > 0 
        ? todaySales / todayInvoices.length 
        : 0,
      topBranch: topBranch ? {
        id: topBranch.id,
        name: topBranch.name,
        sales: topBranch.invoices.reduce((s, i) => s + i.totalAmount, 0),
      } : null,
      topProduct: topProductInfo ? {
        ...topProductInfo,
        sales: topProduct[0]._sum.totalAmount || 0,
        quantity: topProduct[0]._sum.quantity || 0,
      } : null,
      topCashier: topCashier ? {
        id: topCashier.id,
        name: topCashier.name,
        sales: topCashier.invoices.reduce((s, i) => s + i.totalAmount, 0),
      } : null,
      lowStockCount,
      pendingShifts: openShifts,
    },
    meta: {
      generatedAt: new Date(),
      period: { startDate: todayStart, endDate: todayEnd },
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== الاتجاه اليومي ====================
async function getDailyTrend(startDate: Date, endDate: Date, branchIds?: string[]) {
  const invoices = await db.invoice.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
      ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
    },
    select: { createdAt: true, totalAmount: true },
  });

  const dailyMap = new Map<string, { sales: number; count: number }>();

  invoices.forEach(inv => {
    const dateKey = format(inv.createdAt, 'yyyy-MM-dd');
    const existing = dailyMap.get(dateKey) || { sales: 0, count: 0 };
    existing.sales += inv.totalAmount;
    existing.count += 1;
    dailyMap.set(dateKey, existing);
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      invoiceCount: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ==================== تقارير المنتجات المتقدمة ====================
export async function getProductsReportAdvanced(filters: ReportFilters & {
  sortBy?: 'sales' | 'quantity' | 'profit';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}) {
  const startTime = Date.now();
  const { startDate, endDate, branchIds, categoryIds, sortBy = 'sales', sortOrder = 'desc', limit = 50 } = filters;

  const invoiceItems = await db.invoiceItem.findMany({
    where: {
      invoice: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
        ...(branchIds && branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
      ...(categoryIds && categoryIds.length > 0 
        ? { product: { categoryId: { in: categoryIds } } } 
        : {}),
    },
    include: {
      product: { include: { category: true, brand: true } },
      invoice: { select: { createdAt: true, invoiceNumber: true } },
    },
  });

  // تجميع حسب المنتج
  const productMap = new Map<string, {
    productId: string;
    productName: string;
    productBarcode: string;
    productSku?: string;
    category?: string;
    brand?: string;
    quantity: number;
    sales: number;
    cost: number;
    profit: number;
    invoiceCount: number;
    returnCount: number;
  }>();

  invoiceItems.forEach(item => {
    if (!item.productId) return;
    
    const existing = productMap.get(item.productId) || {
      productId: item.productId,
      productName: item.productName,
      productBarcode: item.product?.barcode || '',
      productSku: item.product?.sku,
      category: item.product?.category?.name,
      brand: item.product?.brand?.name,
      quantity: 0,
      sales: 0,
      cost: 0,
      profit: 0,
      invoiceCount: 0,
      returnCount: 0,
    };

    existing.quantity += item.quantity;
    existing.sales += item.totalAmount;
    existing.cost += item.costPrice * item.quantity;
    existing.profit = existing.sales - existing.cost;
    existing.invoiceCount += 1;

    productMap.set(item.productId, existing);
  });

  // الترتيب
  let result = Array.from(productMap.values());
  if (sortBy === 'sales') {
    result.sort((a, b) => sortOrder === 'desc' ? b.sales - a.sales : a.sales - b.sales);
  } else if (sortBy === 'quantity') {
    result.sort((a, b) => sortOrder === 'desc' ? b.quantity - a.quantity : a.quantity - b.quantity);
  } else if (sortBy === 'profit') {
    result.sort((a, b) => sortOrder === 'desc' ? b.profit - a.profit : a.profit - b.profit);
  }

  // إضافة نسبة هامش الربح
  result = result.map(p => ({
    ...p,
    profitMargin: p.sales > 0 ? (p.profit / p.sales) * 100 : 0,
  }));

  return {
    success: true,
    data: {
      products: result.slice(0, limit),
      totalProducts: productMap.size,
      topSelling: result.slice(0, 10),
      slowestSelling: result.slice(-10).reverse(),
      summary: {
        totalQuantity: result.reduce((s, p) => s + p.quantity, 0),
        totalSales: result.reduce((s, p) => s + p.sales, 0),
        totalProfit: result.reduce((s, p) => s + p.profit, 0),
        avgProfitMargin: result.length > 0 
          ? result.reduce((s, p) => s + p.profitMargin, 0) / result.length 
          : 0,
      },
    },
    meta: {
      generatedAt: new Date(),
      period: { startDate, endDate },
      executionTime: Date.now() - startTime,
    },
  };
}

// ==================== Cache Management ====================
const reportCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCachedReport<T>(key: string): T | null {
  const cached = reportCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  reportCache.delete(key);
  return null;
}

export function setCachedReport<T>(key: string, data: T, ttlMs: number = 60000): void {
  reportCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function clearReportCache(pattern?: string): void {
  if (pattern) {
    Array.from(reportCache.keys())
      .filter(key => key.includes(pattern))
      .forEach(key => reportCache.delete(key));
  } else {
    reportCache.clear();
  }
}
