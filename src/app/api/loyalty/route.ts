import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب بيانات نظام الولاء
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const customerId = searchParams.get('customerId');
    
    // جلب إعدادات الولاء
    if (action === 'settings') {
      let settings = await db.loyaltySetting.findFirst();
      if (!settings) {
        settings = await db.loyaltySetting.create({
          data: {
            isEnabled: false,
            pointsPerCurrency: 1,
            currencyPerPoint: 0.1,
            minRedeemPoints: 100,
            maxRedeemPercent: 50,
            pointsValidityDays: 365,
          }
        });
      }
      return NextResponse.json({ settings });
    }
    
    // جلب مستويات الولاء
    if (action === 'tiers') {
      const tiers = await db.loyaltyTier.findMany({
        where: { isActive: true },
        orderBy: { level: 'asc' },
        include: {
          _count: { select: { customers: true } }
        }
      });
      return NextResponse.json({ tiers });
    }
    
    // جلب نقاط عميل محدد
    if (customerId) {
      let loyalty = await db.customerLoyalty.findUnique({
        where: { customerId },
        include: {
          tier: true,
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      
      if (!loyalty) {
        // إنشاء سجل ولاء جديد
        const settings = await db.loyaltySetting.findFirst();
        const welcomeBonus = settings?.welcomeBonusPoints || 0;
        loyalty = await db.customerLoyalty.create({
          data: {
            customerId,
            totalPoints: welcomeBonus,
            availablePoints: welcomeBonus,
          },
          include: { tier: true, transactions: true }
        });
        
        // إنشاء معاملة نقاط الترحيب إن وجدت
        if (welcomeBonus > 0) {
          await db.loyaltyTransaction.create({
            data: {
              customerId: loyalty.id,
              type: 'BONUS',
              points: welcomeBonus,
              balanceBefore: 0,
              balanceAfter: welcomeBonus,
              description: 'نقاط ترحيبية'
            }
          });
        }
      }
      
      return NextResponse.json({ loyalty });
    }
    
    // جلب إحصائيات الولاء
    if (action === 'stats') {
      const [totalMembers, activeMembers, totalPointsIssued, totalPointsRedeemed, tiers] = await Promise.all([
        db.customerLoyalty.count(),
        db.customerLoyalty.count({ where: { totalPoints: { gt: 0 } } }),
        db.loyaltyTransaction.aggregate({
          where: { type: 'EARN' },
          _sum: { points: true }
        }),
        db.loyaltyTransaction.aggregate({
          where: { type: 'REDEEM' },
          _sum: { points: true }
        }),
        db.loyaltyTier.findMany({
          include: { _count: { select: { customers: true } } }
        })
      ]);
      
      return NextResponse.json({
        stats: {
          totalMembers,
          activeMembers,
          totalPointsIssued: totalPointsIssued._sum.points || 0,
          totalPointsRedeemed: totalPointsRedeemed._sum.points || 0,
          tierDistribution: tiers.map(t => ({
            tier: t,
            count: t._count.customers
          }))
        }
      });
    }
    
    // جلب جميع سجلات الولاء
    const loyalties = await db.customerLoyalty.findMany({
      include: {
        customer: true,
        tier: true
      },
      orderBy: { totalPoints: 'desc' }
    });
    
    return NextResponse.json({ loyalties });
  } catch (error) {
    console.error('Get loyalty error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - إجراءات الولاء
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    // تحديث الإعدادات
    if (action === 'updateSettings') {
      const settings = await db.loyaltySetting.upsert({
        where: { id: data.id || 'default' },
        update: data,
        create: data
      });
      return NextResponse.json({ settings });
    }
    
    // إنشاء مستوى جديد
    if (action === 'createTier') {
      const tier = await db.loyaltyTier.create({
        data: {
          name: data.name,
          nameAr: data.nameAr,
          level: data.level,
          minPoints: data.minPoints,
          maxPoints: data.maxPoints,
          discountPercent: data.discountPercent,
          pointsMultiplier: data.pointsMultiplier,
          freeShipping: data.freeShipping,
          specialOffers: data.specialOffers,
          color: data.color,
          icon: data.icon,
        }
      });
      return NextResponse.json({ tier }, { status: 201 });
    }
    
    // كسب نقاط
    if (action === 'earnPoints') {
      const { customerId, points, invoiceId, description } = data;
      
      const loyalty = await db.customerLoyalty.findUnique({
        where: { customerId }
      });
      
      if (!loyalty) {
        return NextResponse.json({ error: 'سجل الولاء غير موجود' }, { status: 404 });
      }
      
      const settings = await db.loyaltySetting.findFirst();
      const expiresAt = settings?.pointsValidityDays 
        ? new Date(Date.now() + settings.pointsValidityDays * 24 * 60 * 60 * 1000)
        : null;
      
      // إنشاء معاملة
      const transaction = await db.loyaltyTransaction.create({
        data: {
          customerId,
          invoiceId,
          type: 'EARN',
          points,
          balanceBefore: loyalty.availablePoints,
          balanceAfter: loyalty.availablePoints + points,
          description,
          expiresAt
        }
      });
      
      // تحديث رصيد النقاط
      const updatedLoyalty = await db.customerLoyalty.update({
        where: { customerId },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
          totalPurchases: { increment: data.purchaseAmount || 0 },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date()
        },
        include: { tier: true }
      });
      
      // التحقق من ترقية المستوى
      await updateCustomerTier(customerId);
      
      return NextResponse.json({ loyalty: updatedLoyalty, transaction });
    }
    
    // استبدال نقاط
    if (action === 'redeemPoints') {
      const { customerId, points, invoiceId } = data;
      
      const loyalty = await db.customerLoyalty.findUnique({
        where: { customerId }
      });
      
      if (!loyalty || loyalty.availablePoints < points) {
        return NextResponse.json({ error: 'نقاط غير كافية' }, { status: 400 });
      }
      
      const settings = await db.loyaltySetting.findFirst();
      if (settings && points < settings.minRedeemPoints) {
        return NextResponse.json({ 
          error: `الحد الأدنى للاستبدال ${settings.minRedeemPoints} نقطة` 
        }, { status: 400 });
      }
      
      // إنشاء معاملة
      const transaction = await db.loyaltyTransaction.create({
        data: {
          customerId,
          invoiceId,
          type: 'REDEEM',
          points: -points,
          balanceBefore: loyalty.availablePoints,
          balanceAfter: loyalty.availablePoints - points,
          description: 'استبدال نقاط'
        }
      });
      
      // تحديث الرصيد
      const updatedLoyalty = await db.customerLoyalty.update({
        where: { customerId },
        data: {
          availablePoints: { decrement: points },
          usedPoints: { increment: points }
        },
        include: { tier: true }
      });
      
      return NextResponse.json({ loyalty: updatedLoyalty, transaction });
    }
    
    // تعديل نقاط يدوياً
    if (action === 'adjustPoints') {
      const { customerId, points, description } = data;
      
      const loyalty = await db.customerLoyalty.findUnique({
        where: { customerId }
      });
      
      if (!loyalty) {
        return NextResponse.json({ error: 'سجل الولاء غير موجود' }, { status: 404 });
      }
      
      const transaction = await db.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'ADJUST',
          points,
          balanceBefore: loyalty.availablePoints,
          balanceAfter: loyalty.availablePoints + points,
          description
        }
      });
      
      const updatedLoyalty = await db.customerLoyalty.update({
        where: { customerId },
        data: {
          totalPoints: points > 0 ? { increment: points } : undefined,
          availablePoints: { increment: points }
        }
      });
      
      return NextResponse.json({ loyalty: updatedLoyalty, transaction });
    }
    
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Loyalty action error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// Helper function: تحديث مستوى العميل
async function updateCustomerTier(customerId: string) {
  const loyalty = await db.customerLoyalty.findUnique({
    where: { customerId }
  });
  
  if (!loyalty) return;
  
  // إيجاد المستوى المناسب
  const appropriateTier = await db.loyaltyTier.findFirst({
    where: {
      isActive: true,
      minPoints: { lte: loyalty.totalPoints },
      OR: [
        { maxPoints: null },
        { maxPoints: { gte: loyalty.totalPoints } }
      ]
    },
    orderBy: { level: 'desc' }
  });
  
  if (appropriateTier && appropriateTier.id !== loyalty.tierId) {
    await db.customerLoyalty.update({
      where: { customerId },
      data: { tierId: appropriateTier.id }
    });
  }
}
