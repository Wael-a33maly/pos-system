import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true, brand: true, supplier: true,
        variants: { where: { isActive: true } }, inventory: true,
      },
    });
    if (!product) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const product = await db.product.update({
      where: { id },
      data: {
        barcode: body.barcode, sku: body.sku, name: body.name, nameAr: body.nameAr,
        description: body.description, categoryId: body.categoryId, brandId: body.brandId,
        supplierId: body.supplierId, costPrice: body.costPrice, sellingPrice: body.sellingPrice,
        wholesalePrice: body.wholesalePrice, minStock: body.minStock, maxStock: body.maxStock,
        unit: body.unit, image: body.image, hasVariants: body.hasVariants, isActive: body.isActive,
      },
      include: { category: true, brand: true, variants: true },
    });
    return NextResponse.json({ product });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'الباركود مستخدم بالفعل' }, { status: 400 });
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
