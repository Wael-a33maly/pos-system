import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// توليد رقم قيد جديد
async function generateEntryNumber(): Promise<string> {
  // استخدام raw query لأن Prisma client قد لا يعرف الحقول الجديدة
  const result = await db.$queryRaw<Array<{ entryNumber: string }>>`
    SELECT entryNumber FROM JournalEntry 
    ORDER BY entryNumber DESC 
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    return 'JE-000001';
  }

  const lastNumber = parseInt(result[0].entryNumber.replace('JE-', ''), 10);
  const newNumber = lastNumber + 1;
  return `JE-${newNumber.toString().padStart(6, '0')}`;
}

// GET - جلب القيود المحاسبية
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // بناء شروط WHERE
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (fromDate) {
      conditions.push(`je.date >= ?`);
      params.push(new Date(fromDate));
    }

    if (toDate) {
      conditions.push(`je.date <= ?`);
      params.push(new Date(toDate));
    }

    if (status) {
      conditions.push(`je.status = ?`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(je.entryNumber LIKE ? OR je.description LIKE ? OR je.reference LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // جلب القيود
    const entries = await db.$queryRawUnsafe<Array<{
      id: string;
      entryNumber: string;
      date: Date;
      reference: string | null;
      description: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>>(
      `SELECT id, entryNumber, date, reference, description, status, createdAt, updatedAt 
       FROM JournalEntry je 
       WHERE ${whereClause}
       ORDER BY date DESC, entryNumber DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      (page - 1) * limit
    );

    // جلب بنود كل قيد
    const entryIds = entries.map((e) => e.id);
    let lines: any[] = [];
    
    if (entryIds.length > 0) {
      lines = await db.$queryRawUnsafe<Array<{
        id: string;
        entryId: string;
        accountId: string;
        debit: number;
        credit: number;
        description: string | null;
        accountCode: string;
        accountName: string;
        accountNameAr: string | null;
        accountType: string;
      }>>(
        `SELECT 
          jel.id, jel.entryId, jel.accountId, jel.debit, jel.credit, jel.description,
          a.code as accountCode, a.name as accountName, a.nameAr as accountNameAr, a.type as accountType
         FROM JournalEntryLine jel
         INNER JOIN Account a ON jel.accountId = a.id
         WHERE jel.entryId IN (${entryIds.map(() => '?').join(',')})`,
        ...entryIds
      );
    }

    // حساب الإجماليات
    const entriesWithTotals = entries.map((entry) => {
      const entryLines = lines.filter((l) => l.entryId === entry.id);
      const totalDebit = entryLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = entryLines.reduce((sum, line) => sum + line.credit, 0);
      
      return {
        ...entry,
        lines: entryLines.map((l) => ({
          id: l.id,
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description,
          account: {
            id: l.accountId,
            code: l.accountCode,
            name: l.accountName,
            nameAr: l.accountNameAr,
            type: l.accountType,
          },
        })),
        totalDebit,
        totalCredit,
      };
    });

    // جلب العدد الإجمالي
    const countResult = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM JournalEntry je WHERE ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      entries: entriesWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب القيود' }, { status: 500 });
  }
}

// POST - إنشاء قيد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, description, reference, lines, status = 'DRAFT' } = body;

    // التحقق من وجود بنود
    if (!lines || lines.length < 2) {
      return NextResponse.json({ error: 'يجب أن يحتوي القيد على بندين على الأقل' }, { status: 400 });
    }

    // التحقق من التوازن
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `القيد غير متوازن. المدين: ${totalDebit}، الدائن: ${totalCredit}` },
        { status: 400 }
      );
    }

    // التحقق من صحة الحسابات
    const accountIds = lines.map((line: any) => line.accountId);
    const accounts = await db.account.findMany({
      where: { id: { in: accountIds } },
    });

    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'بعض الحسابات غير موجودة' }, { status: 400 });
    }

    // توليد رقم القيد
    const entryNumber = await generateEntryNumber();
    const id = `je_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // إنشاء القيد باستخدام raw query
    await db.$executeRawUnsafe(
      `INSERT INTO JournalEntry (id, entryNumber, date, description, reference, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      id,
      entryNumber,
      new Date(date).toISOString(),
      description || null,
      reference || null,
      status
    );

    // إنشاء بنود القيد
    for (const line of lines) {
      const lineId = `jel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db.$executeRawUnsafe(
        `INSERT INTO JournalEntryLine (id, entryId, accountId, debit, credit, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        lineId,
        id,
        line.accountId,
        line.debit || 0,
        line.credit || 0,
        line.description || null
      );
    }

    // جلب القيد المُنشأ
    const entry = await db.$queryRawUnsafe<Array<{
      id: string;
      entryNumber: string;
      date: Date;
      reference: string | null;
      description: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>>(
      `SELECT id, entryNumber, date, reference, description, status, createdAt, updatedAt 
       FROM JournalEntry WHERE id = ?`,
      id
    );

    const entryLines = await db.$queryRawUnsafe<Array<{
      id: string;
      accountId: string;
      debit: number;
      credit: number;
      description: string | null;
      accountCode: string;
      accountName: string;
      accountNameAr: string | null;
      accountType: string;
    }>>(
      `SELECT 
        jel.id, jel.accountId, jel.debit, jel.credit, jel.description,
        a.code as accountCode, a.name as accountName, a.nameAr as accountNameAr, a.type as accountType
       FROM JournalEntryLine jel
       INNER JOIN Account a ON jel.accountId = a.id
       WHERE jel.entryId = ?`,
      id
    );

    return NextResponse.json({
      ...entry[0],
      lines: entryLines.map((l) => ({
        id: l.id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description,
        account: {
          id: l.accountId,
          code: l.accountCode,
          name: l.accountName,
          nameAr: l.accountNameAr,
          type: l.accountType,
        },
      })),
      totalDebit,
      totalCredit,
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء القيد' }, { status: 500 });
  }
}
