// ============================================
// Inventory Count [id] API - API جرد المخزون الفردي
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب عملية جرد واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const count = await db.inventoryCount.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                nameAr: true,
                barcode: true,
                unit: true,
                costPrice: true
              }
            }
          },
          orderBy: { product: { name: 'asc' } }
        }
      }
    });
    
    if (!count) {
      return NextResponse.json({ error: 'عملية الجرد غير موجودة' }, { status: 404 });
    }
    
    // جلب بيانات الفرع
    const branch = await db.branch.findUnique({
      where: { id: count.branchId },
      select: { id: true, name: true, nameAr: true }
    });
    
    return NextResponse.json({ 
      count: {
        ...count,
        branch
      }
    });
  } catch (error) {
    console.error('Get inventory count error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب عملية الجرد' }, { status: 500 });
  }
}

// PUT - تحديث عملية جرد
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      status, 
      notes, 
      approvalNotes,
      items,
      userId 
    } = body;
    
    // التحقق من وجود الجرد
    const existingCount = await db.inventoryCount.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!existingCount) {
      return NextResponse.json({ error: 'عملية الجرد غير موجودة' }, { status: 404 });
    }
    
    // لا يمكن تعديل جرد مكتمل أو ملغي
    if (existingCount.status === 'COMPLETED' || existingCount.status === 'CANCELLED') {
      return NextResponse.json({ error: 'لا يمكن تعديل جرد مكتمل أو ملغي' }, { status: 400 });
    }
    
    // تحديث عناصر الجرد إذا تم توفيرها
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id && item.countedQty !== undefined) {
          const systemQty = existingCount.items.find(i => i.id === item.id)?.systemQty || 0;
          const discrepancyQty = item.countedQty - systemQty;
          const unitCost = existingCount.items.find(i => i.id === item.id)?.unitCost || 0;
          
          await db.inventoryCountItem.update({
            where: { id: item.id },
            data: {
              countedQty: item.countedQty,
              discrepancyQty,
              discrepancyValue: discrepancyQty * unitCost,
              status: 'COUNTED',
              countedBy: userId || 'system',
              countedAt: new Date(),
              notes: item.notes
            }
          });
        }
      }
    }
    
    // تحديث حالة الجرد
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // تحديث التواريخ حسب الحالة
      if (status === 'IN_PROGRESS' && !existingCount.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = userId || 'system';
      }
      if (status === 'APPROVED') {
        updateData.approvedBy = userId || 'system';
        if (approvalNotes) updateData.approvalNotes = approvalNotes;
      }
    }
    
    if (notes !== undefined) updateData.notes = notes;
    if (approvalNotes !== undefined) updateData.approvalNotes = approvalNotes;
    
    // حساب الملخص
    const updatedItems = await db.inventoryCountItem.findMany({
      where: { countId: id }
    });
    
    updateData.countedItems = updatedItems.filter(i => i.status !== 'PENDING').length;
    updateData.discrepancyItems = updatedItems.filter(i => i.discrepancyQty !== 0).length;
    updateData.discrepancyValue = updatedItems.reduce((sum, i) => sum + i.discrepancyValue, 0);
    
    const count = await db.inventoryCount.update({
      where: { id },
      data: updateData,
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
    
    // إذا كانت الحالة APPROVED وكان هناك فروقات، إنشاء تسوية مخزون
    if (status === 'APPROVED' && updateData.discrepancyValue !== 0) {
      // توليد رقم التسوية
      const lastAdjustment = await db.inventoryAdjustment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { adjustmentNumber: true }
      });
      
      const lastAdjNumber = lastAdjustment 
        ? parseInt(lastAdjustment.adjustmentNumber.replace('ADJ-', '')) || 0 
        : 0;
      const adjustmentNumber = `ADJ-${String(lastAdjNumber + 1).padStart(6, '0')}`;
      
      // جلب الفروقات
      const discrepancyItems = updatedItems.filter(i => i.discrepancyQty !== 0);
      
      // إنشاء التسوية
      await db.inventoryAdjustment.create({
        data: {
          adjustmentNumber,
          branchId: existingCount.branchId,
          reason: 'INVENTORY_COUNT',
          reference: existingCount.countNumber,
          notes: `تسوية من عملية جرد رقم ${existingCount.countNumber}`,
          totalItems: discrepancyItems.length,
          totalValue: Math.abs(updateData.discrepancyValue),
          createdBy: userId || 'system',
          status: 'PENDING',
          items: {
            create: discrepancyItems.map(item => ({
              productId: item.productId,
              variationId: item.variationId,
              previousQty: item.systemQty,
              adjustmentQty: item.discrepancyQty || 0,
              newQty: item.countedQty || 0,
              unitCost: item.unitCost,
              adjustmentValue: item.discrepancyValue
            }))
          }
        }
      });
    }
    
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Update inventory count error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث عملية الجرد' }, { status: 500 });
  }
}

// DELETE - حذف عملية جرد (مسودة فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // التحقق من وجود الجرد وحالته
    const existingCount = await db.inventoryCount.findUnique({
      where: { id }
    });
    
    if (!existingCount) {
      return NextResponse.json({ error: 'عملية الجرد غير موجودة' }, { status: 404 });
    }
    
    // لا يمكن حذف جرد بدأ العد فيه
    if (existingCount.status !== 'DRAFT') {
      return NextResponse.json({ error: 'لا يمكن حذف جرد إلا إذا كان في حالة مسودة' }, { status: 400 });
    }
    
    // حذف عناصر الجرد ثم الجرد
    await db.inventoryCountItem.deleteMany({
      where: { countId: id }
    });
    
    await db.inventoryCount.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete inventory count error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف عملية الجرد' }, { status: 500 });
  }
}
