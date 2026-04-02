import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/audit-logs
 * جلب سجلات التدقيق
 * 
 * Query params:
 * - branchId: تصفية حسب الفرع
 * - userId: تصفية حسب المستخدم
 * - action: تصفية حسب الإجراء
 * - module: تصفية حسب الوحدة
 * - startDate: تاريخ البداية
 * - endDate: تاريخ النهاية
 * - page: رقم الصفحة
 * - limit: عدد السجلات في الصفحة
 */
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // فقط السوبر أدمن ومدير الفرع يمكنهم عرض السجلات
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض السجلات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const moduleFilter = searchParams.get('module');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const targetUserId = searchParams.get('targetUserId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where: any = {};

    // مدير الفرع يرى سجلات فرعه فقط
    if (user.role === 'BRANCH_ADMIN') {
      where.branchId = user.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (moduleFilter) where.module = moduleFilter;
    if (targetUserId) where.targetUserId = targetUserId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // جلب السجلات
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.auditLog.count({ where })
    ]);

    // جلب المستخدمين المتأثرين
    const targetUserIds = [...new Set(logs.filter(l => l.targetUserId).map(l => l.targetUserId))];
    const targetUsers = targetUserIds.length > 0 
      ? await db.user.findMany({
          where: { id: { in: targetUserIds as string[] } },
          select: { id: true, name: true, email: true, role: true }
        })
      : [];

    const targetUsersMap = new Map(targetUsers.map(u => [u.id, u]));

    // تنسيق البيانات
    const formattedLogs = logs.map(log => ({
      ...log,
      oldData: log.oldData ? JSON.parse(log.oldData) : null,
      newData: log.newData ? JSON.parse(log.newData) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      targetUser: log.targetUserId ? targetUsersMap.get(log.targetUserId) : null
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
