import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// تحديث عملة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // إذا كانت العملة الافتراضية، إلغاء الافتراضية من العملات الأخرى
    if (body.isDefault) {
      await db.currency.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const currency = await db.currency.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        code: body.code?.toUpperCase(),
        symbol: body.symbol,
        decimalPlaces: body.decimalPlaces,
        isDefault: body.isDefault,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ currency });
  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// حذف عملة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من أنها ليست العملة الافتراضية
    const currency = await db.currency.findUnique({ where: { id } });
    if (currency?.isDefault) {
      return NextResponse.json({ error: 'لا يمكن حذف العملة الافتراضية' }, { status: 400 });
    }

    await db.currency.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete currency:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
