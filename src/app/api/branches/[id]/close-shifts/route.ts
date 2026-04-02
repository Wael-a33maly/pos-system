import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole, ClosureType } from '@prisma/client';

/**
 * POST /api/branches/[id]/close-shifts
 * إغلاق جميع ورديات فرع معين (للسوبر أدمن ومدير الفرع)
 * 
 * Body:
 * - reason: سبب الإغلاق الإجباري
 * - revokeSessions: إلغاء جلسات جميع المستخدمين (افتراضي true)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: branchId } = await params;
    const body = await req.json();
    const { reason, revokeSessions = true } = body;

    // التحقق من البيانات المطلوبة
    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'يجب إدخال سبب للإغلاق الإجباري' }, { status: 400 });
    }

    // التحقق من الصلاحيات
    // السوبر أدمن يمكنه إغلاق أي فرع
    // مدير الفرع يمكنه إغلاق فرعه فقط
    if (user.role === 'BRANCH_ADMIN' && user.branchId !== branchId) {
      return NextResponse.json({ error: 'يمكنك إغلاق ورديات فرعك فقط' }, { status: 403 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') {
      return NextResponse.json({ error: 'ليس لديك صلاحية إغلاق ورديات الفرع' }, { status: 403 });
    }

    // جلب الفرع
    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, isActive: true }
    });

    if (!branch) {
      return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    }

    // جلب جميع الورديات المفتوحة في الفرع
    const openShifts = await db.shift.findMany({
      where: {
        branchId,
        status: 'OPEN'
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        invoices: {
          where: { status: 'COMPLETED' },
          include: { payments: { include: { paymentMethod: true } } }
        },
        expenses: true
      }
    });

    if (openShifts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد ورديات مفتوحة في هذا الفرع',
        data: { closedCount: 0 }
      });
    }

    // معالجة كل وردية
    const results = [];
    const affectedUserIds: string[] = [];

    for (const shift of openShifts) {
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

      // تحديث حالة الوردية
      const updatedShift = await db.shift.update({
        where: { id: shift.id },
        data: {
          status: 'FORCE_CLOSED',
          closureType: ClosureType.BRANCH_ALL,
          endTime: new Date(),
          closingCash: expectedCash,
          expectedCash,
          totalSales,
          totalReturns,
          totalExpenses,
          closedBy: user.id,
          closedAt: new Date(),
          closureReason: reason,
          forceClosedBy: user.id,
          forceCloseRole: user.role,
          sessionRevoked: revokeSessions
        }
      });

      // إنشاء سجل الإغلاق
      await db.shiftClosure.create({
        data: {
          shiftId: shift.id,
          closedBy: user.id,
          closedByRole: user.role as UserRole,
          closedByName: user.name,
          affectedUserId: shift.userId,
          affectedUserName: shift.user.name,
          branchId: shift.branchId,
          branchName: branch.name,
          closureType: ClosureType.BRANCH_ALL,
          closureReason: reason,
          totalSales,
          totalReturns,
          totalExpenses,
          expectedCash,
          actualCash: expectedCash,
          difference: 0,
          sessionRevoked: revokeSessions,
          notificationsSent: true
        }
      });

      // إنشاء إشعار للمستخدم
      await db.notification.create({
        data: {
          userId: shift.userId,
          title: 'تم إغلاق ورديتك إجبارياً',
          titleAr: 'تم إغلاق ورديتك إجبارياً',
          message: `تم إغلاق ورديتك ضمن إغلاق جميع ورديات فرع "${branch.name}" بواسطة ${user.name}. السبب: ${reason}`,
          messageAr: `تم إغلاق ورديتك ضمن إغلاق جميع ورديات فرع "${branch.name}" بواسطة ${user.name}. السبب: ${reason}`,
          type: 'BRANCH_SHIFTS_CLOSE',
          link: '/shifts'
        }
      });

      affectedUserIds.push(shift.userId);

      results.push({
        shiftId: shift.id,
        userId: shift.userId,
        userName: shift.user.name,
        totalSales,
        closedAt: updatedShift.endTime
      });
    }

    // إلغاء جلسات المستخدمين المتأثرين
    let sessionsRevokedCount = 0;
    if (revokeSessions && affectedUserIds.length > 0) {
      const revokeResult = await db.userSession.updateMany({
        where: {
          userId: { in: affectedUserIds },
          isActive: true
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: user.id,
          revokeReason: `إغلاق جميع ورديات الفرع: ${reason}`
        }
      });
      sessionsRevokedCount = revokeResult.count;
    }

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CLOSE_BRANCH_SHIFTS',
        module: 'shifts',
        branchId,
        newData: JSON.stringify({
          branchId,
          branchName: branch.name,
          reason,
          closedShiftsCount: openShifts.length,
          affectedUsers: affectedUserIds.length,
          sessionsRevoked: sessionsRevokedCount,
          closedBy: user.name,
          closedByRole: user.role
        }),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: `تم إغلاق ${openShifts.length} وردية بنجاح`,
      data: {
        branchId,
        branchName: branch.name,
        closedBy: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        reason,
        closedShifts: results,
        totalClosed: openShifts.length,
        sessionsRevoked: sessionsRevokedCount
      }
    });

  } catch (error) {
    console.error('Close branch shifts error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
