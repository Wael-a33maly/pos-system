// ============================================
// API إنشاء معاملة دفع جديدة
// Create Payment Transaction API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentManager, PaymentGatewayCode, Currency } from '@/lib/payments';

// التحقق من صحة المبلغ
function validateAmount(amount: number, currency: Currency, gatewayCode: PaymentGatewayCode): { valid: boolean; error?: string } {
  // التحقق من أن المبلغ رقم موجب
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }

  // الحد الأدنى والأقصى للمبلغ (بوابات محلية فقط: مدى و Apple Pay)
  const limits: Record<PaymentGatewayCode, { min: number; max: number }> = {
    mada: { min: 1, max: 100000 },
    apple_pay: { min: 1, max: 100000 },
  };

  const limit = limits[gatewayCode];
  if (limit && (amount < limit.min || amount > limit.max)) {
    return { valid: false, error: `Amount must be between ${limit.min} and ${limit.max} ${currency}` };
  }

  return { valid: true };
}

// توليد رقم معاملة فريد
async function generateTransactionId(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const transactionId = `PAY-${timestamp}-${random}`.toUpperCase();
  
  // التحقق من عدم وجود المعاملة
  const existing = await db.paymentTransaction.findUnique({
    where: { transactionId }
  });
  
  if (existing) {
    return generateTransactionId();
  }
  
  return transactionId;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    const {
      gatewayCode,
      amount,
      currency = 'SAR',
      invoiceId,
      orderId,
      customer,
      description,
      returnUrl,
      cancelUrl,
      metadata,
    } = body;

    if (!gatewayCode || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: gatewayCode, amount' },
        { status: 400 }
      );
    }

    // التحقق من صحة البوابة
    const gateway = paymentManager.getGateway(gatewayCode as PaymentGatewayCode);
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: `Unknown gateway: ${gatewayCode}` },
        { status: 400 }
      );
    }

    // التحقق من صحة المبلغ
    const amountValidation = validateAmount(
      parseFloat(amount),
      currency as Currency,
      gatewayCode as PaymentGatewayCode
    );
    
    if (!amountValidation.valid) {
      return NextResponse.json(
        { success: false, error: amountValidation.error },
        { status: 400 }
      );
    }

    // التحقق من أن البوابة متاحة
    if (!gateway.isAvailable()) {
      // محاولة تهيئة البوابة
      try {
        await paymentManager.initializeGateway(gatewayCode as PaymentGatewayCode);
      } catch (initError) {
        console.error('Failed to initialize gateway:', initError);
        return NextResponse.json(
          { success: false, error: 'Payment gateway is not available' },
          { status: 503 }
        );
      }
    }

    // توليد رقم المعاملة
    const transactionId = await generateTransactionId();

    // إنشاء سجل المعاملة في قاعدة البيانات
    const transaction = await db.paymentTransaction.create({
      data: {
        transactionId,
        gatewayCode,
        invoiceId: invoiceId || null,
        orderId: orderId || null,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        customerId: customer?.id || null,
        customerEmail: customer?.email || null,
        customerPhone: customer?.phone || null,
        customerName: customer?.name || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // تسجيل الحدث
    await db.paymentTransactionLog.create({
      data: {
        transactionId: transaction.id,
        action: 'created',
        status: 'pending',
        message: 'Payment transaction created',
        data: JSON.stringify({ gatewayCode, amount, currency }),
      },
    });

    // إنشاء طلب الدفع عبر البوابة
    const paymentOrder = {
      id: transactionId,
      invoiceId,
      amount: {
        value: parseFloat(amount),
        currency: currency as Currency,
      },
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      } : undefined,
      description,
      returnUrl,
      cancelUrl,
      metadata,
    };

    const result = await gateway.createPayment(paymentOrder);

    // تحديث سجل المعاملة
    if (result.success) {
      await db.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          gatewayTransactionId: result.gatewayTransactionId,
          status: result.status,
          gatewayResponse: JSON.stringify(result.metadata || {}),
        },
      });

      await db.paymentTransactionLog.create({
        data: {
          transactionId: transaction.id,
          action: 'gateway_response',
          status: result.status,
          message: 'Payment gateway response received',
          data: JSON.stringify(result),
        },
      });
    } else {
      await db.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          errorMessage: result.message,
          errorCode: result.errorCode,
        },
      });

      await db.paymentTransactionLog.create({
        data: {
          transactionId: transaction.id,
          action: 'gateway_error',
          status: 'failed',
          message: result.message || 'Payment creation failed',
          data: JSON.stringify(result),
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      transactionId,
      gatewayTransactionId: result.gatewayTransactionId,
      status: result.status,
      redirectUrl: result.redirectUrl,
      clientSecret: result.clientSecret,
      message: result.message,
      errorCode: result.errorCode,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// الحصول على معاملة بالمعرف
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { transactionId },
          { gatewayTransactionId: transactionId },
        ],
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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
      transaction: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        gatewayTransactionId: transaction.gatewayTransactionId,
        gatewayCode: transaction.gatewayCode,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        createdAt: transaction.initiatedAt,
        completedAt: transaction.completedAt,
        errorMessage: transaction.errorMessage,
        logs: transaction.logs.map(log => ({
          action: log.action,
          status: log.status,
          message: log.message,
          createdAt: log.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
