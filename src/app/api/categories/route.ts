import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const tree = searchParams.get('tree') === 'true';

    const where: any = { isActive: true };
    if (parentId === 'null') where.parentId = null;
    else if (parentId) where.parentId = parentId;

    const categories = await db.category.findMany({
      where,
      include: { children: true, parent: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (tree) {
      // Return as tree structure
      const mainCategories = categories.filter(c => !c.parentId);
      return NextResponse.json({ categories: mainCategories });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await db.category.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        parentId: body.parentId || null,
        image: body.image,
        color: body.color,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive ?? true,
      },
      include: { parent: true, children: true },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 });
  }
}
