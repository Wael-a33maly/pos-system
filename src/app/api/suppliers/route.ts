import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const where: any = { isActive: true };
    if (search) where.name = { contains: search };
    const suppliers = await db.supplier.findMany({ where, orderBy: { name: 'asc' } });
    return NextResponse.json({ suppliers });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await db.supplier.create({
      data: { name: body.name, nameAr: body.nameAr, phone: body.phone, email: body.email, address: body.address, taxNumber: body.taxNumber, notes: body.notes, branchId: body.branchId, isActive: body.isActive ?? true },
    });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
