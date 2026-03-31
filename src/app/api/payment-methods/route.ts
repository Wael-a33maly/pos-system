import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const paymentMethods = await db.paymentMethod.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ paymentMethods });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentMethod = await db.paymentMethod.create({
      data: { name: body.name, nameAr: body.nameAr, code: body.code, isActive: body.isActive ?? true },
    });
    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
