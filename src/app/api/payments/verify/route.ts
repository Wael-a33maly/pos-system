// ============================================
// API التحقق من الدفع
// Verify Payment API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentManager, PaymentGatewayCode } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, gatewayTransactionId } = body;

    if (!transactionId && !gatewayTransactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Gateway Transaction ID is required' },
        { status: 400 }
      );
    }

    // البحث عن المعاملة
    const transaction = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId },
          { gatewayTransactionId },
        ],
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // التحقق من أن المعاملة لم تكتمل بالفعل
    if (transaction.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        paidAt: transaction.completedAt,
      });
    }

    // الحصول على البوابة
    const gateway = paymentManager.getGateway(transaction.gatewayCode as PaymentGatewayCode);
    
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not found' },
        { status: 400 }
      );
    }

    // التحقق من الدفع عبر البوابة
    const verifyResult = await gateway.verifyPayment(
      transaction.gatewayTransactionId || transaction.transactionId
    );

    // تحديث سجل المعاملة
    const updateData: Record<string, unknown> = {
      status: verifyResult.status,
      processedAt: new Date(),
    };

    if (verifyResult.success) {
      updateData.completedAt = new Date();
      updateData.amount = verifyResult.amount || transaction.amount;
      updateData.currency = verifyResult.currency || transaction.currency;
      
      if (verifyResult.metadata) {
        updateData.gatewayResponse = JSON.stringify(verifyResult.metadata);
      }
    }

    if (!verifyResult.success && verifyResult.message) {
      updateData.errorMessage = verifyResult.message;
    }

    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: updateData,
    });

    // تسجيل الحدث
    await db.paymentTransactionLog.create({
      data: {
        transactionId: transaction.id,
        action: verifyResult.success ? 'verified' : 'verification_failed',
        status: verifyResult.status,
        message: verifyResult.message || `Payment verification ${verifyResult.success ? 'successful' : 'failed'}`,
        data: JSON.stringify(verifyResult),
      },
    });

    // إذا تم الدفع بنجاح، تحديث الفاتورة
    if (verifyResult.success && transaction.invoiceId) {
      await updateInvoicePaymentStatus(transaction.invoiceId, transaction.amount);
    }

    return NextResponse.json({
      success: verifyResult.success,
      transactionId: transaction.transactionId,
      gatewayTransactionId: transaction.gatewayTransactionId,
      status: verifyResult.status,
      amount: verifyResult.amount || transaction.amount,
      currency: verifyResult.currency || transaction.currency,
      paidAt: verifyResult.paidAt,
      message: verifyResult.message,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// تحديث حالة دفع الفاتورة
async function updateInvoicePaymentStatus(invoiceId: string, paidAmount: number): Promise<void> {
  try {
    // الحصول على الفاتورة
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) return;

    // حساب إجمالي المبالغ المدفوعة
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + paidAmount;

    // تحديد حالة الدفع
    let paymentStatus = 'PARTIAL';
    if (totalPaid >= invoice.totalAmount) {
      paymentStatus = 'PAID';
    } else if (totalPaid === 0) {
      paymentStatus = 'UNPAID';
    }

    // تحديث الفاتورة
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        paymentStatus,
        changeAmount: Math.max(0, totalPaid - invoice.totalAmount),
      },
    });

    // إضافة سجل دفع
    const paymentMethod = await db.paymentMethod.findFirst({
      where: { code: 'card' },
    });

    if (paymentMethod) {
      await db.payment.create({
        data: {
          invoiceId,
          paymentMethodId: paymentMethod.id,
          amount: paidAmount,
          reference: `ONLINE-${Date.now()}`,
          notes: 'Electronic payment via payment gateway',
        },
      });
    }

  } catch (error) {
    console.error('Error updating invoice payment status:', error);
  }
}

// GET - الحصول على حالة المعاملة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const gatewayTransactionId = searchParams.get('gatewayTransactionId');

    if (!transactionId && !gatewayTransactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID or Gateway Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId: transactionId || undefined },
          { gatewayTransactionId: gatewayTransactionId || undefined },
        ],
      },
      select: {
        transactionId: true,
        gatewayTransactionId: true,
        gatewayCode: true,
        amount: true,
        currency: true,
        status: true,
        initiatedAt: true,
        completedAt: true,
        errorMessage: true,
        errorCode: true,
        cardLast4: true,
        cardBrand: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });

  } catch (error) {
    console.error('Get transaction status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
