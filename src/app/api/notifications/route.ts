import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: جلب إشعارات المستخدم
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: user.id };
    if (isRead !== null) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: user.id, isRead: false }
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: total > offset + limit,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإشعارات' }, { status: 500 });
  }
}

// POST: إنشاء إشعار جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, titleAr, message, messageAr, type, link } = body;

    // التحقق من الصلاحيات - فقط المدير يمكنه إنشاء إشعارات لمستخدمين آخرين
    const targetUserId = userId || user.id;
    if (userId && userId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بإنشاء إشعارات لمستخدمين آخرين' }, { status: 403 });
    }

    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        type: type || 'SYSTEM',
        link,
        isRead: false,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الإشعار' }, { status: 500 });
  }
}

// PUT: تحديث حالة الإشعار
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isRead, markAllRead, deleteIds } = body;

    // تحديد جميع الإشعارات كمقروءة
    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' });
    }

    // حذف مجموعة إشعارات
    if (deleteIds && Array.isArray(deleteIds) && deleteIds.length > 0) {
      await db.notification.deleteMany({
        where: {
          id: { in: deleteIds },
          userId: user.id, // التأكد من أن المستخدم يملك هذه الإشعارات
        },
      });
      return NextResponse.json({ success: true, message: 'تم حذف الإشعارات بنجاح' });
    }

    // تحديث إشعار واحد
    if (id) {
      const notification = await db.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
      }

      if (notification.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'غير مصرح بتعديل هذا الإشعار' }, { status: 403 });
      }

      const updatedNotification = await db.notification.update({
        where: { id },
        data: { isRead: isRead ?? true },
      });

      return NextResponse.json({ notification: updatedNotification });
    }

    return NextResponse.json({ error: 'لا توجد بيانات كافية للتحديث' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الإشعار' }, { status: 500 });
  }
}

// DELETE: حذف إشعار
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 });
    }

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    if (notification.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بحذف هذا الإشعار' }, { status: 403 });
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الإشعار بنجاح' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الإشعار' }, { status: 500 });
  }
}
