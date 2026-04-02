import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/sessions
 * جلب الجلسات النشطة
 */
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // فقط السوبر أدمن ومدير الفرع يمكنهم عرض الجلسات
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض الجلسات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const branchId = searchParams.get('branchId');

    // بناء شروط البحث
    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
      where.expiresAt = { gt: new Date() };
    }

    // مدير الفرع يرى جلسات فرعه فقط
    if (user.role === 'BRANCH_ADMIN') {
      const branchUsers = await db.user.findMany({
        where: { branchId: user.branchId },
        select: { id: true }
      });
      where.userId = { in: branchUsers.map(u => u.id) };
    } else if (branchId) {
      const branchUsers = await db.user.findMany({
        where: { branchId },
        select: { id: true }
      });
      where.userId = { in: branchUsers.map(u => u.id) };
    }

    const sessions = await db.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            branch: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { lastActivity: 'desc' },
      take: 100
    });

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

/**
 * DELETE /api/sessions
 * إلغاء جلسة مستخدم
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, userId, reason } = body;

    // التحقق من الصلاحيات
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') {
      return NextResponse.json({ error: 'ليس لديك صلاحية إلغاء الجلسات' }, { status: 403 });
    }

    if (!sessionId && !userId) {
      return NextResponse.json({ error: 'يجب تحديد الجلسة أو المستخدم' }, { status: 400 });
    }

    // بناء شروط البحث
    const where: any = { isActive: true };
    
    if (sessionId) {
      where.id = sessionId;
    } else if (userId) {
      where.userId = userId;
    }

    // مدير الفرع يلغي جلسات فرعه فقط
    if (user.role === 'BRANCH_ADMIN' && userId) {
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { branchId: true }
      });
      if (targetUser?.branchId !== user.branchId) {
        return NextResponse.json({ error: 'يمكنك إلغاء جلسات فرعك فقط' }, { status: 403 });
      }
    }

    // إلغاء الجلسات
    const result = await db.userSession.updateMany({
      where,
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: user.id,
        revokeReason: reason || 'إلغاء من قبل المشرف'
      }
    });

    // تسجيل في سجل التدقيق
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: sessionId ? 'REVOKE_SESSION' : 'REVOKE_USER_SESSIONS',
        module: 'sessions',
        targetUserId: userId || undefined,
        newData: JSON.stringify({
          sessionId,
          userId,
          reason,
          revokedCount: result.count,
          revokedBy: user.name
        }),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: `تم إلغاء ${result.count} جلسة`,
      revokedCount: result.count
    });

  } catch (error) {
    console.error('Session revoke error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
