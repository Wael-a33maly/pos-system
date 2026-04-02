import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب تفاصيل مرتجع
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const returnRequest = await db.returnRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
            variant: true,
          },
        },
        originalInvoice: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
            customer: true,
            user: true,
            payments: {
              include: {
                paymentMethod: true,
              },
            },
          },
        },
        customer: true,
        branch: true,
        user: true,
        processedByUser: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ returnRequest });
  } catch (error) {
    console.error('Get return details error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تفاصيل المرتجع' }, { status: 500 });
  }
}

// PUT - تحديث حالة المرتجع (موافقة/رفض)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingReturn = await db.returnRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
    }

    // إذا كانت الحالة الحالية ليست PENDING، لا يمكن تعديلها
    if (existingReturn.status !== 'PENDING' && body.status) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل مرتجع تمت معالجته' },
        { status: 400 }
      );
    }

    // تحديث المرتجع
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
      updateData.processedBy = body.processedBy;
      updateData.processedAt = new Date();
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const updatedReturn = await db.returnRequest.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        originalInvoice: true,
        customer: true,
        branch: true,
        user: true,
        processedByUser: true,
      },
    });

    // إذا تمت الموافقة، نقوم بتحديث المخزون
    if (body.status === 'APPROVED' || body.status === 'COMPLETED') {
      for (const item of existingReturn.items) {
        if (item.productId) {
          // تحديث المخزون
          const inventory = await db.inventory.findFirst({
            where: {
              productId: item.productId,
              branchId: existingReturn.branchId,
            },
          });

          if (inventory) {
            await db.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }
        }
      }
    }

    // إذا تم الإكتمال مع استرداد نقدي، يمكن إنشاء فاتورة مرتجع
    if (body.status === 'COMPLETED') {
      // تحديث حالة الفاتورة الأصلية إذا لزم الأمر
      const originalInvoice = await db.invoice.findUnique({
        where: { id: existingReturn.originalInvoiceId },
        include: { items: true },
      });

      if (originalInvoice) {
        // التحقق من ما إذا كان كل المنتجات تم إرجاعها
        // هذا تبسيط - في الواقع يجب التحقق من الكميات
        const totalReturned = await db.returnRequest.aggregate({
          where: {
            originalInvoiceId: existingReturn.originalInvoiceId,
            status: { in: ['APPROVED', 'COMPLETED'] },
          },
          _sum: { totalAmount: true },
        });

        if (totalReturned._sum.totalAmount && 
            totalReturned._sum.totalAmount >= originalInvoice.totalAmount) {
          await db.invoice.update({
            where: { id: existingReturn.originalInvoiceId },
            data: { status: 'RETURNED' },
          });
        }
      }
    }

    return NextResponse.json({ returnRequest: updatedReturn });
  } catch (error) {
    console.error('Update return error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المرتجع' }, { status: 500 });
  }
}

// DELETE - حذف مرتجع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingReturn = await db.returnRequest.findUnique({
      where: { id },
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
    }

    // لا يمكن حذف مرتجع تمت معالجته
    if (existingReturn.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'لا يمكن حذف مرتجع تمت معالجته' },
        { status: 400 }
      );
    }

    await db.returnRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف المرتجع بنجاح' });
  } catch (error) {
    console.error('Delete return error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المرتجع' }, { status: 500 });
  }
}
