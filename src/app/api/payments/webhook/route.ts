// ============================================
// API استقبال Webhooks من بوابات الدفع
// Payment Webhooks API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentManager, PaymentGatewayCode, WebhookEvent } from '@/lib/payments';

// معالجة حدث webhook
async function processWebhookEvent(
  gatewayCode: PaymentGatewayCode,
  payload: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // الحصول على البوابة
    const gateway = paymentManager.getGateway(gatewayCode);
    if (!gateway) {
      return { success: false, error: `Unknown gateway: ${gatewayCode}` };
    }

    // التحقق من التوقيع
    if (!gateway.verifyWebhookSignature(payload, signature)) {
      return { success: false, error: 'Invalid webhook signature' };
    }

    // تحويل الحدث
    const event = gateway.parseWebhookEvent(payload);
    if (!event) {
      return { success: false, error: 'Failed to parse webhook event' };
    }

    // حفظ الحدث في قاعدة البيانات
    const webhookEvent = await db.paymentWebhookEvent.create({
      data: {
        gatewayCode,
        eventId: event.eventId,
        eventType: event.eventType,
        payload,
        signature,
      },
    });

    // معالجة الحدث بناءً على نوعه
    await handleWebhookEvent(gatewayCode, event, webhookEvent.id);

    // تحديث حالة المعالجة
    await db.paymentWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { success: false, error: 'Internal processing error' };
  }
}

// معالجة أنواع أحداث Webhook المختلفة
async function handleWebhookEvent(
  gatewayCode: PaymentGatewayCode,
  event: WebhookEvent,
  webhookEventId: string
): Promise<void> {
  const { eventType, data } = event;

  // تحديد نوع الحدث والمعاملة المرتبطة
  let transactionId: string | undefined;
  let updateData: Record<string, unknown> = {};

  switch (eventType) {
    // PayPal events
    case 'CHECKOUT.ORDER.APPROVED':
    case 'PAYMENT.CAPTURE.COMPLETED':
      transactionId = (data as Record<string, unknown>).reference_id as string || 
                      (data as Record<string, unknown>).invoice_id as string;
      updateData = {
        status: 'completed',
        completedAt: new Date(),
        processedAt: new Date(),
      };
      break;

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REFUNDED':
      transactionId = (data as Record<string, unknown>).reference_id as string;
      updateData = {
        status: eventType.includes('REFUNDED') ? 'refunded' : 'failed',
        processedAt: new Date(),
      };
      break;

    // Stripe events
    case 'payment_intent.succeeded': {
      const metadata = (data as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      transactionId = metadata?.orderId as string || (data as Record<string, unknown>).id as string;
      updateData = {
        status: 'completed',
        completedAt: new Date(),
        processedAt: new Date(),
        gatewayTransactionId: (data as Record<string, unknown>).id,
      };
      break;
    }

    case 'payment_intent.payment_failed': {
      const metadata = (data as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const lastPaymentError = (data as Record<string, unknown>).last_payment_error as Record<string, unknown> | undefined;
      transactionId = metadata?.orderId as string || (data as Record<string, unknown>).id as string;
      updateData = {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: lastPaymentError?.message as string,
      };
      break;
    }

    case 'charge.refunded':
      transactionId = (data as Record<string, unknown>).payment_intent as string;
      updateData = {
        status: 'refunded',
        refundedAt: new Date(),
        refundAmount: (data as Record<string, unknown>).amount_refunded,
      };
      break;

    // Mada events
    case 'payment.completed':
      transactionId = (data as Record<string, unknown>).orderId as string ||
                      (data as Record<string, unknown>).transactionId as string;
      updateData = {
        status: 'completed',
        completedAt: new Date(),
        processedAt: new Date(),
      };
      break;

    case 'payment.failed':
      transactionId = (data as Record<string, unknown>).orderId as string ||
                      (data as Record<string, unknown>).transactionId as string;
      updateData = {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: (data as Record<string, unknown>).errorMessage as string,
      };
      break;

    // Tamara events
    case 'order.authorised':
    case 'order.captured':
      transactionId = (data as Record<string, unknown>).order_reference_id as string ||
                      (data as Record<string, unknown>).order_id as string;
      updateData = {
        status: 'completed',
        completedAt: new Date(),
        processedAt: new Date(),
      };
      break;

    case 'order.cancelled':
      transactionId = (data as Record<string, unknown>).order_reference_id as string ||
                      (data as Record<string, unknown>).order_id as string;
      updateData = {
        status: 'cancelled',
        processedAt: new Date(),
      };
      break;

    default:
      // حدث غير معروف، نسجل فقط
      console.log(`Unknown webhook event type: ${eventType}`);
      return;
  }

  if (!transactionId) {
    console.log(`No transaction ID found for event: ${eventType}`);
    return;
  }

  // البحث عن المعاملة وتحديثها
  const transaction = await db.paymentTransaction.findFirst({
    where: {
      OR: [
        { transactionId },
        { gatewayTransactionId: transactionId },
      ],
    },
  });

  if (!transaction) {
    console.log(`Transaction not found for event: ${eventType}, transactionId: ${transactionId}`);
    return;
  }

  // تحديث المعاملة
  await db.paymentTransaction.update({
    where: { id: transaction.id },
    data: updateData,
  });

  // تسجيل الحدث
  await db.paymentTransactionLog.create({
    data: {
      transactionId: transaction.id,
      action: 'webhook_received',
      status: updateData.status as string,
      message: `Webhook event: ${eventType}`,
      data: JSON.stringify({ eventType, webhookEventId }),
    },
  });

  // تحديث رابط الـ webhook event
  await db.paymentWebhookEvent.update({
    where: { id: webhookEventId },
    data: { transactionId: transaction.id },
  });

  // إذا تم الدفع بنجاح، تحديث الفاتورة
  if (updateData.status === 'completed' && transaction.invoiceId) {
    await updateInvoiceFromWebhook(transaction.invoiceId, transaction.amount);
  }
}

// تحديث الفاتورة من الـ webhook
async function updateInvoiceFromWebhook(invoiceId: string, paidAmount: number): Promise<void> {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + paidAmount;

    let paymentStatus = 'PARTIAL';
    if (totalPaid >= invoice.totalAmount) {
      paymentStatus = 'PAID';
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        paymentStatus,
      },
    });
  } catch (error) {
    console.error('Error updating invoice from webhook:', error);
  }
}

// POST endpoint للـ webhooks
export async function POST(request: NextRequest) {
  try {
    // تحديد البوابة من الـ header أو الـ URL
    const gatewayCode = request.headers.get('x-gateway') as PaymentGatewayCode ||
                        request.nextUrl.searchParams.get('gateway') as PaymentGatewayCode;

    if (!gatewayCode) {
      return NextResponse.json(
        { success: false, error: 'Gateway not specified' },
        { status: 400 }
      );
    }

    // الحصول على الـ payload والتوقيع
    const payload = await request.text();
    const signature = request.headers.get('x-signature') ||
                      request.headers.get('stripe-signature') ||
                      request.headers.get('paypal-transmission-sig') ||
                      '';

    // معالجة الحدث
    const result = await processWebhookEvent(gatewayCode, payload, signature);

    if (result.success) {
      return NextResponse.json({ success: true, received: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint للتحقق من صحة الـ webhook endpoint
export async function GET(request: NextRequest) {
  const gatewayCode = request.nextUrl.searchParams.get('gateway');
  
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    gateway: gatewayCode || 'all',
    timestamp: new Date().toISOString(),
  });
}
