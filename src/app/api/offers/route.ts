import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب جميع العروض
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const where: any = {};
    
    // فلترة بالحالة
    if (status) {
      const now = new Date();
      if (status === 'active') {
        where.isActive = true;
        where.startDate = { lte: now };
        where.endDate = { gte: now };
      } else if (status === 'scheduled') {
        where.isActive = true;
        where.startDate = { gt: now };
      } else if (status === 'expired') {
        where.endDate = { lt: now };
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }
    
    // فلترة بالنوع
    if (type) {
      where.type = type;
    }
    
    // فلترة بالتاريخ
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { gte: new Date(startDate), lte: new Date(endDate) }
        },
        {
          endDate: { gte: new Date(startDate), lte: new Date(endDate) }
        },
        {
          startDate: { lte: new Date(startDate) },
          endDate: { gte: new Date(endDate) }
        }
      ];
    }
    
    const offers = await db.offer.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, nameAr: true, barcode: true }
            }
          }
        },
        usages: {
          select: { id: true, discountAmount: true, createdAt: true },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // حساب الإحصائيات
    const now = new Date();
    const stats = {
      totalOffers: offers.length,
      activeOffers: offers.filter(o => 
        o.isActive && o.startDate <= now && o.endDate >= now
      ).length,
      scheduledOffers: offers.filter(o => 
        o.isActive && o.startDate > now
      ).length,
      expiredOffers: offers.filter(o => 
        o.endDate < now
      ).length,
      totalUsages: offers.reduce((sum, o) => sum + o._count.usages, 0),
      totalDiscount: offers.reduce((sum, o) => 
        sum + o.usages.reduce((s, u) => s + u.discountAmount, 0), 0
      ),
    };
    
    return NextResponse.json({ offers, stats });
  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب العروض' }, { status: 500 });
  }
}

// POST - إنشاء عرض جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      nameAr,
      description,
      descriptionAr,
      type,
      discountType,
      discountValue,
      maxDiscount,
      startDate,
      endDate,
      minPurchase,
      minQuantity,
      maxUses,
      maxUsesPerUser,
      appliesTo,
      productIds,
      categoryIds,
      brandIds,
      branchIds,
      priority,
      isCombinable,
      targetCustomers,
      tierIds,
      activeDays,
      startTime,
      endTime,
      isActive,
      isAutoApplied,
      code,
      items,
    } = body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !type || !discountType || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
    }
    
    // التحقق من عدم تكرار الكود
    if (code) {
      const existingOffer = await db.offer.findUnique({ where: { code } });
      if (existingOffer) {
        return NextResponse.json({ error: 'كود الخصم مستخدم بالفعل' }, { status: 400 });
      }
    }
    
    // إنشاء العرض
    const offer = await db.offer.create({
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        type,
        discountType,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : null,
        appliesTo: appliesTo || 'ALL',
        productIds: productIds ? JSON.stringify(productIds) : null,
        categoryIds: categoryIds ? JSON.stringify(categoryIds) : null,
        brandIds: brandIds ? JSON.stringify(brandIds) : null,
        branchIds: branchIds ? JSON.stringify(branchIds) : null,
        priority: priority ? parseInt(priority) : 0,
        isCombinable: isCombinable || false,
        targetCustomers: targetCustomers || 'ALL',
        tierIds: tierIds ? JSON.stringify(tierIds) : null,
        activeDays: activeDays ? JSON.stringify(activeDays) : null,
        startTime,
        endTime,
        isActive: isActive !== undefined ? isActive : true,
        isAutoApplied: isAutoApplied !== undefined ? isAutoApplied : true,
        code: code || null,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            variationId: item.variationId || null,
            discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
            discountType: item.discountType || null,
            requiredQty: item.requiredQty || 1,
            freeQty: item.freeQty || 0,
            freeProductId: item.freeProductId || null,
            freeVariationId: item.freeVariationId || null,
          }))
        } : undefined,
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
    
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    console.error('Create offer error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء إنشاء العرض' }, { status: 500 });
  }
}
