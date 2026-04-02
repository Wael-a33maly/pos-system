import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole, ClosureType } from '@prisma/client';

/**
 * POST /api/shifts/force-close
 * إغلاق وردية إجباري (للسوبر أدمن ومدير الفرع)
 * 
 * Body:
 * - shiftId: معرف الوردية
 * - reason: سبب الإغلاق الإجباري
 * - actualCash: المبلغ الفعلي (اختياري)
 * - revokeSession: إلغاء جلسة المستخدم (افتراضي true)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { shiftId, reason, actualCash, revokeSession = true } = body;

    // التحقق من البيانات المطلوبة
    if (!shiftId) {
      return NextResponse.json({ error: 'معرف الوردية مطلوب' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'يجب إدخال سبب للإغلاق الإجباري' }, { status: 400 });
    }

    // التحقق من الصلاحيات
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'ليس لديك صلاحية الإغلاق الإجباري' }, { status: 403 });
    }

    // جلب الوردية
    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: { select: { id: true, name: true, email: true, branchId: true } },
        branch: { select: { id: true, name: true } },
        invoices: {
          where: { status: 'COMPLETED' },
          include: { payments: { include: { paymentMethod: true } } }
        },
        expenses: true
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'الوردية غير موجودة' }, { status: 404 });
    }

    if (shift.status === 'CLOSED' || shift.status === 'FORCE_CLOSED') {
      return NextResponse.json({ error: 'الوردية مغلقة بالفعل' }, { status: 400 });
    }

    // التحقق من أن مدير الفرع يغلق وردية في فرعه فقط
    if (user.role === 'BRANCH_ADMIN' && user.branchId !== shift.branchId) {
      return NextResponse.json({ error: 'يمكنك إغلاق ورديات فرعك فقط' }, { status: 403 });
    }

    // حساب الإحصائيات المالية
    const completedInvoices = shift.invoices.filter(i => !i.isReturn);
    const returnInvoices = shift.invoices.filter(i => i.isReturn);

    const paymentBreakdown: Record<string, number> = {};
    completedInvoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod.code;
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + payment.amount;
      });
    });

    const totalSales = completedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalReturns = returnInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalExpenses = shift.expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashSales = paymentBreakdown['cash'] || 0;
    const expectedCash = shift.openingCash + cashSales - totalExpenses;
    const finalActualCash = actualCash ?? expectedCash;
    const difference = finalActualCash - expectedCash;

    // تحديث حالة الوردية
    const updatedShift = await db.shift.update({
      where: { id: shiftId },
      data: {
        status: 'FORCE_CLOSED',
        closureType: ClosureType.FORCED,
        endTime: new Date(),
        closingCash: finalActualCash,
        expectedCash,
        totalSales,
        totalReturns,
        totalExpenses,
        closedBy: user.id,
        closedAt: new Date(),
        closureReason: reason,
        forceClosedBy: user.id,
        forceCloseRole: user.role,
        sessionRevoked: revokeSession
      }
    });

    // إنشاء سجل الإغلاق
    await db.shiftClosure.create({
      data: {
        shiftId,
        closedBy: user.id,
        closedByRole: user.role as UserRole,
        closedByName: user.name,
        affectedUserId: shift.userId,
        affectedUserName: shift.user.name,
        branchId: shift.branchId,
        branchName: shift.branch.name,
        closureType: ClosureType.FORCED,
        closureReason: reason,
        totalSales,
        totalReturns,
        totalExpenses,
        expectedCash,
        actualCash: finalActualCash,
        difference,
        sessionRevoked: revokeSession,
        notificationsSent: true
      }
    });

    // إلغاء جلسة المستخدم إذا طُلب
    let sessionRevoked = false;
    if (revokeSession) {
      const revokeResult = await db.userSession.updateMany({
        where: {
          userId: shift.userId,
          isActive: true
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: user.id,
          revokeReason: `إغلاق وردية إجباري: ${reason}`
        }
      });
      sessionRevoked = revokeResult.count > 0;
    }

    // إنشاء إشعار للمستخدم المتأثر
    await db.notification.create({
      data: {
        userId: shift.userId,
        title: 'تم إغلاق ورديتك إجبارياً',
        titleAr: 'تم إغلاق ورديتك إجبارياً',
        message: `تم إغلاق ورديتك إجبارياً بواسطة ${user.name} (${getRoleName(user.role)}). السبب: ${reason}`,
        messageAr: `تم إغلاق ورديتك إجبارياً بواسطة ${user.name} (${getRoleName(user.role)}). السبب: ${reason}`,
        type: 'SHIFT_FORCE_CLOSE',
        link: '/shifts'
      }
    });

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORCE_CLOSE_SHIFT',
        module: 'shifts',
        recordId: shiftId,
        branchId: shift.branchId,
        targetUserId: shift.userId,
        newData: JSON.stringify({
          shiftId,
          reason,
          closedBy: user.name,
          closedByRole: user.role,
          affectedUser: shift.user.name,
          sessionRevoked
        }),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إغلاق الوردية إجبارياً بنجاح',
      data: {
        shiftId: updatedShift.id,
        status: updatedShift.status,
        closedAt: updatedShift.endTime,
        closedBy: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        affectedUser: {
          id: shift.user.id,
          name: shift.user.name
        },
        sessionRevoked,
        financial: {
          expectedCash,
          actualCash: finalActualCash,
          difference,
          totalSales,
          totalReturns,
          totalExpenses
        }
      }
    });

  } catch (error) {
    console.error('Force close shift error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    'SUPER_ADMIN': 'مدير النظام',
    'BRANCH_ADMIN': 'مدير الفرع',
    'USER': 'مستخدم'
  };
  return roles[role] || role;
}
