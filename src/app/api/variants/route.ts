// ============================================
// Variants API - واجهة برمجة المتغيرات
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: جلب متغيرات منتج
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('id');

    // جلب متغير محدد
    if (variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true
            }
          }
        }
      });

      if (!variant) {
        return NextResponse.json(
          { error: 'المتغير غير موجود' },
          { status: 404 }
        );
      }

      return NextResponse.json({ variant });
    }

    // جلب متغيرات منتج محدد
    if (productId) {
      const variants = await db.productVariant.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ 
        variants,
        total: variants.length 
      });
    }

    // جلب جميع المتغيرات
    const variants = await db.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      variants,
      total: variants.length 
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المتغيرات' },
      { status: 500 }
    );
  }
}

// POST: إنشاء متغير جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      sku, 
      name, 
      nameAr, 
      costPrice, 
      sellingPrice, 
      stock, 
      attributes, 
      barcode,
      isActive 
    } = body;

    // التحقق من البيانات المطلوبة
    if (!productId || !name) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المتغير والمنتج' },
        { status: 400 }
      );
    }

    // التحقق من وجود المنتج
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الباركود
    if (barcode) {
      const existingBarcode = await db.productVariant.findFirst({
        where: { barcode }
      });

      if (existingBarcode) {
        return NextResponse.json(
          { error: 'رقم الباركود مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // إنشاء المتغير
    const variant = await db.productVariant.create({
      data: {
        productId,
        sku: sku || null,
        name,
        nameAr: nameAr || null,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        stock: stock || 0,
        attributes: attributes || null,
        barcode: barcode || null,
        isActive: isActive ?? true
      }
    });

    // تحديث المنتج ليدل على أنه له متغيرات
    await db.product.update({
      where: { id: productId },
      data: { hasVariants: true }
    });

    return NextResponse.json({ 
      variant,
      message: 'تم إنشاء المتغير بنجاح' 
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المتغير' },
      { status: 500 }
    );
  }
}

// PUT: تحديث متغير
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      sku, 
      name, 
      nameAr, 
      costPrice, 
      sellingPrice, 
      stock, 
      attributes, 
      barcode,
      isActive 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المتغير مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المتغير
    const existingVariant = await db.productVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: 'المتغير غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الباركود
    if (barcode && barcode !== existingVariant.barcode) {
      const duplicateBarcode = await db.productVariant.findFirst({
        where: { 
          barcode,
          NOT: { id }
        }
      });

      if (duplicateBarcode) {
        return NextResponse.json(
          { error: 'رقم الباركود مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // تحديث المتغير
    const variant = await db.productVariant.update({
      where: { id },
      data: {
        sku: sku ?? existingVariant.sku,
        name: name ?? existingVariant.name,
        nameAr: nameAr ?? existingVariant.nameAr,
        costPrice: costPrice ?? existingVariant.costPrice,
        sellingPrice: sellingPrice ?? existingVariant.sellingPrice,
        stock: stock ?? existingVariant.stock,
        attributes: attributes ?? existingVariant.attributes,
        barcode: barcode ?? existingVariant.barcode,
        isActive: isActive ?? existingVariant.isActive
      }
    });

    return NextResponse.json({ 
      variant,
      message: 'تم تحديث المتغير بنجاح' 
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المتغير' },
      { status: 500 }
    );
  }
}

// DELETE: حذف متغير
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المتغير مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المتغير
    const variant = await db.productVariant.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'المتغير غير موجود' },
        { status: 404 }
      );
    }

    // حذف المتغير
    await db.productVariant.delete({
      where: { id }
    });

    // التحقق من وجود متغيرات أخرى للمنتج
    const remainingVariants = await db.productVariant.count({
      where: { productId: variant.productId }
    });

    // إذا لم يعد هناك متغيرات، تحديث المنتج
    if (remainingVariants === 0) {
      await db.product.update({
        where: { id: variant.productId },
        data: { hasVariants: false }
      });
    }

    return NextResponse.json({ 
      message: 'تم حذف المتغير بنجاح' 
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المتغير' },
      { status: 500 }
    );
  }
}
