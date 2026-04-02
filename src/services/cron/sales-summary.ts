// ==================== خدمة ملخصات المبيعات التلقائية ====================

import { db } from '@/lib/db';

// ==================== الأنواع ====================
interface SummaryResult {
  success: boolean;
  message: string;
  data?: {
    branchId: string;
    date: Date;
    summary: Record<string, unknown>;
  };
}

interface HourlySummaryData {
  branchId: string;
  date: Date;
  hour: number;
  totalSales: number;
  invoiceCount: number;
}

interface DailySummaryData {
  branchId: string;
  date: Date;
  totalSales: number;
  totalReturns: number;
  totalDiscount: number;
  totalTax: number;
  totalProfit: number;
  invoiceCount: number;
  customerCount: number;
}

interface ProductSummaryData {
  productId: string;
  branchId: string;
  date: Date;
  quantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

// ==================== ملخصات المبيعات ====================

/**
 * توليد ملخص المبيعات كل ساعة
 * يتم تشغيله كل ساعة لتحديث بيانات المبيعات
 */
export async function generateHourlySummary(): Promise<SummaryResult[]> {
  const results: SummaryResult[] = [];
  
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // جلب جميع الفروع النشطة
    const branches = await db.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const branch of branches) {
      try {
        // حساب مبيعات الساعة الحالية
        const hourStart = new Date(today);
        hourStart.setHours(currentHour, 0, 0, 0);
        
        const hourEnd = new Date(today);
        hourEnd.setHours(currentHour, 59, 59, 999);

        const invoices = await db.invoice.findMany({
          where: {
            branchId: branch.id,
            createdAt: {
              gte: hourStart,
              lte: hourEnd,
            },
            status: 'COMPLETED',
          },
          include: {
            items: true,
          },
        });

        const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const invoiceCount = invoices.length;

        // تحديث أو إنشاء الملخص
        const summary = await db.hourlySalesSummary.upsert({
          where: {
            branchId_date_hour: {
              branchId: branch.id,
              date: today,
              hour: currentHour,
            },
          },
          create: {
            branchId: branch.id,
            date: today,
            hour: currentHour,
            totalSales,
            invoiceCount,
          },
          update: {
            totalSales,
            invoiceCount,
          },
        });

        results.push({
          success: true,
          message: `تم تحديث ملخص الساعة ${currentHour} للفرع ${branch.id}`,
          data: {
            branchId: branch.id,
            date: today,
            summary: summary as unknown as Record<string, unknown>,
          },
        });
      } catch (error) {
        results.push({
          success: false,
          message: `فشل في تحديث ملخص الفرع ${branch.id}`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error generating hourly summary:', error);
    return [{ success: false, message: 'فشل في توليد ملخص الساعة' }];
  }
}

/**
 * توليد ملخص المبيعات اليومي
 * يتم تشغيله مرة واحدة يومياً (عادة في منتصف الليل)
 */
export async function generateDailySummary(date?: Date): Promise<SummaryResult[]> {
  const results: SummaryResult[] = [];
  
  try {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setMilliseconds(dayEnd.getMilliseconds() - 1);

    // جلب جميع الفروع النشطة
    const branches = await db.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const branch of branches) {
      try {
        // حساب المبيعات اليومية
        const invoices = await db.invoice.findMany({
          where: {
            branchId: branch.id,
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          include: {
            items: {
              include: {
                product: { select: { costPrice: true } },
              },
            },
          },
        });

        // حساب الإحصائيات
        const completedInvoices = invoices.filter(inv => inv.status === 'COMPLETED');
        const returnInvoices = invoices.filter(inv => inv.status === 'RETURNED' || inv.isReturn);

        const totalSales = completedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalReturns = returnInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
        const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
        
        // حساب الأرباح
        let totalProfit = 0;
        for (const invoice of completedInvoices) {
          for (const item of invoice.items) {
            const costPrice = item.costPrice || (item.product?.costPrice || 0);
            const profit = (item.unitPrice - costPrice) * item.quantity;
            totalProfit += profit;
          }
        }

        // حساب عدد العملاء الفريدين
        const uniqueCustomers = new Set(
          invoices.filter(inv => inv.customerId).map(inv => inv.customerId)
        );

        // تحديث أو إنشاء الملخص اليومي
        const summary = await db.dailySalesSummary.upsert({
          where: {
            branchId_date: {
              branchId: branch.id,
              date: dayStart,
            },
          },
          create: {
            branchId: branch.id,
            date: dayStart,
            totalSales,
            totalReturns,
            totalDiscount,
            totalTax,
            totalProfit,
            invoiceCount: completedInvoices.length,
            customerCount: uniqueCustomers.size,
          },
          update: {
            totalSales,
            totalReturns,
            totalDiscount,
            totalTax,
            totalProfit,
            invoiceCount: completedInvoices.length,
            customerCount: uniqueCustomers.size,
          },
        });

        // تحديث ملخصات المنتجات
        await generateProductSummary(branch.id, dayStart, dayEnd);

        results.push({
          success: true,
          message: `تم تحديث الملخص اليومي للفرع ${branch.id}`,
          data: {
            branchId: branch.id,
            date: dayStart,
            summary: summary as unknown as Record<string, unknown>,
          },
        });
      } catch (error) {
        results.push({
          success: false,
          message: `فشل في تحديث الملخص اليومي للفرع ${branch.id}`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return [{ success: false, message: 'فشل في توليد الملخص اليومي' }];
  }
}

/**
 * توليد ملخص مبيعات المنتجات
 */
export async function generateProductSummary(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  try {
    // جلب مبيعات المنتجات
    const invoiceItems = await db.invoiceItem.findMany({
      where: {
        invoice: {
          branchId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'COMPLETED',
        },
        productId: { not: null },
      },
      include: {
        product: { select: { costPrice: true } },
      },
    });

    // تجميع المبيعات حسب المنتج
    const productSales = new Map<string, {
      quantitySold: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    for (const item of invoiceItems) {
      if (!item.productId) continue;

      const existing = productSales.get(item.productId) || {
        quantitySold: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };

      const costPrice = item.costPrice || (item.product?.costPrice || 0);
      const profit = (item.unitPrice - costPrice) * item.quantity;

      productSales.set(item.productId, {
        quantitySold: existing.quantitySold + item.quantity,
        totalRevenue: existing.totalRevenue + item.totalAmount,
        totalProfit: existing.totalProfit + profit,
      });
    }

    // حفظ الملخصات
    for (const [productId, data] of productSales) {
      await db.productSalesSummary.upsert({
        where: {
          productId_branchId_date: {
            productId,
            branchId,
            date: startDate,
          },
        },
        create: {
          productId,
          branchId,
          date: startDate,
          quantitySold: data.quantitySold,
          totalRevenue: data.totalRevenue,
          totalProfit: data.totalProfit,
        },
        update: {
          quantitySold: data.quantitySold,
          totalRevenue: data.totalRevenue,
          totalProfit: data.totalProfit,
        },
      });
    }
  } catch (error) {
    console.error('Error generating product summary:', error);
  }
}

/**
 * أرشفة البيانات القديمة
 * يتم تشغيلها يومياً لأرشفة البيانات الأقدم من عدد معين من الأيام
 */
export async function archiveOldData(daysOld: number = 90): Promise<{
  success: boolean;
  message: string;
  archivedCount?: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let archivedCount = 0;

    // أرشفة سجلات الطباعة القديمة
    const printLogs = await db.printLog.deleteMany({
      where: {
        printedAt: { lt: cutoffDate },
      },
    });
    archivedCount += printLogs.count;

    // أرشفة سجلات التدقيق القديمة (احتفظ بالبيانات المهمة)
    const auditLogs = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        module: { notIn: ['auth', 'payments'] }, // احتفظ بسجلات المصادقة والمدفوعات
      },
    });
    archivedCount += auditLogs.count;

    // أرشفة الإشعارات المقروءة القديمة
    const notifications = await db.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
    archivedCount += notifications.count;

    // أرشفة الملخصات الساعية القديمة (احتفظ بالملخصات اليومية والشهرية)
    const hourlySummaries = await db.hourlySalesSummary.deleteMany({
      where: {
        date: { lt: cutoffDate },
      },
    });
    archivedCount += hourlySummaries.count;

    return {
      success: true,
      message: `تم أرشفة ${archivedCount} سجل بنجاح`,
      archivedCount,
    };
  } catch (error) {
    console.error('Error archiving old data:', error);
    return {
      success: false,
      message: 'فشل في أرشفة البيانات القديمة',
    };
  }
}

/**
 * تنظيف الملخصات المكررة
 */
export async function cleanupDuplicateSummaries(): Promise<{
  success: boolean;
  message: string;
  removedCount?: number;
}> {
  try {
    // حذف الملخصات المكررة (في حالة وجودها)
    // هذا يتم تلقائياً عبر unique constraints في Prisma
    
    return {
      success: true,
      message: 'تم تنظيف الملخصات المكررة',
      removedCount: 0,
    };
  } catch (error) {
    console.error('Error cleaning up summaries:', error);
    return {
      success: false,
      message: 'فشل في تنظيف الملخصات',
    };
  }
}

/**
 * حساب إحصائيات الأداء
 */
export async function calculatePerformanceMetrics(branchId?: string): Promise<{
  success: boolean;
  data?: {
    averageTicketSize: number;
    averageItemsPerInvoice: number;
    peakHours: number[];
    topProducts: Array<{ productId: string; productName: string; quantitySold: number }>;
  };
}> {
  try {
    const whereClause = branchId ? { branchId } : {};
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // متوسط حجم الفاتورة
    const invoices = await db.invoice.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      include: {
        items: true,
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const averageTicketSize = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // متوسط عدد العناصر في الفاتورة
    const totalItems = invoices.reduce((sum, inv) => sum + inv.items.length, 0);
    const averageItemsPerInvoice = invoices.length > 0 ? totalItems / invoices.length : 0;

    // ساعات الذروة
    const hourlyData = await db.hourlySalesSummary.groupBy({
      by: ['hour'],
      where: {
        ...whereClause,
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        totalSales: true,
      },
      orderBy: {
        _sum: {
          totalSales: 'desc',
        },
      },
      take: 5,
    });

    const peakHours = hourlyData.map(h => h.hour);

    // المنتجات الأكثر مبيعاً
    const topProductsData = await db.productSalesSummary.groupBy({
      by: ['productId'],
      where: {
        ...whereClause,
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        quantitySold: true,
      },
      orderBy: {
        _sum: {
          quantitySold: 'desc',
        },
      },
      take: 10,
    });

    // جلب أسماء المنتجات
    const productIds = topProductsData.map(p => p.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map(p => [p.id, p.name]));
    const topProducts = topProductsData.map(p => ({
      productId: p.productId,
      productName: productMap.get(p.productId) || 'غير معروف',
      quantitySold: p._sum.quantitySold || 0,
    }));

    return {
      success: true,
      data: {
        averageTicketSize,
        averageItemsPerInvoice,
        peakHours,
        topProducts,
      },
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return { success: false };
  }
}

// ==================== تشغيل المهام المجدولة ====================
export interface ScheduledTask {
  name: string;
  interval: number; // بالمللي ثانية
  handler: () => Promise<unknown>;
  lastRun?: Date;
  isRunning?: boolean;
}

export const scheduledTasks: ScheduledTask[] = [
  {
    name: 'hourly-summary',
    interval: 60 * 60 * 1000, // كل ساعة
    handler: generateHourlySummary,
  },
  {
    name: 'daily-summary',
    interval: 24 * 60 * 60 * 1000, // كل يوم
    handler: generateDailySummary,
  },
  {
    name: 'archive-old-data',
    interval: 24 * 60 * 60 * 1000, // كل يوم
    handler: () => archiveOldData(90),
  },
];

/**
 * بدء المهام المجدولة
 */
export function startScheduledTasks(): void {
  for (const task of scheduledTasks) {
    setInterval(async () => {
      if (task.isRunning) return;
      
      task.isRunning = true;
      try {
        await task.handler();
        task.lastRun = new Date();
      } catch (error) {
        console.error(`Error in scheduled task ${task.name}:`, error);
      } finally {
        task.isRunning = false;
      }
    }, task.interval);
  }
}
