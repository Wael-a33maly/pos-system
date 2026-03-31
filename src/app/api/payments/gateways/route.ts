// ============================================
// API إدارة بوابات الدفع
// Payment Gateways Management API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentManager, PaymentGatewayCode, GatewayConfig } from '@/lib/payments';

// معلومات البوابات المتاحة
const gatewayInfo: Record<PaymentGatewayCode, {
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  features: string[];
  supportedCurrencies: string[];
  requiresWebhook: boolean;
}> = {
  paypal: {
    name: 'PayPal',
    nameAr: 'باي بال',
    icon: '/icons/paypal.svg',
    description: 'Accept payments globally with PayPal',
    descriptionAr: 'قبول المدفوعات عالمياً عبر باي بال',
    features: ['International payments', 'Buyer protection', 'Express checkout'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
    requiresWebhook: true,
  },
  stripe: {
    name: 'Stripe',
    nameAr: 'سترايب',
    icon: '/icons/stripe.svg',
    description: 'Modern payment processing for internet businesses',
    descriptionAr: 'معالجة مدفوعات حديثة للأعمال الإلكترونية',
    features: ['Cards', 'Apple Pay', 'Google Pay', 'Payment links'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
    requiresWebhook: true,
  },
  mada: {
    name: 'Mada',
    nameAr: 'مدى',
    icon: '/icons/mada.svg',
    description: 'Saudi Arabian debit card network',
    descriptionAr: 'شبكة بطاقات الخصم السعودية',
    features: ['Debit cards', 'Local payments', 'Secure transactions'],
    supportedCurrencies: ['SAR'],
    requiresWebhook: true,
  },
  apple_pay: {
    name: 'Apple Pay',
    nameAr: 'آبل باي',
    icon: '/icons/apple-pay.svg',
    description: 'Fast and secure payments with Apple devices',
    descriptionAr: 'مدفوعات سريعة وآمنة عبر أجهزة آبل',
    features: ['Touch ID', 'Face ID', 'One-tap payment'],
    supportedCurrencies: ['SAR', 'USD', 'EUR', 'GBP', 'AED'],
    requiresWebhook: false,
  },
  stc_pay: {
    name: 'STC Pay',
    nameAr: 'STC Pay',
    icon: '/icons/stc-pay.svg',
    description: 'Digital wallet for Saudi Arabia',
    descriptionAr: 'محفظة رقمية للمملكة العربية السعودية',
    features: ['Mobile payments', 'Instant transfers', 'QR payments'],
    supportedCurrencies: ['SAR'],
    requiresWebhook: true,
  },
  tamara: {
    name: 'Tamara',
    nameAr: 'تمارا',
    icon: '/icons/tamara.svg',
    description: 'Buy now, pay later in Saudi Arabia',
    descriptionAr: 'اشتر الآن، ادفع لاحقاً في المملكة',
    features: ['Split payments', 'Interest-free', 'Instant approval'],
    supportedCurrencies: ['SAR', 'AED'],
    requiresWebhook: true,
  },
};

// GET - جلب جميع البوابات وإعداداتها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // جلب بوابة محددة
      const gatewayConfig = await db.paymentGatewayConfig.findUnique({
        where: { code },
      });

      const info = gatewayInfo[code as PaymentGatewayCode];

      return NextResponse.json({
        success: true,
        gateway: {
          code,
          ...info,
          config: gatewayConfig ? {
            enabled: gatewayConfig.enabled,
            testMode: gatewayConfig.testMode,
            hasApiKey: !!gatewayConfig.apiKey,
            hasSecretKey: !!gatewayConfig.secretKey,
            hasMerchantId: !!gatewayConfig.merchantId,
            hasWebhookSecret: !!gatewayConfig.webhookSecret,
            returnUrl: gatewayConfig.returnUrl,
            cancelUrl: gatewayConfig.cancelUrl,
            supportedCurrencies: gatewayConfig.supportedCurrencies,
            minAmount: gatewayConfig.minAmount,
            maxAmount: gatewayConfig.maxAmount,
            connectionStatus: gatewayConfig.connectionStatus,
            lastConnectedAt: gatewayConfig.lastConnectedAt,
            lastError: gatewayConfig.lastError,
          } : null,
        },
      });
    }

    // جلب جميع البوابات
    const configs = await db.paymentGatewayConfig.findMany();
    const configMap = new Map(configs.map(c => [c.code, c]));

    const gateways = Object.entries(gatewayInfo).map(([code, info]) => {
      const config = configMap.get(code);
      return {
        code,
        ...info,
        config: config ? {
          enabled: config.enabled,
          testMode: config.testMode,
          hasApiKey: !!config.apiKey,
          hasSecretKey: !!config.secretKey,
          hasMerchantId: !!config.merchantId,
          hasWebhookSecret: !!config.webhookSecret,
          returnUrl: config.returnUrl,
          cancelUrl: config.cancelUrl,
          supportedCurrencies: config.supportedCurrencies,
          minAmount: config.minAmount,
          maxAmount: config.maxAmount,
          connectionStatus: config.connectionStatus,
          lastConnectedAt: config.lastConnectedAt,
          lastError: config.lastError,
        } : {
          enabled: false,
          testMode: true,
          hasApiKey: false,
          hasSecretKey: false,
          hasMerchantId: false,
          hasWebhookSecret: false,
          connectionStatus: 'disconnected',
        },
      };
    });

    return NextResponse.json({
      success: true,
      gateways,
    });

  } catch (error) {
    console.error('Get gateways error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - تحديث إعدادات بوابة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      enabled,
      testMode,
      apiKey,
      secretKey,
      merchantId,
      webhookSecret,
      returnUrl,
      cancelUrl,
      supportedCurrencies,
      minAmount,
      maxAmount,
    } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gateway code is required' },
        { status: 400 }
      );
    }

    const info = gatewayInfo[code as PaymentGatewayCode];
    if (!info) {
      return NextResponse.json(
        { success: false, error: `Unknown gateway: ${code}` },
        { status: 400 }
      );
    }

    // بناء بيانات التحديث
    const updateData: Record<string, unknown> = {
      name: info.name,
      nameAr: info.nameAr,
      enabled: enabled ?? false,
      testMode: testMode ?? true,
    };

    // تحديث الحقول المقدمة فقط (لا نحفظ القيم الفارغة فوق القيم الموجودة)
    if (apiKey !== undefined) updateData.apiKey = apiKey || null;
    if (secretKey !== undefined) updateData.secretKey = secretKey || null;
    if (merchantId !== undefined) updateData.merchantId = merchantId || null;
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret || null;
    if (returnUrl !== undefined) updateData.returnUrl = returnUrl || null;
    if (cancelUrl !== undefined) updateData.cancelUrl = cancelUrl || null;
    if (supportedCurrencies !== undefined) updateData.supportedCurrencies = supportedCurrencies;
    if (minAmount !== undefined) updateData.minAmount = minAmount || null;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount || null;

    // حفظ أو تحديث التكوين
    const config = await db.paymentGatewayConfig.upsert({
      where: { code },
      create: updateData,
      update: updateData,
    });

    // تهيئة البوابة
    try {
      await paymentManager.saveGatewayConfig(code as PaymentGatewayCode, {
        enabled: config.enabled,
        testMode: config.testMode,
        apiKey: config.apiKey || undefined,
        secretKey: config.secretKey || undefined,
        merchantId: config.merchantId || undefined,
        webhookSecret: config.webhookSecret || undefined,
        returnUrl: config.returnUrl || undefined,
        cancelUrl: config.cancelUrl || undefined,
        supportedCurrencies: (config.supportedCurrencies as string[]) || info.supportedCurrencies,
        minAmount: config.minAmount || undefined,
        maxAmount: config.maxAmount || undefined,
      });

      // تحديث حالة الاتصال
      await db.paymentGatewayConfig.update({
        where: { code },
        data: {
          connectionStatus: enabled ? 'connected' : 'disconnected',
          lastConnectedAt: enabled ? new Date() : null,
          lastError: null,
        },
      });
    } catch (initError) {
      console.error('Gateway initialization error:', initError);
      
      await db.paymentGatewayConfig.update({
        where: { code },
        data: {
          connectionStatus: 'error',
          lastError: initError instanceof Error ? initError.message : 'Initialization failed',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Gateway configuration saved',
      config: {
        code,
        enabled: config.enabled,
        testMode: config.testMode,
        connectionStatus: config.connectionStatus,
      },
    });

  } catch (error) {
    console.error('Save gateway config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تكوين بوابة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gateway code is required' },
        { status: 400 }
      );
    }

    // لا نحذف التكوين فعلياً، بل نعطله فقط
    await db.paymentGatewayConfig.updateMany({
      where: { code },
      data: {
        enabled: false,
        connectionStatus: 'disconnected',
        apiKey: null,
        secretKey: null,
        merchantId: null,
        webhookSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gateway configuration reset',
    });

  } catch (error) {
    console.error('Delete gateway config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - اختبار اتصال البوابة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gateway code is required' },
        { status: 400 }
      );
    }

    const gateway = paymentManager.getGateway(code as PaymentGatewayCode);
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: `Unknown gateway: ${code}` },
        { status: 400 }
      );
    }

    // محاولة تهيئة البوابة
    try {
      await paymentManager.initializeGateway(code as PaymentGatewayCode);
      const isAvailable = gateway.isAvailable();

      await db.paymentGatewayConfig.update({
        where: { code },
        data: {
          connectionStatus: isAvailable ? 'connected' : 'error',
          lastConnectedAt: isAvailable ? new Date() : null,
          lastError: isAvailable ? null : 'Gateway not available',
        },
      });

      return NextResponse.json({
        success: isAvailable,
        message: isAvailable ? 'Connection successful' : 'Connection failed',
      });
    } catch (testError) {
      await db.paymentGatewayConfig.update({
        where: { code },
        data: {
          connectionStatus: 'error',
          lastError: testError instanceof Error ? testError.message : 'Connection test failed',
        },
      });

      return NextResponse.json({
        success: false,
        message: testError instanceof Error ? testError.message : 'Connection test failed',
      });
    }

  } catch (error) {
    console.error('Test gateway connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
