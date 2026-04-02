import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Main reports API with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'sales'; // sales, products, shifts, profits, returns, expenses, payment-methods, branches, cashiers
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branchIds = searchParams.get('branchIds')?.split(',').filter(Boolean);
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean);
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    const productIds = searchParams.get('productIds')?.split(',').filter(Boolean);
    const paymentMethodIds = searchParams.get('paymentMethodIds')?.split(',').filter(Boolean);
    const shiftId = searchParams.get('shiftId');
    const groupBy = searchParams.get('groupBy') || 'day'; // hour, day, week, month, year

    // Build base where clause
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const invoiceWhere: any = { status: 'COMPLETED' };
    if (Object.keys(dateFilter).length > 0) invoiceWhere.createdAt = dateFilter;
    if (branchIds?.length) invoiceWhere.branchId = { in: branchIds };
    if (userIds?.length) invoiceWhere.userId = { in: userIds };
    if (shiftId) invoiceWhere.shiftId = shiftId;

    switch (reportType) {
      case 'sales':
        return await getSalesReport(invoiceWhere, groupBy);
      case 'products':
        return await getProductsReport(invoiceWhere, categoryIds, productIds);
      case 'shifts':
        return await getShiftsReport(branchIds, userIds, dateFilter);
      case 'profits':
        return await getProfitsReport(invoiceWhere, groupBy);
      case 'returns':
        return await getReturnsReport(invoiceWhere);
      case 'expenses':
        return await getExpensesReport(branchIds, dateFilter);
      case 'payment-methods':
        return await getPaymentMethodsReport(invoiceWhere, paymentMethodIds);
      case 'branches':
        return await getBranchesReport(invoiceWhere);
      case 'cashiers':
        return await getCashiersReport(invoiceWhere);
      default:
        return NextResponse.json({ error: 'نوع التقرير غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحميل التقرير' }, { status: 500 });
  }
}

// Sales Report
async function getSalesReport(invoiceWhere: any, groupBy: string) {
  const invoices = await db.invoice.findMany({
    where: invoiceWhere,
    include: {
      items: true,
      payments: { include: { paymentMethod: true } },
      branch: true,
      user: true,
    },
  });

  const salesInvoices = invoices.filter(i => !i.isReturn);
  const returnInvoices = invoices.filter(i => i.isReturn);

  const totalSales = salesInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalDiscounts = salesInvoices.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalTax = salesInvoices.reduce((sum, i) => sum + i.taxAmount, 0);
  const totalItems = salesInvoices.reduce((sum, i) => sum + i.items.length, 0);

  // Group data
  const groupedData: Record<string, { sales: number; returns: number; invoices: number; discounts: number; tax: number }> = {};
  
  const getGroupKey = (date: Date): string => {
    const d = new Date(date);
    switch (groupBy) {
      case 'hour':
        return `${d.toISOString().split('T')[0]} ${d.getHours()}:00`;
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const week = Math.ceil((d.getDate()) / 7);
        return `${d.getFullYear()}-W${week}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return String(d.getFullYear());
      default:
        return d.toISOString().split('T')[0];
    }
  };

  salesInvoices.forEach(invoice => {
    const key = getGroupKey(invoice.createdAt);
    if (!groupedData[key]) groupedData[key] = { sales: 0, returns: 0, invoices: 0, discounts: 0, tax: 0 };
    groupedData[key].sales += invoice.totalAmount;
    groupedData[key].invoices += 1;
    groupedData[key].discounts += invoice.discountAmount;
    groupedData[key].tax += invoice.taxAmount;
  });

  returnInvoices.forEach(invoice => {
    const key = getGroupKey(invoice.createdAt);
    if (!groupedData[key]) groupedData[key] = { sales: 0, returns: 0, invoices: 0, discounts: 0, tax: 0 };
    groupedData[key].returns += invoice.totalAmount;
  });

  return NextResponse.json({
    summary: {
      totalSales,
      totalReturns,
      netSales: totalSales - totalReturns,
      totalDiscounts,
      totalTax,
      invoiceCount: salesInvoices.length,
      returnCount: returnInvoices.length,
      totalItems,
      averageOrder: salesInvoices.length > 0 ? totalSales / salesInvoices.length : 0,
    },
    groupedData: Object.entries(groupedData)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period)),
    invoices: invoices.slice(0, 100), // Limit for performance
  });
}

// Products Report
async function getProductsReport(invoiceWhere: any, categoryIds?: string[], productIds?: string[]) {
  // Update where clause for products
  if (productIds?.length) {
    invoiceWhere.items = { some: { productId: { in: productIds } } };
  }

  const invoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: false },
    include: {
      items: {
        include: { product: { include: { category: true } } },
      },
    },
  });

  // Aggregate product data
  const productData: Record<string, {
    id: string;
    name: string;
    category: string;
    quantity: number;
    totalSales: number;
    totalCost: number;
    profit: number;
    invoiceCount: number;
  }> = {};

  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      // Filter by category if specified
      if (categoryIds?.length && item.product?.categoryId && !categoryIds.includes(item.product.categoryId)) {
        return;
      }

      const key = item.productId || item.productName;
      if (!productData[key]) {
        productData[key] = {
          id: item.productId || '',
          name: item.productName,
          category: item.product?.category?.name || 'غير مصنف',
          quantity: 0,
          totalSales: 0,
          totalCost: 0,
          profit: 0,
          invoiceCount: 0,
        };
      }
      productData[key].quantity += item.quantity;
      productData[key].totalSales += item.totalAmount;
      productData[key].totalCost += item.costPrice * item.quantity;
      productData[key].profit += (item.unitPrice - item.costPrice) * item.quantity;
      productData[key].invoiceCount += 1;
    });
  });

  const products = Object.values(productData).sort((a, b) => b.totalSales - a.totalSales);

  return NextResponse.json({
    summary: {
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
      totalSales: products.reduce((sum, p) => sum + p.totalSales, 0),
      totalProfit: products.reduce((sum, p) => sum + p.profit, 0),
      averageProfitMargin: products.length > 0 
        ? products.reduce((sum, p) => sum + (p.profit / (p.totalSales || 1)), 0) / products.length * 100 
        : 0,
    },
    products: products.slice(0, 100),
  });
}

// Shifts Report
async function getShiftsReport(branchIds?: string[], userIds?: string[], dateFilter?: any) {
  const shiftWhere: any = { status: 'CLOSED' };
  if (branchIds?.length) shiftWhere.branchId = { in: branchIds };
  if (userIds?.length) shiftWhere.userId = { in: userIds };
  if (Object.keys(dateFilter).length > 0) shiftWhere.startTime = dateFilter;

  const shifts = await db.shift.findMany({
    where: shiftWhere,
    include: {
      user: true,
      branch: true,
      closedByUser: true,
      invoices: { select: { totalAmount: true, isReturn: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  // Get close details
  const shiftIds = shifts.map(s => s.id);
  const closeDetails = await db.shiftCloseDetail.findMany({
    where: { shiftId: { in: shiftIds } },
  });
  const closeDetailsMap = new Map(closeDetails.map(cd => [cd.shiftId, cd]));

  const shiftReports = shifts.map(shift => ({
    ...shift,
    closeDetail: closeDetailsMap.get(shift.id),
    profit: shift.invoices
      .filter(i => !i.isReturn)
      .reduce((sum, i) => sum + i.totalAmount, 0) * 0.2, // Approximate profit
  }));

  return NextResponse.json({
    summary: {
      totalShifts: shifts.length,
      totalSales: shifts.reduce((sum, s) => sum + s.totalSales, 0),
      totalReturns: shifts.reduce((sum, s) => sum + s.totalReturns, 0),
      totalExpenses: shifts.reduce((sum, s) => sum + s.totalExpenses, 0),
      averageShiftSales: shifts.length > 0 
        ? shifts.reduce((sum, s) => sum + s.totalSales, 0) / shifts.length 
        : 0,
    },
    shifts: shiftReports,
  });
}

// Profits Report
async function getProfitsReport(invoiceWhere: any, groupBy: string) {
  const invoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: false },
    include: { items: true },
  });

  const returnInvoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: true },
    include: { items: true },
  });

  // Calculate profits
  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCost = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
  }, 0);
  const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalReturns;

  // Get expenses
  const expenseWhere: any = {};
  if (invoiceWhere.createdAt) expenseWhere.date = invoiceWhere.createdAt;
  const expenses = await db.expense.findMany({ where: expenseWhere });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by period
  const groupedData: Record<string, { revenue: number; cost: number; profit: number; expenses: number }> = {};
  
  const getGroupKey = (date: Date): string => {
    const d = new Date(date);
    switch (groupBy) {
      case 'day': return d.toISOString().split('T')[0];
      case 'month': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'year': return String(d.getFullYear());
      default: return d.toISOString().split('T')[0];
    }
  };

  invoices.forEach(invoice => {
    const key = getGroupKey(invoice.createdAt);
    if (!groupedData[key]) groupedData[key] = { revenue: 0, cost: 0, profit: 0, expenses: 0 };
    groupedData[key].revenue += invoice.totalAmount;
    const cost = invoice.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    groupedData[key].cost += cost;
    groupedData[key].profit += invoice.totalAmount - cost;
  });

  expenses.forEach(expense => {
    const key = getGroupKey(expense.date);
    if (!groupedData[key]) groupedData[key] = { revenue: 0, cost: 0, profit: 0, expenses: 0 };
    groupedData[key].expenses += expense.amount;
    groupedData[key].profit -= expense.amount;
  });

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalCost,
      grossProfit,
      totalReturns,
      totalExpenses,
      netProfit: grossProfit - totalReturns - totalExpenses,
      profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    },
    groupedData: Object.entries(groupedData)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period)),
  });
}

// Returns Report
async function getReturnsReport(invoiceWhere: any) {
  const returnInvoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: true },
    include: {
      items: { include: { product: true } },
      customer: true,
      user: true,
      originalInvoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  
  // Products returned
  const productReturns: Record<string, { name: string; quantity: number; amount: number }> = {};
  returnInvoices.forEach(invoice => {
    invoice.items.forEach(item => {
      const key = item.productId || item.productName;
      if (!productReturns[key]) {
        productReturns[key] = { name: item.productName, quantity: 0, amount: 0 };
      }
      productReturns[key].quantity += item.quantity;
      productReturns[key].amount += item.totalAmount;
    });
  });

  return NextResponse.json({
    summary: {
      totalReturns,
      returnCount: returnInvoices.length,
      averageReturn: returnInvoices.length > 0 ? totalReturns / returnInvoices.length : 0,
    },
    productReturns: Object.entries(productReturns)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount),
    returns: returnInvoices.slice(0, 100),
  });
}

// Expenses Report
async function getExpensesReport(branchIds?: string[], dateFilter?: any) {
  const expenseWhere: any = {};
  if (branchIds?.length) expenseWhere.branchId = { in: branchIds };
  if (Object.keys(dateFilter).length > 0) expenseWhere.date = dateFilter;

  const expenses = await db.expense.findMany({
    where: expenseWhere,
    include: { category: true, branch: true },
    orderBy: { date: 'desc' },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryData: Record<string, { name: string; amount: number; count: number }> = {};
  expenses.forEach(expense => {
    const categoryName = expense.category?.name || 'غير مصنف';
    if (!categoryData[categoryName]) {
      categoryData[categoryName] = { name: categoryName, amount: 0, count: 0 };
    }
    categoryData[categoryName].amount += expense.amount;
    categoryData[categoryName].count += 1;
  });

  // Group by date
  const dailyData: Record<string, { amount: number; count: number }> = {};
  expenses.forEach(expense => {
    const date = expense.date.toISOString().split('T')[0];
    if (!dailyData[date]) dailyData[date] = { amount: 0, count: 0 };
    dailyData[date].amount += expense.amount;
    dailyData[date].count += 1;
  });

  return NextResponse.json({
    summary: {
      totalExpenses,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
    },
    categoryBreakdown: Object.values(categoryData).sort((a, b) => b.amount - a.amount),
    dailyData: Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    expenses: expenses.slice(0, 100),
  });
}

// Payment Methods Report
async function getPaymentMethodsReport(invoiceWhere: any, paymentMethodIds?: string[]) {
  const payments = await db.payment.findMany({
    where: paymentMethodIds?.length 
      ? { paymentMethodId: { in: paymentMethodIds } }
      : {},
    include: {
      paymentMethod: true,
      invoice: { include: { branch: true, user: true } },
    },
  });

  // Filter by date
  let filteredPayments = payments;
  if (invoiceWhere.createdAt) {
    const { gte, lte } = invoiceWhere.createdAt;
    filteredPayments = payments.filter(p => {
      const date = new Date(p.createdAt);
      if (gte && date < new Date(gte)) return false;
      if (lte && date > new Date(lte)) return false;
      return true;
    });
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Group by payment method
  const methodData: Record<string, { name: string; code: string; amount: number; count: number }> = {};
  filteredPayments.forEach(payment => {
    const methodId = payment.paymentMethodId;
    if (!methodData[methodId]) {
      methodData[methodId] = {
        name: payment.paymentMethod?.name || 'غير محدد',
        code: payment.paymentMethod?.code || 'unknown',
        amount: 0,
        count: 0,
      };
    }
    methodData[methodId].amount += payment.amount;
    methodData[methodId].count += 1;
  });

  return NextResponse.json({
    summary: {
      totalAmount,
      transactionCount: filteredPayments.length,
      averageTransaction: filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0,
    },
    methodBreakdown: Object.values(methodData).sort((a, b) => b.amount - a.amount),
    payments: filteredPayments.slice(0, 100),
  });
}

// Branches Comparison Report
async function getBranchesReport(invoiceWhere: any) {
  const invoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: false },
    include: { branch: true, items: true },
  });

  // Group by branch
  const branchData: Record<string, { 
    id: string;
    name: string; 
    sales: number; 
    invoices: number; 
    items: number;
    profit: number;
  }> = {};

  invoices.forEach(invoice => {
    const branchId = invoice.branchId;
    if (!branchData[branchId]) {
      branchData[branchId] = {
        id: branchId,
        name: invoice.branch?.name || 'غير محدد',
        sales: 0,
        invoices: 0,
        items: 0,
        profit: 0,
      };
    }
    branchData[branchId].sales += invoice.totalAmount;
    branchData[branchId].invoices += 1;
    branchData[branchId].items += invoice.items.length;
    branchData[branchId].profit += invoice.items.reduce(
      (sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0
    );
  });

  const branches = Object.values(branchData).sort((a, b) => b.sales - a.sales);
  const totalSales = branches.reduce((sum, b) => sum + b.sales, 0);

  return NextResponse.json({
    summary: {
      branchCount: branches.length,
      totalSales,
      averageSalesPerBranch: branches.length > 0 ? totalSales / branches.length : 0,
    },
    branches: branches.map(b => ({
      ...b,
      percentage: totalSales > 0 ? (b.sales / totalSales) * 100 : 0,
    })),
  });
}

// Cashiers Performance Report
async function getCashiersReport(invoiceWhere: any) {
  const invoices = await db.invoice.findMany({
    where: { ...invoiceWhere, isReturn: false },
    include: { user: true, items: true },
  });

  // Group by cashier
  const cashierData: Record<string, { 
    id: string;
    name: string; 
    sales: number; 
    invoices: number; 
    profit: number;
  }> = {};

  invoices.forEach(invoice => {
    const userId = invoice.userId;
    if (!cashierData[userId]) {
      cashierData[userId] = {
        id: userId,
        name: invoice.user?.name || 'غير محدد',
        sales: 0,
        invoices: 0,
        profit: 0,
      };
    }
    cashierData[userId].sales += invoice.totalAmount;
    cashierData[userId].invoices += 1;
    cashierData[userId].profit += invoice.items.reduce(
      (sum, item) => sum + ((item.unitPrice - item.costPrice) * item.quantity), 0
    );
  });

  const cashiers = Object.values(cashierData).sort((a, b) => b.sales - a.sales);
  const totalSales = cashiers.reduce((sum, c) => sum + c.sales, 0);

  return NextResponse.json({
    summary: {
      cashierCount: cashiers.length,
      totalSales,
      averageSalesPerCashier: cashiers.length > 0 ? totalSales / cashiers.length : 0,
    },
    cashiers: cashiers.map(c => ({
      ...c,
      averageOrder: c.invoices > 0 ? c.sales / c.invoices : 0,
    })),
  });
}
