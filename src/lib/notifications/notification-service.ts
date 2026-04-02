/**
 * Notification Service - خدمة الإشعارات الداخلية
 * تتعامل مع جميع أنواع الإشعارات التلقائية في النظام
 */

import { db } from '@/lib/db';

// أنواع الإشعارات
export enum NotificationType {
  // المخزون
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  
  // الورديات
  SHIFT_OPENED = 'SHIFT_OPENED',
  SHIFT_CLOSED = 'SHIFT_CLOSED',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  
  // الفواتير
  NEW_INVOICE = 'NEW_INVOICE',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVOICE_RETURNED = 'INVOICE_RETURNED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  
  // المرتجعات
  RETURN_REQUEST = 'RETURN_REQUEST',
  RETURN_APPROVED = 'RETURN_APPROVED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  
  // المبيعات
  SALES_TARGET = 'SALES_TARGET',
  DAILY_GOAL_ACHIEVED = 'DAILY_GOAL_ACHIEVED',
  
  // النظام
  SYSTEM = 'SYSTEM',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  BACKUP_COMPLETE = 'BACKUP_COMPLETE',
  
  // المستخدمين
  NEW_USER = 'NEW_USER',
  USER_PERMISSION_CHANGED = 'USER_PERMISSION_CHANGED',
  
  // العملاء
  NEW_CUSTOMER = 'NEW_CUSTOMER',
  CUSTOMER_BIRTHDAY = 'CUSTOMER_BIRTHDAY',
  
  // الموردين
  SUPPLIER_ORDER = 'SUPPLIER_ORDER',
}

// واجهة بيانات الإشعار
export interface CreateNotificationData {
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: NotificationType | string;
  link?: string;
}

// واجهة مستقبل الإشعارات
export interface NotificationRecipient {
  userId: string;
  role?: string;
}

/**
 * فئة خدمة الإشعارات
 */
export class NotificationService {
  
  /**
   * إنشاء إشعار جديد
   */
  static async create(data: CreateNotificationData): Promise<void> {
    try {
      await db.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          titleAr: data.titleAr || data.title,
          message: data.message,
          messageAr: data.messageAr || data.message,
          type: data.type,
          link: data.link,
          isRead: false,
        },
      });

      // بث الإشعار عبر WebSocket إذا كان متاحاً
      await this.broadcastNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار لعدة مستخدمين
   */
  static async createForUsers(
    users: NotificationRecipient[],
    data: Omit<CreateNotificationData, 'userId'>
  ): Promise<void> {
    try {
      const notifications = users.map(user => ({
        userId: user.userId,
        title: data.title,
        titleAr: data.titleAr || data.title,
        message: data.message,
        messageAr: data.messageAr || data.message,
        type: data.type,
        link: data.link,
        isRead: false,
      }));

      await db.notification.createMany({ data: notifications });
    } catch (error) {
      console.error('Error creating notifications for users:', error);
      throw error;
    }
  }

  /**
   * بث الإشعار عبر WebSocket
   */
  private static async broadcastNotification(data: CreateNotificationData): Promise<void> {
    try {
      // هذا سيتم تنفيذه عبر socket.io
      // سيتم استدعاء هذا من المكان المناسب عند توفر الـ socket server
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  /**
   * الحصول على المستخدمين حسب الدور
   */
  static async getUsersByRole(role: string): Promise<NotificationRecipient[]> {
    const users = await db.user.findMany({
      where: { role: role as any, isActive: true },
      select: { id: true, role: true },
    });
    return users.map(u => ({ userId: u.id, role: u.role }));
  }

  /**
   * الحصول على جميع المدراء
   */
  static async getAdmins(): Promise<NotificationRecipient[]> {
    const users = await db.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'BRANCH_ADMIN' },
        ],
        isActive: true,
      },
      select: { id: true, role: true },
    });
    return users.map(u => ({ userId: u.id, role: u.role }));
  }
}

/**
 * إشعارات المخزون
 */
export class InventoryNotifications {
  
  /**
   * التحقق من المخزون المنخفض وإنشاء إشعارات
   */
  static async checkLowStock(branchId?: string): Promise<void> {
    try {
      const whereClause: any = {
        isActive: true,
        OR: [
          { hasVariants: false },
          { hasVariants: null },
        ],
      };

      // جلب المنتجات مع معلومات المخزون
      const products = await db.product.findMany({
        where: whereClause,
        include: {
          inventory: {
            where: branchId ? { branchId } : undefined,
          },
          category: true,
        },
      });

      const admins = await NotificationService.getAdmins();

      for (const product of products) {
        const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        
        // تحقق من المخزون المنخفض
        if (product.minStock > 0 && totalStock <= product.minStock && totalStock > 0) {
          await NotificationService.createForUsers(admins, {
            title: 'Low Stock Alert',
            titleAr: 'تنبيه مخزون منخفض',
            message: `Product "${product.name}" is running low on stock (${totalStock} remaining)`,
            messageAr: `المنتج "${product.nameAr || product.name}" مخزونه منخفض (${totalStock} متبقي)`,
            type: NotificationType.LOW_STOCK,
            link: `/products?id=${product.id}`,
          });
        }
        
        // تحقق من نفاد المخزون
        if (totalStock === 0) {
          await NotificationService.createForUsers(admins, {
            title: 'Out of Stock Alert',
            titleAr: 'تنبيه نفاد المخزون',
            message: `Product "${product.name}" is out of stock`,
            messageAr: `المنتج "${product.nameAr || product.name}" نفذ من المخزون`,
            type: NotificationType.OUT_OF_STOCK,
            link: `/products?id=${product.id}`,
          });
        }
      }

      // التحقق من المنتجات ذات المتغيرات
      const variantProducts = await db.product.findMany({
        where: {
          isActive: true,
          hasVariants: true,
        },
        include: {
          variants: true,
          category: true,
        },
      });

      for (const product of variantProducts) {
        for (const variant of product.variants) {
          if (product.minStock > 0 && variant.stock <= product.minStock && variant.stock > 0) {
            await NotificationService.createForUsers(admins, {
              title: 'Low Stock Alert',
              titleAr: 'تنبيه مخزون منخفض',
              message: `Variant "${variant.name}" of "${product.name}" is running low (${variant.stock} remaining)`,
              messageAr: `المتغير "${variant.nameAr || variant.name}" للمنتج "${product.nameAr || product.name}" مخزونه منخفض (${variant.stock} متبقي)`,
              type: NotificationType.LOW_STOCK,
              link: `/products?id=${product.id}`,
            });
          }
          
          if (variant.stock === 0) {
            await NotificationService.createForUsers(admins, {
              title: 'Out of Stock Alert',
              titleAr: 'تنبيه نفاد المخزون',
              message: `Variant "${variant.name}" of "${product.name}" is out of stock`,
              messageAr: `المتغير "${variant.nameAr || variant.name}" للمنتج "${product.nameAr || product.name}" نفد من المخزون`,
              type: NotificationType.OUT_OF_STOCK,
              link: `/products?id=${product.id}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }
}

/**
 * إشعارات الورديات
 */
export class ShiftNotifications {
  
  /**
   * إشعار فتح وردية جديدة
   */
  static async notifyShiftOpened(shiftId: string, userId: string, branchId: string): Promise<void> {
    try {
      const [user, branch] = await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.branch.findUnique({ where: { id: branchId } }),
      ]);

      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: 'Shift Opened',
        titleAr: 'تم فتح وردية جديدة',
        message: `${user?.name || 'User'} opened a new shift at ${branch?.name || 'branch'}`,
        messageAr: `${user?.nameAr || user?.name || 'المستخدم'} فتح وردية جديدة في ${branch?.name || 'الفرع'}`,
        type: NotificationType.SHIFT_OPENED,
        link: `/shifts?id=${shiftId}`,
      });
    } catch (error) {
      console.error('Error notifying shift opened:', error);
    }
  }

  /**
   * إشعار إغلاق وردية
   */
  static async notifyShiftClosed(shiftId: string, userId: string, branchId: string, totalSales: number): Promise<void> {
    try {
      const [user, branch] = await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.branch.findUnique({ where: { id: branchId } }),
      ]);

      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: 'Shift Closed',
        titleAr: 'تم إغلاق وردية',
        message: `${user?.name || 'User'} closed shift at ${branch?.name || 'branch'}. Total: ${totalSales}`,
        messageAr: `${user?.nameAr || user?.name || 'المستخدم'} أغلق الوردية في ${branch?.name || 'الفرع'}. الإجمالي: ${totalSales.toFixed(2)}`,
        type: NotificationType.SHIFT_CLOSED,
        link: `/shifts?id=${shiftId}`,
      });
    } catch (error) {
      console.error('Error notifying shift closed:', error);
    }
  }

  /**
   * تذكير بالوردية المفتوحة
   */
  static async remindOpenShift(userId: string, shiftId: string, hoursOpen: number): Promise<void> {
    try {
      await NotificationService.create({
        userId,
        title: 'Shift Reminder',
        titleAr: 'تذكير بالوردية',
        message: `Your shift has been open for ${hoursOpen} hours`,
        messageAr: `ورديتك مفتوحة منذ ${hoursOpen} ساعة`,
        type: NotificationType.SHIFT_REMINDER,
        link: `/shifts?id=${shiftId}`,
      });
    } catch (error) {
      console.error('Error reminding open shift:', error);
    }
  }
}

/**
 * إشعارات الفواتير
 */
export class InvoiceNotifications {
  
  /**
   * إشعار فاتورة جديدة
   */
  static async notifyNewInvoice(invoiceId: string, userId: string, totalAmount: number, branchId: string): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      const branch = await db.branch.findUnique({ where: { id: branchId } });
      
      await NotificationService.createForUsers(admins, {
        title: 'New Invoice',
        titleAr: 'فاتورة جديدة',
        message: `New invoice created for ${totalAmount.toFixed(2)} at ${branch?.name || 'branch'}`,
        messageAr: `تم إنشاء فاتورة جديدة بقيمة ${totalAmount.toFixed(2)} في ${branch?.name || 'الفرع'}`,
        type: NotificationType.NEW_INVOICE,
        link: `/invoices?id=${invoiceId}`,
      });
    } catch (error) {
      console.error('Error notifying new invoice:', error);
    }
  }

  /**
   * إشعار إلغاء فاتورة
   */
  static async notifyInvoiceCancelled(invoiceId: string, invoiceNumber: string, reason?: string): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: 'Invoice Cancelled',
        titleAr: 'تم إلغاء فاتورة',
        message: `Invoice ${invoiceNumber} has been cancelled. ${reason || ''}`,
        messageAr: `تم إلغاء الفاتورة ${invoiceNumber}. ${reason || ''}`,
        type: NotificationType.INVOICE_CANCELLED,
        link: `/invoices?id=${invoiceId}`,
      });
    } catch (error) {
      console.error('Error notifying invoice cancelled:', error);
    }
  }

  /**
   * إشعار مرتجع
   */
  static async notifyInvoiceReturned(returnId: string, invoiceNumber: string, totalAmount: number): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: 'Invoice Return',
        titleAr: 'مرتجع فاتورة',
        message: `Return processed for invoice ${invoiceNumber}. Amount: ${totalAmount.toFixed(2)}`,
        messageAr: `تم معالجة مرتجع للفاتورة ${invoiceNumber}. المبلغ: ${totalAmount.toFixed(2)}`,
        type: NotificationType.INVOICE_RETURNED,
        link: `/returns?id=${returnId}`,
      });
    } catch (error) {
      console.error('Error notifying invoice returned:', error);
    }
  }
}

/**
 * إشعارات المرتجعات
 */
export class ReturnNotifications {
  
  /**
   * إشعار طلب مرتجع جديد
   */
  static async notifyNewReturnRequest(returnId: string, returnNumber: string, totalAmount: number, branchId: string): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      const branch = await db.branch.findUnique({ where: { id: branchId } });
      
      await NotificationService.createForUsers(admins, {
        title: 'New Return Request',
        titleAr: 'طلب مرتجع جديد',
        message: `New return request ${returnNumber} for ${totalAmount.toFixed(2)} at ${branch?.name || 'branch'}`,
        messageAr: `طلب مرتجع جديد ${returnNumber} بقيمة ${totalAmount.toFixed(2)} في ${branch?.name || 'الفرع'}`,
        type: NotificationType.RETURN_REQUEST,
        link: `/returns?id=${returnId}`,
      });
    } catch (error) {
      console.error('Error notifying new return request:', error);
    }
  }

  /**
   * إشعار موافقة على المرتجع
   */
  static async notifyReturnApproved(userId: string, returnNumber: string): Promise<void> {
    try {
      await NotificationService.create({
        userId,
        title: 'Return Approved',
        titleAr: 'تمت الموافقة على المرتجع',
        message: `Your return request ${returnNumber} has been approved`,
        messageAr: `تمت الموافقة على طلب المرتجع ${returnNumber}`,
        type: NotificationType.RETURN_APPROVED,
        link: `/returns`,
      });
    } catch (error) {
      console.error('Error notifying return approved:', error);
    }
  }

  /**
   * إشعار رفض المرتجع
   */
  static async notifyReturnRejected(userId: string, returnNumber: string, reason?: string): Promise<void> {
    try {
      await NotificationService.create({
        userId,
        title: 'Return Rejected',
        titleAr: 'تم رفض المرتجع',
        message: `Your return request ${returnNumber} has been rejected. ${reason || ''}`,
        messageAr: `تم رفض طلب المرتجع ${returnNumber}. ${reason || ''}`,
        type: NotificationType.RETURN_REJECTED,
        link: `/returns`,
      });
    } catch (error) {
      console.error('Error notifying return rejected:', error);
    }
  }
}

/**
 * إشعارات المبيعات والأهداف
 */
export class SalesNotifications {
  
  /**
   * إشعار تحقيق هدف المبيعات
   */
  static async notifySalesTargetAchieved(userId: string, targetAmount: number, actualAmount: number): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      
      // إشعار للمستخدم
      await NotificationService.create({
        userId,
        title: 'Sales Target Achieved! 🎉',
        titleAr: 'تم تحقيق هدف المبيعات! 🎉',
        message: `Congratulations! You've achieved your sales target of ${targetAmount.toFixed(2)}. Actual: ${actualAmount.toFixed(2)}`,
        messageAr: `مبروك! لقد حققت هدف المبيعات البالغ ${targetAmount.toFixed(2)}. الفعلي: ${actualAmount.toFixed(2)}`,
        type: NotificationType.SALES_TARGET,
        link: `/reports`,
      });

      // إشعار للإدارة
      const user = await db.user.findUnique({ where: { id: userId } });
      await NotificationService.createForUsers(admins, {
        title: 'Sales Target Achieved',
        titleAr: 'تحقيق هدف مبيعات',
        message: `${user?.name || 'User'} achieved sales target of ${targetAmount.toFixed(2)}`,
        messageAr: `${user?.nameAr || user?.name || 'المستخدم'} حقق هدف مبيعات بقيمة ${targetAmount.toFixed(2)}`,
        type: NotificationType.SALES_TARGET,
        link: `/reports`,
      });
    } catch (error) {
      console.error('Error notifying sales target:', error);
    }
  }

  /**
   * إشعار تحقيق الهدف اليومي
   */
  static async notifyDailyGoalAchieved(branchId: string, goalAmount: number, actualAmount: number): Promise<void> {
    try {
      const branch = await db.branch.findUnique({ where: { id: branchId } });
      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: 'Daily Goal Achieved! 🎉',
        titleAr: 'تم تحقيق الهدف اليومي! 🎉',
        message: `Branch ${branch?.name || 'Unknown'} achieved daily goal of ${goalAmount.toFixed(2)}. Actual: ${actualAmount.toFixed(2)}`,
        messageAr: `${branch?.name || 'الفرع'} حقق الهدف اليومي البالغ ${goalAmount.toFixed(2)}. الفعلي: ${actualAmount.toFixed(2)}`,
        type: NotificationType.DAILY_GOAL_ACHIEVED,
        link: `/reports`,
      });
    } catch (error) {
      console.error('Error notifying daily goal:', error);
    }
  }
}

/**
 * إشعارات النظام
 */
export class SystemNotifications {
  
  /**
   * إشعار تحديث النظام
   */
  static async notifySystemUpdate(message: string, messageAr: string): Promise<void> {
    try {
      const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      await NotificationService.createForUsers(
        users.map(u => ({ userId: u.id })),
        {
          title: 'System Update',
          titleAr: 'تحديث النظام',
          message,
          messageAr,
          type: NotificationType.SYSTEM_UPDATE,
        }
      );
    } catch (error) {
      console.error('Error notifying system update:', error);
    }
  }

  /**
   * إشعار اكتمال النسخ الاحتياطي
   */
  static async notifyBackupComplete(success: boolean): Promise<void> {
    try {
      const admins = await NotificationService.getAdmins();
      
      await NotificationService.createForUsers(admins, {
        title: success ? 'Backup Complete' : 'Backup Failed',
        titleAr: success ? 'اكتمل النسخ الاحتياطي' : 'فشل النسخ الاحتياطي',
        message: success 
          ? 'System backup completed successfully' 
          : 'System backup failed. Please check the logs.',
        messageAr: success 
          ? 'تم النسخ الاحتياطي للنظام بنجاح' 
          : 'فشل النسخ الاحتياطي. يرجى مراجعة السجلات.',
        type: NotificationType.BACKUP_COMPLETE,
      });
    } catch (error) {
      console.error('Error notifying backup:', error);
    }
  }
}

// تصدير جميع الخدمات
const notificationServices = {
  NotificationService,
  InventoryNotifications,
  ShiftNotifications,
  InvoiceNotifications,
  ReturnNotifications,
  SalesNotifications,
  SystemNotifications,
};

export default notificationServices;
