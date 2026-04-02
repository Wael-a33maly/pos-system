import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const branches = await db.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ branches });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const branch = await db.branch.create({
      data: { name: body.name, nameAr: body.nameAr, address: body.address, phone: body.phone, email: body.email, isActive: body.isActive ?? true },
    });
    return NextResponse.json({ branch }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
