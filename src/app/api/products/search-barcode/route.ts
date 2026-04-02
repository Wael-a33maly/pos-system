import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API للبحث بالباركود - يدعم المنتجات الأساسية والمتغيرات
 * GET /api/products/search-barcode?barcode=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json({ error: 'الباركود مطلوب' }, { status: 400 });
    }

    // أولاً: البحث في المتغيرات (النظام الجديد)
    const variation = await db.productVariation.findUnique({
      where: { barcode },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          }
        }
      }
    });

    if (variation && variation.isActive && variation.product.isActive) {
      return NextResponse.json({
        found: true,
        type: 'variation',
        item: {
          id: variation.id,
          productId: variation.productId,
          productName: variation.product.name,
          productBarcode: variation.product.barcode,
          variationName: variation.name,
          barcode: variation.barcode,
          price: variation.price,
          costPrice: variation.product.costPrice,
          stock: variation.stock,
          isStockTracked: variation.isStockTracked && variation.product.isStockTracked,
          unit: variation.product.unit,
          category: variation.product.category,
          brand: variation.product.brand,
        }
      });
    }

    // ثانياً: البحث في المنتجات الأساسية
    const product = await db.product.findFirst({
      where: { 
        barcode,
        isActive: true 
      },
      include: {
        category: true,
        brand: true,
        variations: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (product) {
      // إذا كان للمنتج متغيرات، نرجع قائمة المتغيرات
      if (product.variations && product.variations.length > 0) {
        return NextResponse.json({
          found: true,
          type: 'product_with_variations',
          item: {
            id: product.id,
            productName: product.name,
            barcode: product.barcode,
            basePrice: product.sellingPrice,
            costPrice: product.costPrice,
            isStockTracked: product.isStockTracked,
            unit: product.unit,
            category: product.category,
            brand: product.brand,
            variations: product.variations.map(v => ({
              id: v.id,
              price: v.price,
              name: v.name,
              barcode: v.barcode,
              stock: v.stock,
              isStockTracked: v.isStockTracked,
            }))
          }
        });
      }

      // منتج عادي بدون متغيرات
      return NextResponse.json({
        found: true,
        type: 'product',
        item: {
          id: product.id,
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          price: product.sellingPrice,
          costPrice: product.costPrice,
          stock: 0, // سيتم جلبه من inventory
          isStockTracked: product.isStockTracked,
          unit: product.unit,
          category: product.category,
          brand: product.brand,
        }
      });
    }

    // البحث في النظام القديم (variants)
    const oldVariant = await db.productVariant.findFirst({
      where: { 
        barcode,
        isActive: true 
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          }
        }
      }
    });

    if (oldVariant && oldVariant.product.isActive) {
      return NextResponse.json({
        found: true,
        type: 'old_variant',
        item: {
          id: oldVariant.id,
          productId: oldVariant.productId,
          productName: oldVariant.product.name,
          variantName: oldVariant.name,
          barcode: oldVariant.barcode,
          price: oldVariant.sellingPrice,
          costPrice: oldVariant.costPrice,
          stock: oldVariant.stock,
          isStockTracked: true,
          unit: oldVariant.product.unit,
          category: oldVariant.product.category,
          brand: oldVariant.product.brand,
        }
      });
    }

    return NextResponse.json({ 
      found: false,
      error: 'المنتج غير موجود' 
    }, { status: 404 });

  } catch (error) {
    console.error('Search barcode error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث' }, { status: 500 });
  }
}
