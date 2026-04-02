// ==================== API للطباعة ====================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ==================== GET: حالة الطابعة ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // جلب إعدادات الطباعة للفرع
    let printConfig = null;
    if (branchId) {
      printConfig = await db.branchPrintConfig.findUnique({
        where: { branchId },
        include: {
          invoiceTemplate: true,
          returnTemplate: true,
          shiftCloseTemplate: true,
        },
      });
    }

    // جلب قوالب الطباعة
    const templates = await db.receiptTemplate.findMany({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' },
    });

    // جلب سجل الطباعة الأخير
    const recentPrints = await db.printLog.findMany({
      take: 10,
      orderBy: { printedAt: 'desc' },
      select: {
        id: true,
        type: true,
        referenceNumber: true,
        success: true,
        printedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        printConfig,
        templates,
        recentPrints,
        printerStatus: {
          isOnline: true,
          lastCheck: new Date(),
          paperStatus: 'ok',
          connectionType: printConfig?.connectionType || 'usb',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching printer status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة الطابعة' },
      { status: 500 }
    );
  }
}

// ==================== POST: طباعة إيصال ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, referenceId, branchId, userId, copies = 1 } = body;

    // التحقق من البيانات المطلوبة
    if (!type || !branchId || !userId) {
      return NextResponse.json(
        { success: false, error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    // جلب إعدادات الطباعة
    const printConfig = await db.branchPrintConfig.findUnique({
      where: { branchId },
    });

    if (!printConfig) {
      return NextResponse.json(
        { success: false, error: 'إعدادات الطباعة غير موجودة' },
        { status: 404 }
      );
    }

    let printData: Record<string, unknown> = {};
    let referenceNumber = '';

    // جلب البيانات حسب نوع الطباعة
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
                product: { select: { name: true, barcode: true } },
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
            { success: false, error: 'الفاتورة المرتجعة غير موجودة' },
            { status: 404 }
          );
        }
        printData = returnInvoice;
        referenceNumber = returnInvoice.invoiceNumber;
        break;

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
            invoices: { take: 10 },
          },
        });
        if (!shift) {
          return NextResponse.json(
            { success: false, error: 'الوردية غير موجودة' },
            { status: 404 }
          );
        }
        printData = shift;
        referenceNumber = shift.id;
        break;

      case 'z_report':
        if (!referenceId) {
          return NextResponse.json(
            { success: false, error: 'معرف الوردية مطلوب' },
            { status: 400 }
          );
        }
        const shiftForZ = await db.shift.findUnique({
          where: { id: referenceId },
          include: {
            branch: true,
            user: true,
            invoices: true,
          },
        });
        if (!shiftForZ) {
          return NextResponse.json(
            { success: false, error: 'الوردية غير موجودة' },
            { status: 404 }
          );
        }
        printData = shiftForZ;
        referenceNumber = shiftForZ.id;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع الطباعة غير مدعوم' },
          { status: 400 }
        );
    }

    // تسجيل عملية الطباعة
    const printLog = await db.printLog.create({
      data: {
        templateId: printConfig.invoiceTemplateId,
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
      message: 'تم إرسال الإيصال للطباعة',
      data: {
        printLogId: printLog.id,
        printData,
        config: {
          printerName: printConfig.printerName,
          connectionType: printConfig.connectionType,
          copies,
          autoPrint: type === 'invoice' ? printConfig.autoPrintInvoice : 
                     type === 'return' ? printConfig.autoPrintReturn : true,
        },
      },
    });
  } catch (error) {
    console.error('Error printing receipt:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في طباعة الإيصال' },
      { status: 500 }
    );
  }
}

// ==================== PUT: تحديث إعدادات الطابعة ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      branchId,
      printerName,
      printerType,
      connectionType,
      printerIp,
      printerPort,
      autoPrintInvoice,
      autoPrintReturn,
      printCopies,
      openCashDrawer,
      cutPaper,
    } = body;

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: 'معرف الفرع مطلوب' },
        { status: 400 }
      );
    }

    // تحديث أو إنشاء إعدادات الطباعة
    const printConfig = await db.branchPrintConfig.upsert({
      where: { branchId },
      create: {
        branchId,
        printerName,
        printerType: printerType || 'thermal',
        connectionType: connectionType || 'usb',
        printerIp,
        printerPort,
        autoPrintInvoice: autoPrintInvoice ?? true,
        autoPrintReturn: autoPrintReturn ?? true,
        printCopies: printCopies || 1,
        openCashDrawer: openCashDrawer ?? true,
        cutPaper: cutPaper ?? true,
      },
      update: {
        printerName,
        printerType,
        connectionType,
        printerIp,
        printerPort,
        autoPrintInvoice,
        autoPrintReturn,
        printCopies,
        openCashDrawer,
        cutPaper,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات الطابعة',
      data: printConfig,
    });
  } catch (error) {
    console.error('Error updating printer settings:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حفظ إعدادات الطابعة' },
      { status: 500 }
    );
  }
}
