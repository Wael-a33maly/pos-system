import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع أوامر الشراء
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }
    
    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        items: {
          include: {
            order: {
              select: { orderNumber: true }
            }
          }
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // جلب بيانات الموردين
    const supplierIds = [...new Set(orders.map(o => o.supplierId))];
    const suppliers = await db.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true, nameAr: true, phone: true }
    });
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));
    
    const enrichedOrders = orders.map(order => ({
      ...order,
      supplier: supplierMap[order.supplierId],
    }));
    
    return NextResponse.json({ orders: enrichedOrders });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب أوامر الشراء' }, { status: 500 });
  }
}

// POST - إنشاء أمر شراء جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      supplierId, 
      branchId, 
      expectedDate, 
      notes, 
      supplierNotes, 
      internalNotes,
      items,
      createdBy 
    } = body;
    
    if (!supplierId) {
      return NextResponse.json({ error: 'يجب اختيار المورد' }, { status: 400 });
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'يجب إضافة منتجات للأمر' }, { status: 400 });
    }
    
    // توليد رقم الأمر
    const lastOrder = await db.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    });
    
    const lastNumber = lastOrder 
      ? parseInt(lastOrder.orderNumber.replace('PO-', '')) || 0 
      : 0;
    const orderNumber = `PO-${String(lastNumber + 1).padStart(6, '0')}`;
    
    // حساب الإجماليات
    let subtotal = 0;
    let taxAmount = 0;
    let totalAmount = 0;
    
    const orderItems = items.map((item: any) => {
      const itemSubtotal = item.orderedQty * item.unitCost;
      const itemTaxAmount = itemSubtotal * (item.taxRate || 0) / 100;
      const itemDiscountAmount = itemSubtotal * (item.discountPercent || 0) / 100;
      const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;
      
      subtotal += itemSubtotal;
      taxAmount += itemTaxAmount;
      totalAmount += itemTotal;
      
      return {
        productId: item.productId,
        variationId: item.variationId,
        productName: item.productName,
        productBarcode: item.productBarcode,
        sku: item.sku,
        orderedQty: item.orderedQty,
        receivedQty: 0,
        pendingQty: item.orderedQty,
        unitCost: item.unitCost,
        subtotal: itemSubtotal,
        taxRate: item.taxRate || 0,
        taxAmount: itemTaxAmount,
        discountPercent: item.discountPercent || 0,
        totalAmount: itemTotal,
        expectedDate: item.expectedDate ? new Date(item.expectedDate) : null,
        notes: item.notes,
      };
    });
    
    const order = await db.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        branchId,
        status: 'DRAFT',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
        supplierNotes,
        internalNotes,
        createdBy: createdBy || 'system',
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    });
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء أمر الشراء' }, { status: 500 });
  }
}
