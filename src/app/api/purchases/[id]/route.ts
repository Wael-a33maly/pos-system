import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب أمر شراء واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });
    
    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }
    
    // جلب بيانات المورد
    const supplier = await db.supplier.findUnique({
      where: { id: order.supplierId },
      select: { id: true, name: true, nameAr: true, phone: true, email: true, address: true }
    });
    
    const enrichedOrder = {
      ...order,
      supplier,
    };
    
    return NextResponse.json({ order: enrichedOrder });
  } catch (error) {
    console.error('Get purchase order error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث أمر الشراء
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      status, 
      items, 
      notes, 
      supplierNotes, 
      internalNotes,
      expectedDate,
      userId,
      approvedBy,
      receivedBy
    } = body;
    
    const order = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }
    
    const updateData: any = {};
    
    // تحديث الحالة
    if (status) {
      updateData.status = status;
      
      if (status === 'APPROVED') {
        updateData.approvedBy = userId || approvedBy;
      }
      
      if (status === 'RECEIVED') {
        updateData.receivedBy = userId || receivedBy;
        updateData.receivedDate = new Date();
      }
    }
    
    // تحديث الملاحظات
    if (notes !== undefined) updateData.notes = notes;
    if (supplierNotes !== undefined) updateData.supplierNotes = supplierNotes;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;
    
    // تحديث العناصر
    if (items && items.length > 0) {
      // حذف العناصر القديمة
      await db.purchaseOrderItem.deleteMany({
        where: { orderId: id }
      });
      
      // حساب الإجماليات الجديدة
      let subtotal = 0;
      let taxAmount = 0;
      let totalAmount = 0;
      
      const newItems = items.map((item: any) => {
        const itemSubtotal = item.orderedQty * item.unitCost;
        const itemTaxAmount = itemSubtotal * (item.taxRate || 0) / 100;
        const itemDiscountAmount = itemSubtotal * (item.discountPercent || 0) / 100;
        const itemTotal = itemSubtotal + itemTaxAmount - itemDiscountAmount;
        
        subtotal += itemSubtotal;
        taxAmount += itemTaxAmount;
        totalAmount += itemTotal;
        
        return {
          orderId: id,
          productId: item.productId,
          variationId: item.variationId,
          productName: item.productName,
          productBarcode: item.productBarcode,
          sku: item.sku,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty || 0,
          pendingQty: item.orderedQty - (item.receivedQty || 0),
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
      
      // إنشاء العناصر الجديدة
      await db.purchaseOrderItem.createMany({
        data: newItems
      });
      
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
    }
    
    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { items: true, payments: true }
    });
    
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update purchase order error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
  }
}

// DELETE - حذف أمر الشراء
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await db.purchaseOrder.findUnique({
      where: { id }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }
    
    // يمكن حذف المسودات فقط
    if (order.status !== 'DRAFT') {
      return NextResponse.json({ error: 'لا يمكن حذف أمر شراء غير مسودة' }, { status: 400 });
    }
    
    // حذف العناصر أولاً
    await db.purchaseOrderItem.deleteMany({
      where: { orderId: id }
    });
    
    // حذف المدفوعات
    await db.purchasePayment.deleteMany({
      where: { orderId: id }
    });
    
    // حذف الأمر
    await db.purchaseOrder.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
  }
}
