import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');

    const where: any = { status: 'CLOSED' };
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const shifts = await db.shift.findMany({
      where,
      include: { user: true, branch: true, closedByUser: true },
      orderBy: { startTime: 'desc' },
    });

    const summary = {
      totalShifts: shifts.length,
      totalSales: shifts.reduce((sum, s) => sum + s.totalSales, 0),
      totalReturns: shifts.reduce((sum, s) => sum + s.totalReturns, 0),
      totalExpenses: shifts.reduce((sum, s) => sum + s.totalExpenses, 0),
      totalPayments: shifts.reduce((sum, s) => sum + s.totalPayments, 0),
    };

    return NextResponse.json({ shifts, summary });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
