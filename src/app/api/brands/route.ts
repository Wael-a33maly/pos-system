import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const where: any = { isActive: true };
    if (search) where.name = { contains: search };
    const brands = await db.brand.findMany({ where, orderBy: { name: 'asc' } });
    return NextResponse.json({ brands });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brand = await db.brand.create({
      data: { name: body.name, nameAr: body.nameAr, logo: body.logo, description: body.description, isActive: body.isActive ?? true },
    });
    return NextResponse.json({ brand }, { status: 201 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
