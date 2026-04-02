// ============================================
// Inventory Count API - API جرد المخزون
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع عمليات الجرد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const countType = searchParams.get('countType');
    const branchId = searchParams.get('branchId');
    
    const where: any = {};
    if (status) where.status = status;
    if (countType) where.countType = countType;
    if (branchId) where.branchId = branchId;
    
    const counts = await db.inventoryCount.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                nameAr: true,
                barcode: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // جلب بيانات الفروع
    const branchIds = [...new Set(counts.map(c => c.branchId))];
    const branches = await db.branch.findMany({ 
      where: { id: { in: branchIds } },
      select: { id: true, name: true, nameAr: true }
    });
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]));
    
    const enrichedCounts = counts.map(c => ({
      ...c,
      branch: branchMap[c.branchId],
      items: c.items.map(item => ({
        ...item,
        product: item.product
      }))
    }));
    
    return NextResponse.json({ counts: enrichedCounts });
  } catch (error) {
    console.error('Get inventory counts error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب عمليات الجرد' }, { status: 500 });
  }
}

// POST - إنشاء عملية جرد جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      branchId, 
      countType, 
      scheduledDate, 
      notes, 
      productIds,
      createdBy 
    } = body;
    
    if (!branchId || !countType) {
      return NextResponse.json({ error: 'الفرع ونوع الجرد مطلوبان' }, { status: 400 });
    }
    
    // توليد رقم الجرد
    const lastCount = await db.inventoryCount.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { countNumber: true }
    });
    
    const lastNumber = lastCount 
      ? parseInt(lastCount.countNumber.replace('IC-', '')) || 0 
      : 0;
    const countNumber = `IC-${String(lastNumber + 1).padStart(6, '0')}`;
    
    // تحديد المنتجات للجرد
    let productsToCount: any[] = [];
    
    if (productIds && productIds.length > 0) {
      // جرد جزئي - منتجات محددة
      productsToCount = await db.product.findMany({
        where: { 
          id: { in: productIds },
          isActive: true 
        },
        include: {
          // variations معطل مؤقتاً
        }
      });
    } else {
      // جرد شامل - جميع المنتجات
      productsToCount = await db.product.findMany({
        where: { 
          isActive: true,
          OR: [
            { branchId },
            { branchId: null }
          ]
        },
        include: {
          // variations معطل مؤقتاً
        }
      });
    }
    
    // جلب المخزون الحالي
    const inventory = await db.inventory.findMany({
      where: { branchId }
    });
    const inventoryMap = new Map(inventory.map(i => [i.productId, i.quantity]));
    
    // تحضير عناصر الجرد
    const itemsData: any[] = [];
    
    for (const product of productsToCount) {
      const systemQty = inventoryMap.get(product.id) || 0;
      
      // إضافة المنتج الرئيسي
      itemsData.push({
        productId: product.id,
        variationId: null,
        systemQty,
        unitCost: product.costPrice,
        status: 'PENDING'
      });
      
      // إضافة المتغيرات إن وجدت
      if (product.variations && product.variations.length > 0) {
        for (const variation of product.variations) {
          itemsData.push({
            productId: product.id,
            variationId: variation.id,
            systemQty: variation.stock || 0,
            unitCost: product.costPrice,
            status: 'PENDING'
          });
        }
      }
    }
    
    const totalValue = itemsData.reduce((sum, item) => sum + (item.systemQty * item.unitCost), 0);
    
    const count = await db.inventoryCount.create({
      data: {
        countNumber,
        branchId,
        countType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        createdBy: createdBy || 'system',
        totalItems: itemsData.length,
        totalValue,
        status: scheduledDate ? 'SCHEDULED' : 'DRAFT',
        items: {
          create: itemsData
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, nameAr: true, barcode: true }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ count }, { status: 201 });
  } catch (error: any) {
    console.error('Create inventory count error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء عملية الجرد' }, { status: 500 });
  }
}
