import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب تحويل واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const transfer = await db.stockTransfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, barcode: true, unit: true, costPrice: true }
            }
          }
        },
      },
    });
    
    if (!transfer) {
      return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
    }
    
    // جلب بيانات الفروع والمستخدمين
    const [branches, users] = await Promise.all([
      db.branch.findMany({ 
        where: { id: { in: [transfer.fromBranchId, transfer.toBranchId] } } 
      }),
      db.user.findMany({
        where: { 
          id: { in: [transfer.requestedBy, transfer.approvedBy, transfer.shippedBy, transfer.receivedBy].filter(Boolean) } 
        },
        select: { id: true, name: true }
      }),
    ]);
    
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    const enrichedTransfer = {
      ...transfer,
      fromBranch: branchMap[transfer.fromBranchId],
      toBranch: branchMap[transfer.toBranchId],
      requestedByUser: userMap[transfer.requestedBy],
      approvedByUser: transfer.approvedBy ? userMap[transfer.approvedBy] : undefined,
      shippedByUser: transfer.shippedBy ? userMap[transfer.shippedBy] : undefined,
      receivedByUser: transfer.receivedBy ? userMap[transfer.receivedBy] : undefined,
    };
    
    return NextResponse.json({ transfer: enrichedTransfer });
  } catch (error) {
    console.error('Get transfer error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث حالة التحويل
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, items, rejectionReason, cancellationReason, userId } = body;
    
    const transfer = await db.stockTransfer.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!transfer) {
      return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
    }
    
    const now = new Date();
    const updateData: any = { status };
    
    // تحديث التواريخ والمستخدمين حسب الحالة
    switch (status) {
      case 'APPROVED':
        updateData.approvedAt = now;
        updateData.approvedBy = userId;
        break;
      case 'REJECTED':
        updateData.rejectionReason = rejectionReason;
        break;
      case 'IN_TRANSIT':
        updateData.shippedAt = now;
        updateData.shippedBy = userId;
        break;
      case 'RECEIVED':
        updateData.receivedAt = now;
        updateData.receivedBy = userId;
        // تحديث المخزون
        if (items) {
          for (const item of items) {
            // تحديث الكمية المستلمة
            await db.stockTransferItem.update({
              where: { id: item.id },
              data: { 
                receivedQty: item.receivedQty,
                discrepancyQty: item.discrepancyQty,
                discrepancyReason: item.discrepancyReason
              }
            });
            
            // تحديث المخزون في الفرع المستلم
            const inventory = await db.inventory.findFirst({
              where: { 
                productId: item.productId, 
                branchId: transfer.toBranchId 
              }
            });
            
            if (inventory) {
              await db.inventory.update({
                where: { id: inventory.id },
                data: { quantity: { increment: item.receivedQty } }
              });
            } else {
              await db.inventory.create({
                data: {
                  productId: item.productId,
                  branchId: transfer.toBranchId,
                  quantity: item.receivedQty
                }
              });
            }
            
            // خصم من الفرغ المرسل
            const fromInventory = await db.inventory.findFirst({
              where: { 
                productId: item.productId, 
                branchId: transfer.fromBranchId 
              }
            });
            
            if (fromInventory) {
              await db.inventory.update({
                where: { id: fromInventory.id },
                data: { quantity: { decrement: item.receivedQty } }
              });
            }
          }
        }
        break;
      case 'PARTIAL':
        updateData.receivedAt = now;
        updateData.receivedBy = userId;
        break;
      case 'CANCELLED':
        updateData.cancellationReason = cancellationReason;
        break;
    }
    
    const updatedTransfer = await db.stockTransfer.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });
    
    return NextResponse.json({ transfer: updatedTransfer });
  } catch (error) {
    console.error('Update transfer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
  }
}

// DELETE - حذف التحويل (فقط إذا كان قيد الانتظار)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const transfer = await db.stockTransfer.findUnique({
      where: { id }
    });
    
    if (!transfer) {
      return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
    }
    
    if (transfer.status !== 'PENDING') {
      return NextResponse.json({ error: 'لا يمكن حذف تحويل غير قيد الانتظار' }, { status: 400 });
    }
    
    await db.stockTransfer.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transfer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
  }
}
