// ============================================
// Inventory Adjustment API - API تسويات المخزون
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع التسويات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const reason = searchParams.get('reason');
    
    const where: any = {};
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (reason) where.reason = reason;
    
    const adjustments = await db.inventoryAdjustment.findMany({
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
    
    return NextResponse.json({ adjustments });
  } catch (error) {
    console.error('Get inventory adjustments error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التسويات' }, { status: 500 });
  }
}

// POST - إنشاء تسوية جديدة (يدوية)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      branchId, 
      reason, 
      reference,
      notes, 
      items,
      createdBy 
    } = body;
    
    if (!branchId || !reason || !items || items.length === 0) {
      return NextResponse.json({ error: 'الفرع والسبب والعناصر مطلوبة' }, { status: 400 });
    }
    
    // توليد رقم التسوية
    const lastAdjustment = await db.inventoryAdjustment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { adjustmentNumber: true }
    });
    
    const lastNumber = lastAdjustment 
      ? parseInt(lastAdjustment.adjustmentNumber.replace('ADJ-', '')) || 0 
      : 0;
    const adjustmentNumber = `ADJ-${String(lastNumber + 1).padStart(6, '0')}`;
    
    // جلب المخزون الحالي للمنتجات
    const productIds = items.map((i: any) => i.productId);
    const inventory = await db.inventory.findMany({
      where: { 
        branchId,
        productId: { in: productIds }
      }
    });
    const inventoryMap = new Map(inventory.map(i => [i.productId, i]));
    
    // تحضير عناصر التسوية
    const itemsData = items.map((item: any) => {
      const inv = inventoryMap.get(item.productId);
      const previousQty = inv?.quantity || 0;
      const adjustmentQty = item.adjustmentQty;
      const newQty = previousQty + adjustmentQty;
      
      return {
        productId: item.productId,
        variationId: item.variationId,
        previousQty,
        adjustmentQty,
        newQty,
        unitCost: item.unitCost || 0,
        adjustmentValue: adjustmentQty * (item.unitCost || 0),
        notes: item.notes
      };
    });
    
    const totalItems = itemsData.length;
    const totalValue = itemsData.reduce((sum: number, item: any) => sum + Math.abs(item.adjustmentValue), 0);
    
    const adjustment = await db.inventoryAdjustment.create({
      data: {
        adjustmentNumber,
        branchId,
        reason,
        reference,
        notes,
        totalItems,
        totalValue,
        createdBy: createdBy || 'system',
        status: 'PENDING',
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
    
    return NextResponse.json({ adjustment }, { status: 201 });
  } catch (error: any) {
    console.error('Create inventory adjustment error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء التسوية' }, { status: 500 });
  }
}
