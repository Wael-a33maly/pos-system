import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET - جلب شجرة الحسابات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: Prisma.AccountWhereInput = {};

    if (type) {
      where.type = type as any;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { nameAr: { contains: search } },
      ];
    }

    const accounts = await db.account.findMany({
      where,
      include: {
        parent: true,
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    // حساب الأرصدة من القيود المحاسبية المرحلة
    // نستخدم Prisma raw query للتحقق من حالة القيد
    const accountBalances = await db.$queryRaw<Array<{ accountId: string; totalDebit: number; totalCredit: number }>>`
      SELECT 
        jel.accountId,
        SUM(jel.debit) as totalDebit,
        SUM(jel.credit) as totalCredit
      FROM JournalEntryLine jel
      INNER JOIN JournalEntry je ON jel.entryId = je.id
      WHERE je.status = 'POSTED'
      GROUP BY jel.accountId
    `;

    const balanceMap = new Map(
      accountBalances.map((b) => [b.accountId, (b.totalDebit || 0) - (b.totalCredit || 0)])
    );

    // بناء شجرة الحسابات
    const buildTree = (parentId: string | null = null): any[] => {
      return accounts
        .filter((a) => a.parentId === parentId)
        .map((account) => ({
          ...account,
          calculatedBalance: (balanceMap.get(account.id) || 0) + account.balance,
          children: buildTree(account.id),
        }));
    };

    const tree = buildTree(null);

    // حساب الإجماليات حسب النوع
    const totals = {
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };

    accounts.forEach((account) => {
      const balance = (balanceMap.get(account.id) || 0) + account.balance;
      totals[account.type] += balance;
    });

    return NextResponse.json({
      accounts: tree,
      flatAccounts: accounts.map((a) => ({
        ...a,
        calculatedBalance: (balanceMap.get(a.id) || 0) + a.balance,
      })),
      totals,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الحسابات' }, { status: 500 });
  }
}

// POST - إنشاء حساب جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, nameAr, type, parentId, balance = 0 } = body;

    // التحقق من عدم تكرار الكود
    const existingAccount = await db.account.findUnique({
      where: { code },
    });

    if (existingAccount) {
      return NextResponse.json({ error: 'كود الحساب موجود مسبقاً' }, { status: 400 });
    }

    // التحقق من صحة الحساب الأب
    if (parentId) {
      const parent = await db.account.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json({ error: 'الحساب الأب غير موجود' }, { status: 400 });
      }

      if (parent.type !== type) {
        return NextResponse.json({ error: 'نوع الحساب يجب أن يكون نفس نوع الحساب الأب' }, { status: 400 });
      }
    }

    const account = await db.account.create({
      data: {
        code,
        name,
        nameAr,
        type,
        parentId,
        balance,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب' }, { status: 500 });
  }
}
