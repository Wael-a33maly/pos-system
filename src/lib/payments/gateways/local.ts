// ============================================
// بوابات الدفع المحلية السعودية
// Local Payment Gateways (Mada, Apple Pay)
// ============================================

import {
  BasePaymentGateway,
  GatewayConfig,
  PaymentOrder,
  PaymentResult,
  PaymentVerification,
  RefundResult,
  WebhookEvent,
  PaymentGatewayCode,
  PaymentStatus,
} from '../payment-gateway';

// ==================== أنواع البوابات المحلية ====================

interface MadaPaymentResponse {
  transactionId: string;
  status: string;
  authCode: string;
  rrn: string;
  amount: number;
  currency: string;
  cardType: string;
  cardLast4: string;
}

interface ApplePaySession {
  epochTimestamp: number;
  expiresAt: number;
  merchantSessionIdentifier: string;
  nonce: string;
  merchantIdentifier: string;
  domainName: string;
  displayName: string;
  signature: string;
}

// ==================== بوابة مدى (Mada) ====================

export class MadaGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'mada';
  readonly name = 'Mada';
  readonly nameAr = 'مدى';
  readonly icon = '/icons/mada.svg';

  // الحصول على URL بناءً على البيئة
  private getBaseUrl(): string {
    return this.config?.testMode
      ? 'https://api.test.mada.com.sa/v2'
      : 'https://api.mada.com.sa/v2';
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'Mada gateway is not available',
        };
      }

      if (!this.validateAmount(order.amount)) {
        return {
          success: false,
          status: 'failed',
          message: 'Invalid amount or currency not supported (SAR only)',
        };
      }

      const config = this.getConfig();

      // محاكاة استجابة مدى (لأن الـ API الفعلي يتطلب اشتراك)
      // في الإنتاج، سيتم استبدال هذا بطلب API حقيقي
      
      const transactionId = this.generateTransactionId();
      
      // بناء بيانات الدفع
      const paymentData = {
        merchantId: config.merchantId,
        amount: this.formatAmount(order.amount.value),
        currency: 'SAR',
        orderId: order.id,
        callbackUrl: order.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/mada`,
        returnUrl: order.returnUrl || config.returnUrl,
        customerInfo: order.customer ? {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        } : undefined,
      };

      // محاكاة استجابة ناجحة
      const mockResponse: MadaPaymentResponse = {
        transactionId: `MADA-${Date.now()}`,
        status: 'PENDING',
        authCode: '',
        rrn: '',
        amount: order.amount.value,
        currency: 'SAR',
        cardType: 'MADA',
        cardLast4: '',
      };

      return {
        success: true,
        transactionId,
        gatewayTransactionId: mockResponse.transactionId,
        status: 'pending',
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/mada/process?token=${transactionId}`,
        metadata: {
          madaTransactionId: mockResponse.transactionId,
          paymentData,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      // في الإنتاج، سيتم التحقق من خلال API مدى
      // هذا محاكاة للعرض
      
      return {
        success: true,
        transactionId,
        status: 'completed',
        amount: 0, // سيتم جلبه من API
        currency: 'SAR',
        paidAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    try {
      // محاكاة استرداد المبلغ
      return {
        success: true,
        refundId: `REFUND-${Date.now()}`,
        amount,
        status: 'completed',
      };
    } catch (error) {
      return {
        success: false,
        amount,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = this.getConfig();
    return config.webhookSecret ? signature.length > 0 : true;
  }

  parseWebhookEvent(payload: string): WebhookEvent | null {
    try {
      const data = JSON.parse(payload);
      return {
        gateway: 'mada',
        eventId: data.eventId || Date.now().toString(),
        eventType: data.eventType || 'payment.completed',
        timestamp: new Date(data.timestamp || Date.now()),
        data,
      };
    } catch {
      return null;
    }
  }
}

// ==================== بوابة Apple Pay ====================

export class ApplePayGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'apple_pay';
  readonly name = 'Apple Pay';
  readonly nameAr = 'آبل باي';
  readonly icon = '/icons/apple-pay.svg';

  // Apple Pay لا يتطلب API خارجي للدفع
  // يتم معالجة الدفع من خلال Payment Provider

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'Apple Pay is not available',
        };
      }

      const transactionId = this.generateTransactionId();
      const config = this.getConfig();

      return {
        success: true,
        transactionId,
        gatewayTransactionId: `APPLE-PAY-${Date.now()}`,
        status: 'pending',
        metadata: {
          merchantId: config.merchantId,
          amount: order.amount.value,
          currency: order.amount.currency,
          orderId: order.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    return {
      success: true,
      transactionId,
      status: 'completed',
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REFUND-APPLE-${Date.now()}`,
      amount,
      status: 'completed',
    };
  }

  // التحقق من جلسة Apple Pay
  async validateMerchantSession(validationURL: string): Promise<ApplePaySession | null> {
    try {
      const config = this.getConfig();
      
      const response = await fetch(validationURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantIdentifier: config.merchantId,
          displayName: process.env.NEXT_PUBLIC_APP_NAME || 'POS System',
          initiative: 'web',
          initiativeContext: process.env.NEXT_PUBLIC_APP_URL?.replace('https://', ''),
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return signature.length > 0;
  }

  parseWebhookEvent(payload: string): WebhookEvent | null {
    try {
      const data = JSON.parse(payload);
      return {
        gateway: 'apple_pay',
        eventId: data.id || Date.now().toString(),
        eventType: data.type || 'payment.completed',
        timestamp: new Date(data.timestamp || Date.now()),
        data,
      };
    } catch {
      return null;
    }
  }
}

// ==================== تصدير البوابات ====================

export const madaGateway = new MadaGateway();
export const applePayGateway = new ApplePayGateway();
