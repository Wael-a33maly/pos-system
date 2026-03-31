// ============================================
// بوابات الدفع المحلية السعودية
// Local Payment Gateways (Mada, Apple Pay, STC Pay, Tamara)
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

interface STCPayResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  mobileNumber: string;
  paymentRef: string;
}

interface TamaraInstallment {
  orderId: string;
  status: string;
  totalAmount: number;
  currency: string;
  installmentPlan: {
    installmentsCount: number;
    installmentAmount: number;
  };
  checkoutUrl: string;
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

// ==================== بوابة STC Pay ====================

export class STCPayGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'stc_pay';
  readonly name = 'STC Pay';
  readonly nameAr = 'STC Pay';
  readonly icon = '/icons/stc-pay.svg';

  private getBaseUrl(): string {
    return this.config?.testMode
      ? 'https://api.test.stcpay.com.sa/api/v1'
      : 'https://api.stcpay.com.sa/api/v1';
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'STC Pay is not available',
        };
      }

      const transactionId = this.generateTransactionId();
      const config = this.getConfig();

      // بناء طلب الدفع
      const paymentRequest = {
        merchantId: config.merchantId,
        amount: order.amount.value,
        currency: 'SAR',
        orderId: order.id,
        description: order.description || `Order ${order.id}`,
        callbackUrl: order.webhookUrl,
        mobileNumber: order.customer?.phone,
      };

      // محاكاة استجابة
      const mockResponse: STCPayResponse = {
        transactionId: `STC-${Date.now()}`,
        status: 'PENDING',
        amount: order.amount.value,
        currency: 'SAR',
        mobileNumber: order.customer?.phone || '',
        paymentRef: `STC-REF-${Date.now()}`,
      };

      return {
        success: true,
        transactionId,
        gatewayTransactionId: mockResponse.transactionId,
        status: 'pending',
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/stc-pay/process?token=${transactionId}`,
        metadata: {
          stcTransactionId: mockResponse.transactionId,
          paymentRef: mockResponse.paymentRef,
          paymentRequest,
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
      currency: 'SAR',
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REFUND-STC-${Date.now()}`,
      amount,
      status: 'completed',
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return signature.length > 0;
  }

  parseWebhookEvent(payload: string): WebhookEvent | null {
    try {
      const data = JSON.parse(payload);
      return {
        gateway: 'stc_pay',
        eventId: data.transactionId || Date.now().toString(),
        eventType: data.status || 'payment.completed',
        timestamp: new Date(data.timestamp || Date.now()),
        data,
      };
    } catch {
      return null;
    }
  }
}

// ==================== بوابة تمارا (BNPL) ====================

export class TamaraGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'tamara';
  readonly name = 'Tamara';
  readonly nameAr = 'تمارا';
  readonly icon = '/icons/tamara.svg';

  private getBaseUrl(): string {
    return this.config?.testMode
      ? 'https://api-sandbox.tamara.co'
      : 'https://api.tamara.co';
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'Tamara is not available',
        };
      }

      const transactionId = this.generateTransactionId();
      const config = this.getConfig();

      // بناء طلب الدفع
      const checkoutRequest = {
        order_reference_id: order.id,
        total_amount: {
          value: this.formatAmount(order.amount.value),
          currency: order.amount.currency,
        },
        description: order.description || `Order ${order.id}`,
        country: 'SA',
        payment_type: 'PAY_BY_INSTALMENTS', // أو PAY_NOW أو PAY_IN_3
        instalments: 3,
        locale: 'ar-SA',
        items: [], // سيتم إضافة المنتجات
        consumer: order.customer ? {
          first_name: order.customer.name.split(' ')[0] || order.customer.name,
          last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
          email: order.customer.email || '',
          phone_number: order.customer.phone || '',
        } : undefined,
        merchant_url: {
          success_url: order.returnUrl || config.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          failure_url: order.cancelUrl || config.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
          cancel_url: order.cancelUrl || config.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
          notification_url: order.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/tamara`,
        },
      };

      // محاكاة استجابة
      const mockResponse: TamaraInstallment = {
        orderId: `TAMARA-${Date.now()}`,
        status: 'pending',
        totalAmount: order.amount.value,
        currency: order.amount.currency,
        installmentPlan: {
          installmentsCount: 3,
          installmentAmount: order.amount.value / 3,
        },
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/tamara/checkout?token=${transactionId}`,
      };

      return {
        success: true,
        transactionId,
        gatewayTransactionId: mockResponse.orderId,
        status: 'pending',
        redirectUrl: mockResponse.checkoutUrl,
        metadata: {
          tamaraOrderId: mockResponse.orderId,
          installmentPlan: mockResponse.installmentPlan,
          checkoutRequest,
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
      currency: 'SAR',
      paidAt: new Date(),
    };
  }

  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REFUND-TAMARA-${Date.now()}`,
      amount,
      status: 'completed',
    };
  }

  // التحقق من أهلية العميل للتقسيط
  async checkEligibility(customer: { phone: string; email: string }): Promise<boolean> {
    try {
      // في الإنتاج، سيتم استدعاء API تمارا
      // هذا محاكاة للعرض
      return true;
    } catch {
      return false;
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
        gateway: 'tamara',
        eventId: data.order_id || Date.now().toString(),
        eventType: data.event_type || 'payment.completed',
        timestamp: new Date(data.created_at || Date.now()),
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
export const stcPayGateway = new STCPayGateway();
export const tamaraGateway = new TamaraGateway();
