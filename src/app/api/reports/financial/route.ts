import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - التقارير المالية
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'trial-balance';
    const asOfDate = searchParams.get('asOfDate');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    switch (reportType) {
      case 'trial-balance':
        return await getTrialBalance(asOfDate);
      case 'income-statement':
        return await getIncomeStatement(fromDate, toDate);
      case 'balance-sheet':
        return await getBalanceSheet(asOfDate);
      case 'cash-flow':
        return await getCashFlowStatement(fromDate, toDate);
      default:
        return NextResponse.json({ error: 'نوع التقرير غير صالح' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating financial report:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء التقرير' }, { status: 500 });
  }
}

// ميزان المراجعة
async function getTrialBalance(asOfDate: string | null) {
  const dateFilter = asOfDate ? new Date(asOfDate) : new Date();
  const dateStr = dateFilter.toISOString();

  // جلب جميع الحسابات
  const accounts = await db.account.findMany({
    where: { isActive: true },
    include: { parent: true },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  // حساب الأرصدة من القيود المرحلة باستخدام raw query
  const balances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
    SELECT 
      jel.accountId,
      SUM(jel.debit) as totalDebit,
      SUM(jel.credit) as totalCredit
    FROM JournalEntryLine jel
    INNER JOIN JournalEntry je ON jel.entryId = je.id
    WHERE je.status = 'POSTED' AND je.date <= ${dateStr}
    GROUP BY jel.accountId
  `;

  const balanceMap = new Map(
    balances.map((b) => [b.accountId, { debit: b.totalDebit || 0, credit: b.totalCredit || 0 }])
  );

  // بناء ميزان المراجعة
  const items = accounts.map((account) => {
    const accountBalance = balanceMap.get(account.id) || { debit: 0, credit: 0 };
    const openingBalance = account.balance;

    // الأصول والمصروفات: المدين طبيعي
    // الخصوم وحقوق الملكية والإيرادات: الدائن طبيعي
    let debit = 0;
    let credit = 0;

    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      // الرصيد الافتتاحي مدين
      debit = openingBalance + accountBalance.debit - accountBalance.credit;
      if (debit < 0) {
        credit = Math.abs(debit);
        debit = 0;
      }
    } else {
      // الرصيد الافتتاحي دائن
      credit = openingBalance + accountBalance.credit - accountBalance.debit;
      if (credit < 0) {
        debit = Math.abs(credit);
        credit = 0;
      }
    }

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.nameAr || account.name,
      accountType: account.type,
      debit,
      credit,
    };
  });

  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);

  return NextResponse.json({
    items,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    asOfDate: dateFilter,
  });
}

// قائمة الدخل
async function getIncomeStatement(fromDate: string | null, toDate: string | null) {
  const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = toDate ? new Date(toDate) : new Date();
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  // جلب حسابات الإيرادات والمصروفات
  const accounts = await db.account.findMany({
    where: {
      type: { in: ['REVENUE', 'EXPENSE'] },
      isActive: true,
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  const accountIds = accounts.map((a) => a.id);

  // حساب الأرصدة من القيود المرحلة
  const balances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
    SELECT 
      jel.accountId,
      SUM(jel.debit) as totalDebit,
      SUM(jel.credit) as totalCredit
    FROM JournalEntryLine jel
    INNER JOIN JournalEntry je ON jel.entryId = je.id
    WHERE je.status = 'POSTED' 
      AND je.date >= ${startStr} 
      AND je.date <= ${endStr}
      AND jel.accountId IN (${accountIds.join(',')})
    GROUP BY jel.accountId
  `;

  const balanceMap = new Map(
    balances.map((b) => [b.accountId, { debit: b.totalDebit || 0, credit: b.totalCredit || 0 }])
  );

  // بناء قائمة الدخل
  const revenues: any[] = [];
  const expenses: any[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  accounts.forEach((account) => {
    const accountBalance = balanceMap.get(account.id) || { debit: 0, credit: 0 };
    let amount = 0;

    if (account.type === 'REVENUE') {
      // الإيرادات: الدائن طبيعي
      amount = accountBalance.credit - accountBalance.debit;
      revenues.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr || account.name,
        amount: Math.abs(amount),
      });
      totalRevenue += Math.abs(amount);
    } else {
      // المصروفات: المدين طبيعي
      amount = accountBalance.debit - accountBalance.credit;
      expenses.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr || account.name,
        amount: Math.abs(amount),
      });
      totalExpenses += Math.abs(amount);
    }
  });

  return NextResponse.json({
    revenues,
    totalRevenue,
    expenses,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    fromDate: startDate,
    toDate: endDate,
  });
}

// الميزانية العمومية
async function getBalanceSheet(asOfDate: string | null) {
  const dateFilter = asOfDate ? new Date(asOfDate) : new Date();
  const dateStr = dateFilter.toISOString();

  // جلب حسابات الأصول والخصوم وحقوق الملكية
  const accounts = await db.account.findMany({
    where: {
      type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
      isActive: true,
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  const accountIds = accounts.map((a) => a.id);

  // حساب الأرصدة من القيود المرحلة
  const balances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
    SELECT 
      jel.accountId,
      SUM(jel.debit) as totalDebit,
      SUM(jel.credit) as totalCredit
    FROM JournalEntryLine jel
    INNER JOIN JournalEntry je ON jel.entryId = je.id
    WHERE je.status = 'POSTED' AND je.date <= ${dateStr}
      AND jel.accountId IN (${accountIds.join(',')})
    GROUP BY jel.accountId
  `;

  const balanceMap = new Map(
    balances.map((b) => [b.accountId, { debit: b.totalDebit || 0, credit: b.totalCredit || 0 }])
  );

  // بناء الميزانية
  const assets: any[] = [];
  const liabilities: any[] = [];
  const equity: any[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  accounts.forEach((account) => {
    const accountBalance = balanceMap.get(account.id) || { debit: 0, credit: 0 };
    let amount = account.balance;

    if (account.type === 'ASSET') {
      amount += accountBalance.debit - accountBalance.credit;
      assets.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr || account.name,
        amount: Math.abs(amount),
      });
      totalAssets += Math.abs(amount);
    } else if (account.type === 'LIABILITY') {
      amount += accountBalance.credit - accountBalance.debit;
      liabilities.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr || account.name,
        amount: Math.abs(amount),
      });
      totalLiabilities += Math.abs(amount);
    } else {
      amount += accountBalance.credit - accountBalance.debit;
      equity.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr || account.name,
        amount: Math.abs(amount),
      });
      totalEquity += Math.abs(amount);
    }
  });

  return NextResponse.json({
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    asOfDate: dateFilter,
  });
}

// قائمة التدفقات النقدية
async function getCashFlowStatement(fromDate: string | null, toDate: string | null) {
  const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = toDate ? new Date(toDate) : new Date();
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  // جلب حسابات النقدية والبنك
  const cashAccounts = await db.account.findMany({
    where: {
      type: 'ASSET',
      code: { in: ['1110', '1120', '1111', '1121', '1000', '1100'] }, // النقدية والبنك
      isActive: true,
    },
  });

  const cashAccountIds = cashAccounts.map((a) => a.id);

  // حساب التغير في النقدية
  const cashBalances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
    SELECT 
      jel.accountId,
      SUM(jel.debit) as totalDebit,
      SUM(jel.credit) as totalCredit
    FROM JournalEntryLine jel
    INNER JOIN JournalEntry je ON jel.entryId = je.id
    WHERE je.status = 'POSTED' 
      AND je.date >= ${startStr} 
      AND je.date <= ${endStr}
      AND jel.accountId IN (${cashAccountIds.join(',')})
    GROUP BY jel.accountId
  `;

  // التدفقات التشغيلية (مبسط)
  const operatingActivities = [];
  let totalOperating = 0;

  // جلب المصروفات والإيرادات
  const revenueAccounts = await db.account.findMany({
    where: { type: 'REVENUE', isActive: true },
  });

  const expenseAccounts = await db.account.findMany({
    where: { type: 'EXPENSE', isActive: true },
  });

  const revenueIds = revenueAccounts.map((a) => a.id);
  const expenseIds = expenseAccounts.map((a) => a.id);

  // التدفقات من المبيعات
  if (revenueIds.length > 0) {
    const salesBalances = await db.$queryRaw<Array<{ totalDebit: number; totalCredit: number }>>`
      SELECT 
        SUM(jel.debit) as totalDebit,
        SUM(jel.credit) as totalCredit
      FROM JournalEntryLine jel
      INNER JOIN JournalEntry je ON jel.entryId = je.id
      WHERE je.status = 'POSTED' 
        AND je.date >= ${startStr} 
        AND je.date <= ${endStr}
        AND jel.accountId IN (${revenueIds.join(',')})
    `;

    const totalSales = (salesBalances[0]?.totalCredit || 0) - (salesBalances[0]?.totalDebit || 0);
    operatingActivities.push({
      accountId: 'sales',
      accountCode: '4100',
      accountName: 'التدفقات من المبيعات',
      amount: totalSales,
      category: 'operating' as const,
    });
    totalOperating += totalSales;
  }

  // المدفوعات للموردين والمصروفات
  if (expenseIds.length > 0) {
    const expenseBalances = await db.$queryRaw<Array<{ totalDebit: number; totalCredit: number }>>`
      SELECT 
        SUM(jel.debit) as totalDebit,
        SUM(jel.credit) as totalCredit
      FROM JournalEntryLine jel
      INNER JOIN JournalEntry je ON jel.entryId = je.id
      WHERE je.status = 'POSTED' 
        AND je.date >= ${startStr} 
        AND je.date <= ${endStr}
        AND jel.accountId IN (${expenseIds.join(',')})
    `;

    const totalExpenses = (expenseBalances[0]?.totalDebit || 0) - (expenseBalances[0]?.totalCredit || 0);
    operatingActivities.push({
      accountId: 'expenses',
      accountCode: '5000',
      accountName: 'المدفوعات للمصروفات',
      amount: -totalExpenses,
      category: 'operating' as const,
    });
    totalOperating -= totalExpenses;
  }

  // حساب الرصيد الافتتاحي والختامي
  const openingBalances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
    SELECT 
      jel.accountId,
      SUM(jel.debit) as totalDebit,
      SUM(jel.credit) as totalCredit
    FROM JournalEntryLine jel
    INNER JOIN JournalEntry je ON jel.entryId = je.id
    WHERE je.status = 'POSTED' AND je.date < ${startStr}
      AND jel.accountId IN (${cashAccountIds.join(',')})
    GROUP BY jel.accountId
  `;

  const openingCash = cashAccounts.reduce((sum, acc) => {
    const balance = openingBalances.find((b) => b.accountId === acc.id);
    return sum + acc.balance + (balance?.totalDebit || 0) - (balance?.totalCredit || 0);
  }, 0);

  const closingCash = cashAccounts.reduce((sum, acc) => {
    const balance = cashBalances.find((b) => b.accountId === acc.id);
    return sum + acc.balance + (balance?.totalDebit || 0) - (balance?.totalCredit || 0);
  }, 0);

  return NextResponse.json({
    operatingActivities,
    totalOperating,
    investingActivities: [],
    totalInvesting: 0,
    financingActivities: [],
    totalFinancing: 0,
    netCashFlow: totalOperating,
    openingCash,
    closingCash,
    fromDate: startDate,
    toDate: endDate,
  });
}
