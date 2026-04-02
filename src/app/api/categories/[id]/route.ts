import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await db.category.findUnique({
      where: { id },
      include: { parent: true, children: true, products: { where: { isActive: true }, take: 10 } },
    });
    if (!category) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
    return NextResponse.json({ category });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const category = await db.category.update({
      where: { id },
      data: { name: body.name, nameAr: body.nameAr, parentId: body.parentId, image: body.image, color: body.color, sortOrder: body.sortOrder, isActive: body.isActive },
    });
    return NextResponse.json({ category });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
