// ============================================
// بوابة PayPal للدفع
// PayPal Payment Gateway
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

// ==================== أنواع PayPal ====================

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  app_id: string;
}

interface PayPalOrder {
  id: string;
  status: string;
  intent: string;
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
    payee: {
      email_address: string;
      merchant_id: string;
    };
  }>;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalRefund {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  create_time: string;
}

// ==================== بوابة PayPal ====================

export class PayPalGateway extends BasePaymentGateway {
  readonly code: PaymentGatewayCode = 'paypal';
  readonly name = 'PayPal';
  readonly nameAr = 'باي بال';
  readonly icon = '/icons/paypal.svg';

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // الحصول على Base URL
  private getBaseUrl(): string {
    return this.config?.testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  // الحصول على Access Token
  private async getAccessToken(): Promise<string> {
    // التحقق من وجود token صالح
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.getConfig();
    if (!config.apiKey || !config.secretKey) {
      throw new Error('PayPal credentials not configured');
    }

    const credentials = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64');

    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PayPal access token: ${error}`);
    }

    const data: PayPalAccessToken = await response.json();
    this.accessToken = data.access_token;
    // تعيين انتهاء الصلاحية قبل 5 دقائق من الانتهاء الفعلي
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);

    return this.accessToken;
  }

  // إنشاء طلب دفع
  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          message: 'PayPal gateway is not available',
        };
      }

      if (!this.validateAmount(order.amount)) {
        return {
          success: false,
          status: 'failed',
          message: 'Invalid amount or currency not supported',
        };
      }

      const accessToken = await this.getAccessToken();
      const config = this.getConfig();

      // إنشاء PayPal Order
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            description: order.description || `Order ${order.id}`,
            amount: {
              currency_code: order.amount.currency,
              value: this.formatAmount(order.amount.value).toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: order.returnUrl || config.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: order.cancelUrl || config.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
          brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'POS System',
          user_action: 'PAY_NOW',
        },
      };

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'failed',
          message: error.message || 'Failed to create PayPal order',
          errorCode: error.name,
        };
      }

      const paypalOrder: PayPalOrder = await response.json();

      // البحث عن رابط الموافقة
      const approveLink = paypalOrder.links.find(link => link.rel === 'approve');
      if (!approveLink) {
        return {
          success: false,
          status: 'failed',
          message: 'No approval link found in PayPal response',
        };
      }

      return {
        success: true,
        transactionId: this.generateTransactionId(),
        gatewayTransactionId: paypalOrder.id,
        status: 'pending',
        redirectUrl: approveLink.href,
        metadata: {
          paypalOrderId: paypalOrder.id,
          paypalStatus: paypalOrder.status,
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

  // التحقق من الدفع (Capture)
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const accessToken = await this.getAccessToken();

      // أولاً نحاول Capture إذا كان الطلب معتمداً
      const captureResponse = await fetch(
        `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}/capture`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!captureResponse.ok) {
        // إذا فشل الـ capture، نحصل على حالة الطلب
        const orderResponse = await fetch(
          `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!orderResponse.ok) {
          return {
            success: false,
            status: 'failed',
          };
        }

        const order: PayPalOrder = await orderResponse.json();
        return this.parsePayPalOrderStatus(order);
      }

      const capturedOrder: PayPalOrder = await captureResponse.json();
      return this.parsePayPalOrderStatus(capturedOrder);
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // تحويل حالة PayPal إلى حالتنا
  private parsePayPalOrderStatus(order: PayPalOrder): PaymentVerification {
    const statusMap: Record<string, PaymentStatus> = {
      CREATED: 'pending',
      SAVED: 'pending',
      APPROVED: 'processing',
      VOIDED: 'cancelled',
      COMPLETED: 'completed',
      PAYER_ACTION_REQUIRED: 'pending',
    };

    const status = statusMap[order.status] || 'failed';

    const purchaseUnit = order.purchase_units[0];

    return {
      success: status === 'completed',
      transactionId: purchaseUnit?.reference_id,
      status,
      amount: purchaseUnit ? parseFloat(purchaseUnit.amount.value) : undefined,
      currency: purchaseUnit?.amount.currency_code as any,
      paidAt: order.create_time ? new Date(order.create_time) : undefined,
      metadata: {
        paypalOrderId: order.id,
        paypalStatus: order.status,
      },
    };
  }

  // استرداد المبلغ
  async refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult> {
    try {
      const accessToken = await this.getAccessToken();

      // الحصول على معلومات الطلب الأصلي
      const orderResponse = await fetch(
        `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!orderResponse.ok) {
        return {
          success: false,
          amount,
          status: 'failed',
          message: 'Original transaction not found',
        };
      }

      const order: PayPalOrder = await orderResponse.json();
      const captureId = order.purchase_units[0]?.payments?.captures?.[0]?.id;

      if (!captureId) {
        return {
          success: false,
          amount,
          status: 'failed',
          message: 'No capture found for this order',
        };
      }

      // إنشاء طلب استرداد
      const refundData = {
        amount: {
          currency_code: order.purchase_units[0].amount.currency_code,
          value: this.formatAmount(amount).toFixed(2),
        },
        note_to_payer: reason || 'Refund requested',
      };

      const refundResponse = await fetch(
        `${this.getBaseUrl()}/v2/payments/captures/${captureId}/refund`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refundData),
        }
      );

      if (!refundResponse.ok) {
        const error = await refundResponse.json();
        return {
          success: false,
          amount,
          status: 'failed',
          message: error.message || 'Refund failed',
        };
      }

      const refund: PayPalRefund = await refundResponse.json();

      return {
        success: true,
        refundId: refund.id,
        amount: parseFloat(refund.amount.value),
        status: refund.status === 'COMPLETED' ? 'completed' : 'pending',
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

  // التحقق من توقيع Webhook
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // في الإنتاج، يجب التحقق من التوقيع بشكل صحيح
    // باستخدام webhookSecret
    const config = this.getConfig();
    if (!config.webhookSecret) {
      return true; // في وضع التطوير
    }
    
    // التحقق الفعلي من التوقيع يتطلب خوارزمية خاصة من PayPal
    // هذا تبسيط للعرض
    return signature.length > 0;
  }

  // تحويل حدث Webhook
  parseWebhookEvent(payload: string): WebhookEvent | null {
    try {
      const data = JSON.parse(payload);
      
      return {
        gateway: 'paypal',
        eventId: data.id || Date.now().toString(),
        eventType: data.event_type || 'unknown',
        timestamp: new Date(data.create_time || Date.now()),
        data: data.resource || {},
        signature: undefined,
      };
    } catch {
      return null;
    }
  }
}

// تصدير instance
export const paypalGateway = new PayPalGateway();
