import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب حساب محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await db.account.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
    }

    // حساب الرصيد من القيود
    const balance = await db.journalEntryLine.aggregate({
      where: {
        accountId: id,
        entry: { status: 'POSTED' },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return NextResponse.json({
      ...account,
      calculatedBalance:
        (balance._sum.debit || 0) - (balance._sum.credit || 0) + account.balance,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الحساب' }, { status: 500 });
  }
}

// PUT - تحديث حساب
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, nameAr, type, parentId, isActive, balance } = body;

    // التحقق من وجود الحساب
    const existingAccount = await db.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار الكود
    if (code && code !== existingAccount.code) {
      const accountWithCode = await db.account.findUnique({
        where: { code },
      });

      if (accountWithCode) {
        return NextResponse.json({ error: 'كود الحساب موجود مسبقاً' }, { status: 400 });
      }
    }

    // التحقق من صحة الحساب الأب
    if (parentId) {
      const parent = await db.account.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json({ error: 'الحساب الأب غير موجود' }, { status: 400 });
      }

      const accountType = type || existingAccount.type;
      if (parent.type !== accountType) {
        return NextResponse.json({ error: 'نوع الحساب يجب أن يكون نفس نوع الحساب الأب' }, { status: 400 });
      }
    }

    const account = await db.account.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(type && { type }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive }),
        ...(balance !== undefined && { balance }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث الحساب' }, { status: 500 });
  }
}

// DELETE - حذف حساب
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الحساب
    const account = await db.account.findUnique({
      where: { id },
      include: {
        children: true,
        lines: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
    }

    // التحقق من عدم وجود حسابات فرعية
    if (account.children.length > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف حساب له حسابات فرعية' }, { status: 400 });
    }

    // التحقق من عدم وجود قيود مرتبطة
    if (account.lines.length > 0) {
      return NextResponse.json({ error: 'لا يمكن حذف حساب مرتبط بقيود محاسبية' }, { status: 400 });
    }

    await db.account.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف الحساب' }, { status: 500 });
  }
}
