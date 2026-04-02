import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/shift-closures
 * جلب سجلات إغلاق الورديات
 * 
 * Query params:
 * - branchId: تصفية حسب الفرع
 * - userId: تصفية حسب المستخدم المتأثر
 * - closedBy: تصفية حسب من قام بالإغلاق
 * - closureType: نوع الإغلاق
 * - startDate: تاريخ البداية
 * - endDate: تاريخ النهاية
 */
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const affectedUserId = searchParams.get('userId');
    const closedBy = searchParams.get('closedBy');
    const closureType = searchParams.get('closureType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where: any = {};

    // المستخدم العادي يرى إغلاقاته فقط
    if (user.role === 'USER') {
      where.affectedUserId = user.id;
    } else if (user.role === 'BRANCH_ADMIN') {
      // مدير الفرع يرى إغلاقات فرعه
      where.branchId = user.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (affectedUserId) where.affectedUserId = affectedUserId;
    if (closedBy) where.closedBy = closedBy;
    if (closureType) where.closureType = closureType;

    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = new Date(startDate);
      if (endDate) where.closedAt.lte = new Date(endDate);
    }

    const [closures, total] = await Promise.all([
      db.shiftClosure.findMany({
        where,
        include: {
          shift: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { closedAt: 'desc' },
        skip,
        take: limit
      }),
      db.shiftClosure.count({ where })
    ]);

    return NextResponse.json({
      closures,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Shift closures error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

/**
 * GET /api/shift-closures/stats
 * إحصائيات الإغلاقات
 */
export async function GET_STATS(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // بناء شروط البحث
    const where: any = {};

    if (user.role === 'BRANCH_ADMIN') {
      where.branchId = user.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = new Date(startDate);
      if (endDate) where.closedAt.lte = new Date(endDate);
    }

    // إحصائيات حسب نوع الإغلاق
    const byType = await db.shiftClosure.groupBy({
      by: ['closureType'],
      where,
      _count: true,
      _sum: {
        totalSales: true,
        difference: true
      }
    });

    // إحصائيات حسب الفرع (للسوبر أدمن فقط)
    let byBranch: any[] = [];
    if (user.role === 'SUPER_ADMIN') {
      byBranch = await db.shiftClosure.groupBy({
        by: ['branchId', 'branchName'],
        where,
        _count: true,
        _sum: {
          totalSales: true
        }
      });
    }

    // إحصائيات حسب من قام بالإغلاق
    const byCloser = await db.shiftClosure.groupBy({
      by: ['closedBy', 'closedByName', 'closedByRole'],
      where,
      _count: true
    });

    return NextResponse.json({
      byType,
      byBranch,
      byCloser
    });

  } catch (error) {
    console.error('Shift closures stats error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
