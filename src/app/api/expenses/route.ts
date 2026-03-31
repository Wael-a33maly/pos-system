import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const shiftId = searchParams.get('shiftId');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (shiftId) where.shiftId = shiftId;
    if (categoryId) where.categoryId = categoryId;
    if (startDate && endDate) where.date = { gte: new Date(startDate), lte: new Date(endDate) };

    const expenses = await db.expense.findMany({
      where,
      include: { category: true, branch: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const expense = await db.expense.create({
      data: {
        branchId: body.branchId, shiftId: body.shiftId, categoryId: body.categoryId,
        amount: body.amount, description: body.description, userId: body.userId, date: new Date(),
      },
      include: { category: true },
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
