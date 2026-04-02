import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const branchId = searchParams.get('branchId');
    const barcode = searchParams.get('barcode');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (branchId) where.branchId = branchId;
    if (barcode) where.barcode = barcode;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          supplier: true,
          variants: { where: { isActive: true } },
          inventory: branchId ? { where: { branchId } } : true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المنتجات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await db.product.create({
      data: {
        barcode: body.barcode,
        sku: body.sku,
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        categoryId: body.categoryId,
        brandId: body.brandId,
        supplierId: body.supplierId,
        branchId: body.branchId,
        costPrice: body.costPrice || 0,
        sellingPrice: body.sellingPrice || 0,
        wholesalePrice: body.wholesalePrice,
        minStock: body.minStock || 0,
        maxStock: body.maxStock,
        unit: body.unit || 'piece',
        image: body.image,
        hasVariants: body.hasVariants || false,
        isActive: body.isActive ?? true,
      },
      include: { category: true, brand: true, variants: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'الباركود مستخدم بالفعل' }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المنتج' }, { status: 500 });
  }
}
