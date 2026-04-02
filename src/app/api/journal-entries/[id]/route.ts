import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب قيد محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
    }

    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    return NextResponse.json({
      ...entry,
      totalDebit,
      totalCredit,
    });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب القيد' }, { status: 500 });
  }
}

// PUT - تحديث قيد
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, description, reference, lines, status } = body;

    // التحقق من وجود القيد
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
    }

    // التحقق من حالة القيد
    if (existingEntry.status === 'REVERSED') {
      return NextResponse.json({ error: 'لا يمكن تعديل قيد ملغي' }, { status: 400 });
    }

    // إذا كان القيد مرحل، لا يمكن تعديله إلا لتحويله لملغي
    if (existingEntry.status === 'POSTED' && status !== 'REVERSED') {
      return NextResponse.json({ error: 'لا يمكن تعديل قيد مرحل' }, { status: 400 });
    }

    // تحديث القيد
    if (lines && lines.length > 0) {
      // التحقق من التوازن
      const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
      const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return NextResponse.json({ error: 'القيد غير متوازن' }, { status: 400 });
      }

      // حذف البنود القديمة وإضافة البنود الجديدة
      await db.journalEntryLine.deleteMany({
        where: { entryId: id },
      });

      await db.journalEntry.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(description !== undefined && { description }),
          ...(reference !== undefined && { reference }),
          ...(status && { status }),
          lines: {
            create: lines.map((line: any) => ({
              accountId: line.accountId,
              debit: line.debit || 0,
              credit: line.credit || 0,
              description: line.description,
            })),
          },
        },
      });
    } else {
      await db.journalEntry.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(description !== undefined && { description }),
          ...(reference !== undefined && { reference }),
          ...(status && { status }),
        },
      });
    }

    // جلب القيد المحدث
    const updatedEntry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    const totalDebit = updatedEntry!.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = updatedEntry!.lines.reduce((sum, line) => sum + line.credit, 0);

    return NextResponse.json({
      ...updatedEntry,
      totalDebit,
      totalCredit,
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث القيد' }, { status: 500 });
  }
}

// DELETE - حذف قيد
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود القيد
    const entry = await db.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
    }

    // التحقق من حالة القيد
    if (entry.status === 'POSTED') {
      return NextResponse.json({ error: 'لا يمكن حذف قيد مرحل. استخدم الإلغاء بدلاً من ذلك' }, { status: 400 });
    }

    // حذف القيد (سيتم حذف البنود تلقائياً بسبب onDelete: Cascade)
    await db.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف القيد بنجاح' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف القيد' }, { status: 500 });
  }
}
