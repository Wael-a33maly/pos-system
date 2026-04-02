import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب عرض واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, nameAr: true, barcode: true, sellingPrice: true }
            }
          }
        },
        usages: {
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true, totalAmount: true, createdAt: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { usages: true }
        }
      },
    });
    
    if (!offer) {
      return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 });
    }
    
    // تحويل JSON strings إلى arrays
    const enrichedOffer = {
      ...offer,
      productIds: offer.productIds ? JSON.parse(offer.productIds) : null,
      categoryIds: offer.categoryIds ? JSON.parse(offer.categoryIds) : null,
      brandIds: offer.brandIds ? JSON.parse(offer.brandIds) : null,
      branchIds: offer.branchIds ? JSON.parse(offer.branchIds) : null,
      tierIds: offer.tierIds ? JSON.parse(offer.tierIds) : null,
      activeDays: offer.activeDays ? JSON.parse(offer.activeDays) : null,
    };
    
    return NextResponse.json({ offer: enrichedOffer });
  } catch (error) {
    console.error('Get offer error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT - تحديث العرض
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingOffer = await db.offer.findUnique({ where: { id } });
    
    if (!existingOffer) {
      return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 });
    }
    
    // التحقق من عدم تكرار الكود إذا تم تغييره
    if (body.code && body.code !== existingOffer.code) {
      const codeExists = await db.offer.findUnique({ where: { code: body.code } });
      if (codeExists) {
        return NextResponse.json({ error: 'كود الخصم مستخدم بالفعل' }, { status: 400 });
      }
    }
    
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
    
    // تحديث العرض
    const offer = await db.offer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(description !== undefined && { description }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(type !== undefined && { type }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(minPurchase !== undefined && { minPurchase: minPurchase ? parseFloat(minPurchase) : null }),
        ...(minQuantity !== undefined && { minQuantity: minQuantity ? parseInt(minQuantity) : null }),
        ...(maxUses !== undefined && { maxUses: maxUses ? parseInt(maxUses) : null }),
        ...(maxUsesPerUser !== undefined && { maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : null }),
        ...(appliesTo !== undefined && { appliesTo }),
        ...(productIds !== undefined && { productIds: productIds ? JSON.stringify(productIds) : null }),
        ...(categoryIds !== undefined && { categoryIds: categoryIds ? JSON.stringify(categoryIds) : null }),
        ...(brandIds !== undefined && { brandIds: brandIds ? JSON.stringify(brandIds) : null }),
        ...(branchIds !== undefined && { branchIds: branchIds ? JSON.stringify(branchIds) : null }),
        ...(priority !== undefined && { priority: parseInt(priority) || 0 }),
        ...(isCombinable !== undefined && { isCombinable }),
        ...(targetCustomers !== undefined && { targetCustomers }),
        ...(tierIds !== undefined && { tierIds: tierIds ? JSON.stringify(tierIds) : null }),
        ...(activeDays !== undefined && { activeDays: activeDays ? JSON.stringify(activeDays) : null }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(isActive !== undefined && { isActive }),
        ...(isAutoApplied !== undefined && { isAutoApplied }),
        ...(code !== undefined && { code: code || null }),
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
    
    // تحديث عناصر العرض إذا تم تمريرها
    if (items !== undefined) {
      // حذف العناصر القديمة
      await db.offerItem.deleteMany({ where: { offerId: id } });
      
      // إضافة العناصر الجديدة
      if (items && items.length > 0) {
        await db.offerItem.createMany({
          data: items.map((item: any) => ({
            offerId: id,
            productId: item.productId,
            variationId: item.variationId || null,
            discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
            discountType: item.discountType || null,
            requiredQty: item.requiredQty || 1,
            freeQty: item.freeQty || 0,
            freeProductId: item.freeProductId || null,
            freeVariationId: item.freeVariationId || null,
          }))
        });
      }
      
      // جلب العرض المحدث مع العناصر الجديدة
      const updatedOffer = await db.offer.findUnique({
        where: { id },
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
      
      return NextResponse.json({ offer: updatedOffer });
    }
    
    return NextResponse.json({ offer });
  } catch (error: any) {
    console.error('Update offer error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء التحديث' }, { status: 500 });
  }
}

// DELETE - حذف العرض
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const offer = await db.offer.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } }
    });
    
    if (!offer) {
      return NextResponse.json({ error: 'العرض غير موجود' }, { status: 404 });
    }
    
    // التحقق من عدم وجود استخدامات
    if (offer._count.usages > 0) {
      // بدلاً من الحذف، نقوم بإلغاء تفعيل العرض
      await db.offer.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ 
        success: true, 
        message: 'تم إلغاء تفعيل العرض لوجود استخدامات سابقة' 
      });
    }
    
    // حذف العناصر أولاً
    await db.offerItem.deleteMany({ where: { offerId: id } });
    
    // حذف العرض
    await db.offer.delete({ where: { id } });
    
    return NextResponse.json({ success: true, message: 'تم حذف العرض بنجاح' });
  } catch (error) {
    console.error('Delete offer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
  }
}
