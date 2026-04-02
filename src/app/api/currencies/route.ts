import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const currencies = await db.currency.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ currencies });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.isDefault) {
      await db.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const currency = await db.currency.create({
      data: { name: body.name, nameAr: body.nameAr, code: body.code, symbol: body.symbol, decimalPlaces: body.decimalPlaces || 2, isDefault: body.isDefault || false, isActive: body.isActive ?? true },
    });
    return NextResponse.json({ currency }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
