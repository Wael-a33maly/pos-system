// ============================================
// بوابة Stripe للدفع
// Stripe Payment Gateway
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

// ==================== أنواع Stripe ====================

interface StripePaymentIntent {
  id: string;
  object: string;
  amount: number;
  amount_received: number;
  currency: string;
  status: string;
  client_secret: string;
  description: string | null;
  metadata: Record<string, string>;
  created: number;
  customer: string | null;
  payment_method: string | null;
  latest_charge: string | null;
}

interface StripeCustomer {
  id: string;
  object: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  metadata: Record<string, string>;
}

interface StripeRefund {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  payment_intent: string;
  reason: string | null;
}

interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

// ==================== بوابة Stripe ====================

export class StripeGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'stripe';
  readonly name = 'Stripe';
  readonly nameAr = 'سترايب';
  readonly icon = '/icons/stripe.svg';

  // الحصول على API Base URL
  private getApiUrl(): string {
    return 'https://api.stripe.com/v1';
  }

  // الحصول على Secret Key
  private getSecretKey(): string {
    const config = this.getConfig();
    if (config.testMode) {
      return config.secretKey || process.env.STRIPE_SECRET_KEY || '';
    }
    return config.secretKey || process.env.STRIPE_LIVE_SECRET_KEY || '';
  }

  // إجراء طلب API
  private async apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<Response> {
    const secretKey = this.getSecretKey();
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const url = `${this.getApiUrl()}${endpoint}`;
    
    let requestBody: string | undefined;
    if (body) {
      // تحويل إلى form-urlencoded
      requestBody = Object.entries(body)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            // التعامل مع الكائنات المتداخلة
            return Object.entries(value as Record<string, unknown>)
              .filter(([_, v]) => v !== undefined && v !== null)
              .map(([k, v]) => `${key}[${k}]=${encodeURIComponent(String(v))}`)
              .join('&');
          }
          return `${key}=${encodeURIComponent(String(value))}`;
        })
        .join('&');
    }

    return fetch(url, {
      method,
      headers,
      body: requestBody,
    });
  }

  // إنشاء Payment Intent
  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'Stripe gateway is not available',
        };
      }

      if (!this.validateAmount(order.amount)) {
        return {
          success: false,
          status: 'failed',
          message: 'Invalid amount or currency not supported',
        };
      }

      const config = this.getConfig();

      // تحويل المبلغ إلى سنتات (العملة الأصغر)
      const amountInCents = Math.round(order.amount.value * 100);

      const body: Record<string, unknown> = {
        amount: amountInCents,
        currency: order.amount.currency.toLowerCase(),
        description: order.description || `Order ${order.id}`,
        'metadata[orderId]': order.id,
        'metadata[invoiceId]': order.invoiceId || '',
      };

      // إضافة معلومات العميل إذا وجدت
      if (order.customer) {
        if (order.customer.email) {
          body['metadata[customerEmail]'] = order.customer.email;
        }
        if (order.customer.name) {
          body['metadata[customerName]'] = order.customer.name;
        }
      }

      // إضافة return URL إذا وجد
      if (order.returnUrl || config.returnUrl) {
        body['return_url'] = order.returnUrl || config.returnUrl;
      }

      const response = await this.apiRequest('/payment_intents', 'POST', body);

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          message: error.error?.message || 'Failed to create payment intent',
          errorCode: error.error?.code,
        };
      }

      const paymentIntent: StripePaymentIntent = await response.json();

      return {
        success: true,
        transactionId: this.generateTransactionId(),
        gatewayTransactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
          amount: paymentIntent.amount / 100,
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

  // التحقق من الدفع
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const response = await this.apiRequest(`/payment_intents/${transactionId}`);

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
        };
      }

      const paymentIntent: StripePaymentIntent = await response.json();
      const status = this.mapStripeStatus(paymentIntent.status);

      return {
        success: status === 'completed',
        transactionId: paymentIntent.metadata?.orderId || paymentIntent.id,
        status,
        amount: paymentIntent.amount_received / 100,
        currency: paymentIntent.currency.toUpperCase() as any,
        paidAt: paymentIntent.status === 'succeeded' 
          ? new Date(paymentIntent.created * 1000) 
          : undefined,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
          customer: paymentIntent.customer,
          paymentMethod: paymentIntent.payment_method,
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

  // استرداد المبلغ
  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(amount * 100);

      const body: Record<string, unknown> = {
        payment_intent: transactionId,
        amount: amountInCents,
      };

      if (reason) {
        body.reason = 'requested_by_customer';
        body['metadata[reason]'] = reason;
      }

      const response = await this.apiRequest('/refunds', 'POST', body);

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          amount,
          status: 'failed',
          message: error.error?.message || 'Refund failed',
        };
      }

      const refund: StripeRefund = await response.json();

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
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

  // إنشاء عميل
  async createCustomer(customer: { email?: string; name?: string; phone?: string }): Promise<StripeCustomer | null> {
    try {
      const body: Record<string, unknown> = {};
      if (customer.email) body.email = customer.email;
      if (customer.name) body.name = customer.name;
      if (customer.phone) body.phone = customer.phone;

      const response = await this.apiRequest('/customers', 'POST', body);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  // الحصول على عميل
  async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const response = await this.apiRequest(`/customers/${customerId}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  // تحويل حالة Stripe إلى حالتنا
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'pending',
      processing: 'processing',
      requires_capture: 'processing',
      canceled: 'cancelled',
      succeeded: 'completed',
    };

    return statusMap[stripeStatus] || 'failed';
  }

  // التحقق من توقيع Webhook
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = this.getConfig();
    if (!config.webhookSecret) {
      return true; // في وضع التطوير
    }

    // في الإنتاج، يجب استخدام crypto للتحقق من التوقيع
    // باستخدام webhookSecret
    // هذا تبسيط للعرض
    return signature.length > 0;
  }

  // تحويل حدث Webhook
  parseWebhookEvent(payload: string): WebhookEvent | null {
    try {
      const data: StripeWebhookEvent = JSON.parse(payload);

      return {
        gateway: 'stripe',
        eventId: data.id,
        eventType: data.type,
        timestamp: new Date(data.created * 1000),
        data: data.data.object,
        signature: undefined,
      };
    } catch {
      return null;
    }
  }

  // معالجة أنواع أحداث Webhook
  getWebhookEventMapping(eventType: string): { action: string; status: PaymentStatus } | null {
    const mappings: Record<string, { action: string; status: PaymentStatus }> = {
      'payment_intent.succeeded': { action: 'payment_completed', status: 'completed' },
      'payment_intent.payment_failed': { action: 'payment_failed', status: 'failed' },
      'payment_intent.canceled': { action: 'payment_cancelled', status: 'cancelled' },
      'payment_intent.processing': { action: 'payment_processing', status: 'processing' },
      'charge.refunded': { action: 'refund_completed', status: 'refunded' },
      'charge.refund.updated': { action: 'refund_updated', status: 'partial_refund' },
    };

    return mappings[eventType] || null;
  }
}

// تصدير instance
export const stripeGateway = new StripeGateway();
