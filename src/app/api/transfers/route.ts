import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع التحويلات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    
    const where: any = {};
    if (status) where.status = status;
    if (branchId) {
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId }
      ];
    }
    
    const transfers = await db.stockTransfer.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, barcode: true, unit: true }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // جلب بيانات الفروع والمستخدمين
    const branchIds = [...new Set(transfers.flatMap(t => [t.fromBranchId, t.toBranchId]))];
    const userIds = [...new Set(transfers.map(t => t.requestedBy).filter(Boolean))];
    
    const [branches, users] = await Promise.all([
      db.branch.findMany({ where: { id: { in: branchIds } } }),
      db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
    ]);
    
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    const enrichedTransfers = transfers.map(t => ({
      ...t,
      fromBranch: branchMap[t.fromBranchId],
      toBranch: branchMap[t.toBranchId],
      requestedByUser: userMap[t.requestedBy],
    }));
    
    return NextResponse.json({ transfers: enrichedTransfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التحويلات' }, { status: 500 });
  }
}

// POST - إنشاء تحويل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toBranchId, notes, items, fromBranchId, requestedBy } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'يجب إضافة منتجات للتحويل' }, { status: 400 });
    }
    
    // توليد رقم التحويل
    const lastTransfer = await db.stockTransfer.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transferNumber: true }
    });
    
    const lastNumber = lastTransfer 
      ? parseInt(lastTransfer.transferNumber.replace('TR-', '')) || 0 
      : 0;
    const transferNumber = `TR-${String(lastNumber + 1).padStart(6, '0')}`;
    
    // حساب الإجماليات
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum: number, item: any) => sum + item.requestedQty, 0);
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.requestedQty * item.unitCost), 0);
    
    const transfer = await db.stockTransfer.create({
      data: {
        transferNumber,
        fromBranchId,
        toBranchId,
        notes,
        totalItems,
        totalQuantity,
        totalValue,
        requestedBy,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variationId: item.variationId,
            requestedQty: item.requestedQty,
            unitCost: item.unitCost,
            totalCost: item.requestedQty * item.unitCost,
            notes: item.notes,
          }))
        }
      },
      include: { items: true }
    });
    
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error: any) {
    console.error('Create transfer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء التحويل' }, { status: 500 });
  }
}
