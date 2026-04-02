// ==================== API للطباعة - Print Job ====================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { printQueue, PrintJob, PrintJobType, PrintJobPriority } from '@/lib/printer/print-queue';
import { ThermalPrinter, PrinterConfig, InvoiceWithRelations, ShiftWithRelations } from '@/lib/printer/thermal-printer';
import { ReceiptTemplateBuilder, DEFAULT_RECEIPT_TEMPLATE } from '@/lib/printer/templates/receipt-template';
import { ZReportTemplateBuilder, DEFAULT_Z_REPORT_TEMPLATE } from '@/lib/printer/templates/z-report-template';
import { ShiftCloseTemplateBuilder, DEFAULT_SHIFT_CLOSE_TEMPLATE } from '@/lib/printer/templates/shift-close-template';

// ==================== أنواع الطلب ====================
interface PrintJobRequest {
  type: PrintJobType;
  referenceId: string;
  branchId: string;
  userId: string;
  templateId?: string;
  copies?: number;
  priority?: PrintJobPriority;
  isUrgent?: boolean;
  printerId?: string;
}

interface PrintJobResponse {
  success: boolean;
  message: string;
  jobId?: string;
  status?: string;
  data?: unknown;
}

// ==================== GET: حالة مهمة الطباعة ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const branchId = searchParams.get('branchId');
    const action = searchParams.get('action');

    // الحصول على مهمة محددة
    if (jobId) {
      const job = printQueue.getJob(jobId);
      
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'المهمة غير موجودة' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: job.id,
          type: job.type,
          status: job.status,
          priority: job.priority,
          referenceNumber: job.referenceNumber,
          copies: job.copies,
          currentCopy: job.currentCopy,
          retryCount: job.retryCount,
          error: job.error,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          result: job.result,
        },
      });
    }

    // إحصائيات الطابور
    if (action === 'stats') {
      const stats = printQueue.getStats();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // قائمة المهام
    if (action === 'list') {
      const pending = printQueue.getPendingJobs();
      const processing = printQueue.getProcessingJobs();
      const failed = printQueue.getFailedJobs(10);
      const completed = printQueue.getCompletedJobs(10);
      
      return NextResponse.json({
        success: true,
        data: {
          pending: pending.map(formatJob),
          processing: processing.map(formatJob),
          failed: failed.map(formatJob),
          completed: completed.map(formatJob),
        },
      });
    }

    // سجل الطباعة
    if (action === 'logs') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const logs = printQueue.getLogs(limit);
      
      return NextResponse.json({
        success: true,
        data: logs,
      });
    }

    // جلب إعدادات الطابعة للفرع
    if (branchId) {
      const printConfig = await db.branchPrintConfig.findUnique({
        where: { branchId },
        include: {
          invoiceTemplate: true,
          returnTemplate: true,
          shiftCloseTemplate: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          config: printConfig,
          stats: printQueue.getStats(),
        },
      });
    }

    // حالة الطابور الافتراضية
    return NextResponse.json({
      success: true,
      data: {
        stats: printQueue.getStats(),
        isPaused: false,
      },
    });
  } catch (error) {
    console.error('Error in print job GET:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}

// ==================== POST: إرسال مهمة طباعة ====================
export async function POST(request: NextRequest) {
  try {
    const body: PrintJobRequest = await request.json();
    const { type, referenceId, branchId, userId, templateId, copies = 1, priority = 'normal', isUrgent = false, printerId } = body;

    // التحقق من البيانات المطلوبة
    if (!type || !branchId || !userId) {
      return NextResponse.json(
        { success: false, error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    // جلب إعدادات الطابعة
    const printConfig = await db.branchPrintConfig.findUnique({
      where: { branchId },
    });

    if (!printConfig) {
      return NextResponse.json(
        { success: false, error: 'إعدادات الطباعة غير موجودة' },
        { status: 404 }
      );
    }

    // بناء تكوين الطابعة
    const printerConfig: PrinterConfig = {
      id: printerId || printConfig.id || 'default',
      name: printConfig.printerName || 'Default Printer',
      type: (printConfig.printerType as 'thermal' | 'laser' | 'inkjet') || 'thermal',
      connectionType: (printConfig.connectionType as 'usb' | 'network' | 'bluetooth') || 'usb',
      paperWidth: (printConfig.paperWidth as 58 | 80) || 80,
      ip: printConfig.printerIp || undefined,
      port: printConfig.printerPort || 9100,
      autoCut: printConfig.cutPaper ?? true,
      openDrawer: printConfig.openCashDrawer ?? true,
    };

    // جلب البيانات حسب النوع
    let printData: unknown;
    let referenceNumber = '';
    let template = templateId;

    switch (type) {
      case 'invoice':
        if (!referenceId) {
          return NextResponse.json(
            { success: false, error: 'معرف الفاتورة مطلوب' },
            { status: 400 }
          );
        }
        
        const invoice = await db.invoice.findUnique({
          where: { id: referenceId },
          include: {
            branch: true,
            user: true,
            customer: true,
            items: {
              include: {
                product: { select: { name: true, barcode: true, sku: true } },
                variant: { select: { name: true } },
              },
            },
            payments: {
              include: {
                paymentMethod: { select: { name: true, nameAr: true } },
              },
            },
          },
        });
        
        if (!invoice) {
          return NextResponse.json(
            { success: false, error: 'الفاتورة غير موجودة' },
            { status: 404 }
          );
        }
        
        printData = invoice;
        referenceNumber = invoice.invoiceNumber;
        template = template || printConfig.invoiceTemplateId || undefined;
        break;

      case 'return':
        if (!referenceId) {
          return NextResponse.json(
            { success: false, error: 'معرف الفاتورة المرتجعة مطلوب' },
            { status: 400 }
          );
        }
        
        const returnInvoice = await db.invoice.findUnique({
          where: { id: referenceId },
          include: {
            branch: true,
            user: true,
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        });
        
        if (!returnInvoice) {
          return NextResponse.json(
            { success: false, error: 'الفاتورة غير موجودة' },
            { status: 404 }
          );
        }
        
        printData = returnInvoice;
        referenceNumber = returnInvoice.invoiceNumber;
        template = template || printConfig.returnTemplateId || undefined;
        break;

      case 'z_report':
      case 'shift_close':
        if (!referenceId) {
          return NextResponse.json(
            { success: false, error: 'معرف الوردية مطلوب' },
            { status: 400 }
          );
        }
        
        const shift = await db.shift.findUnique({
          where: { id: referenceId },
          include: {
            branch: true,
            user: true,
            closedByUser: true,
            invoices: { take: 50 },
          },
        });
        
        if (!shift) {
          return NextResponse.json(
            { success: false, error: 'الوردية غير موجودة' },
            { status: 404 }
          );
        }
        
        printData = shift;
        referenceNumber = shift.id.substring(0, 8);
        template = template || printConfig.shiftCloseTemplateId || undefined;
        break;

      case 'test':
        printData = { test: true };
        referenceNumber = 'TEST';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع الطباعة غير مدعوم' },
          { status: 400 }
        );
    }

    // جلب معلومات المستخدم
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // إضافة المهمة للطابور
    const job = printQueue.addJob({
      type,
      data: printData,
      printerConfig,
      template,
      priority,
      copies,
      referenceId,
      referenceNumber,
      userId,
      userName: user?.name,
      branchId,
      isUrgent,
    });

    // تسجيل المعالج للنوع
    printQueue.registerHandler(type, async (printJob: PrintJob) => {
      return executePrintJob(printJob, printConfig);
    });

    // تسجيل في سجل الطباعة
    await db.printLog.create({
      data: {
        templateId: template,
        branchId,
        userId,
        type,
        referenceId,
        referenceNumber,
        printMethod: printConfig.printerType || 'thermal',
        copies,
        success: true,
        printedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة مهمة الطباعة للطابور',
      jobId: job.id,
      status: job.status,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        referenceNumber: job.referenceNumber,
        copies: job.copies,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in print job POST:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في إرسال مهمة الطباعة' },
      { status: 500 }
    );
  }
}

// ==================== PUT: إدارة مهام الطباعة ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, branchId, printerConfig } = body;

    switch (action) {
      case 'cancel':
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'معرف المهمة مطلوب' },
            { status: 400 }
          );
        }
        
        const cancelled = printQueue.cancelJob(jobId);
        
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'تم إلغاء المهمة' : 'فشل في إلغاء المهمة',
        });

      case 'retry':
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'معرف المهمة مطلوب' },
            { status: 400 }
          );
        }
        
        const retried = printQueue.retryJob(jobId);
        
        return NextResponse.json({
          success: retried,
          message: retried ? 'تم إعادة جدولة المهمة' : 'فشل في إعادة جدولة المهمة',
        });

      case 'pause':
        printQueue.pause();
        return NextResponse.json({
          success: true,
          message: 'تم إيقاف الطابور',
        });

      case 'resume':
        printQueue.resume();
        return NextResponse.json({
          success: true,
          message: 'تم استئناف الطابور',
        });

      case 'clear':
        printQueue.clearQueue();
        return NextResponse.json({
          success: true,
          message: 'تم مسح الطابور',
        });

      case 'updateConfig':
        if (!branchId) {
          return NextResponse.json(
            { success: false, error: 'معرف الفرع مطلوب' },
            { status: 400 }
          );
        }
        
        // تحديث إعدادات الطابعة
        const updated = await db.branchPrintConfig.upsert({
          where: { branchId },
          create: {
            branchId,
            printerName: printerConfig?.name,
            printerType: printerConfig?.type,
            connectionType: printerConfig?.connectionType,
            printerIp: printerConfig?.ip,
            printerPort: printerConfig?.port,
            autoPrintInvoice: printerConfig?.autoPrintInvoice ?? true,
            autoPrintReturn: printerConfig?.autoPrintReturn ?? true,
            printCopies: printerConfig?.copies ?? 1,
            openCashDrawer: printerConfig?.openDrawer ?? true,
            cutPaper: printerConfig?.autoCut ?? true,
          },
          update: {
            printerName: printerConfig?.name,
            printerType: printerConfig?.type,
            connectionType: printerConfig?.connectionType,
            printerIp: printerConfig?.ip,
            printerPort: printerConfig?.port,
            autoPrintInvoice: printerConfig?.autoPrintInvoice,
            autoPrintReturn: printerConfig?.autoPrintReturn,
            printCopies: printerConfig?.copies,
            openCashDrawer: printerConfig?.openDrawer,
            cutPaper: printerConfig?.autoCut,
          },
        });
        
        return NextResponse.json({
          success: true,
          message: 'تم تحديث إعدادات الطابعة',
          data: updated,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'إجراء غير معروف' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in print job PUT:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تنفيذ الإجراء' },
      { status: 500 }
    );
  }
}

// ==================== DELETE: حذف مهام ====================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clearLogs') {
      printQueue.clearLogs();
      return NextResponse.json({
        success: true,
        message: 'تم مسح سجل الطباعة',
      });
    }

    return NextResponse.json(
      { success: false, error: 'إجراء غير معروف' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in print job DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تنفيذ الإجراء' },
      { status: 500 }
    );
  }
}

// ==================== دوال مساعدة ====================

function formatJob(job: PrintJob) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    priority: job.priority,
    referenceNumber: job.referenceNumber,
    copies: job.copies,
    retryCount: job.retryCount,
    error: job.error,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}

async function executePrintJob(job: PrintJob, _config: unknown): Promise<{ success: boolean; message: string; printTime?: Date }> {
  try {
    const printer = new ThermalPrinter(job.printerConfig);
    
    switch (job.type) {
      case 'invoice':
        const invoiceData = job.data as InvoiceWithRelations;
        const receiptBuilder = new ReceiptTemplateBuilder(
          job.printerConfig,
          { ...DEFAULT_RECEIPT_TEMPLATE, paperWidth: job.printerConfig.paperWidth }
        );
        
        // بناء الأوامر
        const commands = receiptBuilder.build(invoiceData);
        job.commands = commands;
        
        // طباعة
        return await printer.printReceipt(invoiceData);

      case 'return':
        const returnData = job.data as InvoiceWithRelations;
        return await printer.printReceipt(returnData);

      case 'z_report':
        const zShiftData = job.data as ShiftWithRelations;
        const zBuilder = new ZReportTemplateBuilder({
          ...DEFAULT_Z_REPORT_TEMPLATE,
          paperWidth: job.printerConfig.paperWidth,
        });
        
        const zCommands = zBuilder.build(zShiftData);
        job.commands = zCommands;
        
        return await printer.printZReport(zShiftData);

      case 'shift_close':
        const shiftData = job.data as ShiftWithRelations;
        const shiftBuilder = new ShiftCloseTemplateBuilder({
          ...DEFAULT_SHIFT_CLOSE_TEMPLATE,
          paperWidth: job.printerConfig.paperWidth,
        });
        
        const shiftCommands = shiftBuilder.build(shiftData);
        job.commands = shiftCommands;
        
        return await printer.printShiftClose(shiftData);

      case 'test':
        // طباعة اختبار
        printer.initialize();
        printer.setAlign('center');
        printer.bold(true);
        printer.setSize('double');
        printer.addText('اختبار الطباعة\n');
        printer.setSize('normal');
        printer.bold(false);
        printer.newLine();
        printer.addText(`الوقت: ${new Date().toLocaleString('ar-SA')}\n`);
        printer.newLine(3);
        printer.cutPaper();
        
        return {
          success: true,
          message: 'تمت طباعة صفحة الاختبار',
          printTime: new Date(),
        };

      default:
        return {
          success: false,
          message: 'نوع الطباعة غير مدعوم',
        };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'خطأ في الطباعة',
    };
  }
}
