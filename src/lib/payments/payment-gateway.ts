// ============================================
// نظام بوابات الدفع الموحد
// Unified Payment Gateway System
// ============================================

import { db } from '@/lib/db';

// ==================== الأنواع الأساسية ====================

export type PaymentGatewayCode = 'mada' | 'apple_pay';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded' 
  | 'partial_refund';

export type Currency = 'SAR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'KWD' | 'QAR' | 'BHD';

// ==================== واجهات الدفع ====================

export interface PaymentAmount {
  value: number;
  currency: Currency;
}

export interface PaymentCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface PaymentOrder {
  id: string;
  invoiceId?: string;
  amount: PaymentAmount;
  customer?: PaymentCustomer;
  description?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  message?: string;
  errorCode?: string;
  redirectUrl?: string;
  clientSecret?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}

export interface PaymentVerification {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  amount?: number;
  currency?: Currency;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookEvent {
  gateway: PaymentGatewayCode;
  eventId: string;
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature?: string;
}

export interface GatewayConfig {
  enabled: boolean;
  testMode: boolean;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  webhookSecret?: string;
  returnUrl?: string;
  cancelUrl?: string;
  supportedCurrencies: Currency[];
  minAmount?: number;
  maxAmount?: number;
  metadata?: Record<string, unknown>;
}

// ==================== واجهة البوابة الأساسية ====================

export interface IPaymentGateway {
  readonly code: PaymentGatewayCode;
  readonly name: string;
  readonly nameAr: string;
  readonly icon: string;
  
  // العمليات الأساسية
  initialize(config: GatewayConfig): Promise<void>;
  createPayment(order: PaymentOrder): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerification>;
  refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult>;
  
  // معلومات البوابة
  getConfig(): GatewayConfig;
  isAvailable(): boolean;
  getSupportedCurrencies(): Currency[];
  
  // التحقق من صحة الويب هوك
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: string): WebhookEvent | null;
}

// ==================== الفئة الأساسية للبوابات ====================

export abstract class BasePaymentGateway implements IPaymentGateway {
  abstract readonly code: PaymentGatewayCode;
  abstract readonly name: string;
  abstract readonly nameAr: string;
  abstract readonly icon: string;
  
  protected config: GatewayConfig | null = null;
  
  async initialize(config: GatewayConfig): Promise<void> {
    this.config = config;
  }
  
  abstract createPayment(order: PaymentOrder): Promise<PaymentResult>;
  abstract verifyPayment(transactionId: string): Promise<PaymentVerification>;
  abstract refund(transactionId: string, amount: number, reason?: string): Promise<RefundResult>;
  
  getConfig(): GatewayConfig {
    return this.config || {
      enabled: false,
      testMode: true,
      supportedCurrencies: [],
    };
  }
  
  isAvailable(): boolean {
    return this.config?.enabled ?? false;
  }
  
  getSupportedCurrencies(): Currency[] {
    return this.config?.supportedCurrencies ?? [];
  }
  
  abstract verifyWebhookSignature(payload: string, signature: string): boolean;
  abstract parseWebhookEvent(payload: string): WebhookEvent | null;
  
  // دوال مساعدة
  protected validateAmount(amount: PaymentAmount): boolean {
    if (amount.value <= 0) return false;
    if (this.config?.minAmount && amount.value < this.config.minAmount) return false;
    if (this.config?.maxAmount && amount.value > this.config.maxAmount) return false;
    if (!this.getSupportedCurrencies().includes(amount.currency)) return false;
    return true;
  }
  
  protected formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100; // تقريب لمنزلتين عشريتين
  }
  
  protected generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY-${timestamp}-${random}`.toUpperCase();
  }
}

// ==================== مدير البوابات ====================

export class PaymentGatewayManager {
  private static instance: PaymentGatewayManager;
  private gateways: Map<PaymentGatewayCode, IPaymentGateway> = new Map();
  private configs: Map<PaymentGatewayCode, GatewayConfig> = new Map();
  
  private constructor() {}
  
  static getInstance(): PaymentGatewayManager {
    if (!PaymentGatewayManager.instance) {
      PaymentGatewayManager.instance = new PaymentGatewayManager();
    }
    return PaymentGatewayManager.instance;
  }
  
  // تسجيل بوابة دفع
  registerGateway(gateway: IPaymentGateway): void {
    this.gateways.set(gateway.code, gateway);
  }
  
  // تهيئة بوابة من قاعدة البيانات
  async initializeGateway(code: PaymentGatewayCode): Promise<void> {
    const gateway = this.gateways.get(code);
    if (!gateway) {
      throw new Error(`Gateway ${code} not registered`);
    }
    
    // جلب التكوين من قاعدة البيانات
    const config = await this.loadGatewayConfig(code);
    await gateway.initialize(config);
    this.configs.set(code, config);
  }
  
  // تهيئة جميع البوابات
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.gateways.keys()).map(code => 
      this.initializeGateway(code).catch(err => {
        console.error(`Failed to initialize gateway ${code}:`, err);
      })
    );
    await Promise.all(initPromises);
  }
  
  // الحصول على بوابة
  getGateway(code: PaymentGatewayCode): IPaymentGateway | undefined {
    return this.gateways.get(code);
  }
  
  // الحصول على البوابات المتاحة
  getAvailableGateways(): IPaymentGateway[] {
    return Array.from(this.gateways.values()).filter(g => g.isAvailable());
  }
  
  // الحصول على البوابات المناسبة لعملة معينة
  getGatewaysForCurrency(currency: Currency): IPaymentGateway[] {
    return this.getAvailableGateways().filter(g => 
      g.getSupportedCurrencies().includes(currency)
    );
  }
  
  // تحميل تكوين البوابة من قاعدة البيانات
  private async loadGatewayConfig(code: PaymentGatewayCode): Promise<GatewayConfig> {
    try {
      // محاولة جلب التكوين من قاعدة البيانات
      const configFromDb = await db.paymentGatewayConfig.findUnique({
        where: { code }
      });
      
      if (configFromDb) {
        return {
          enabled: configFromDb.enabled,
          testMode: configFromDb.testMode,
          apiKey: configFromDb.apiKey || undefined,
          secretKey: configFromDb.secretKey || undefined,
          merchantId: configFromDb.merchantId || undefined,
          webhookSecret: configFromDb.webhookSecret || undefined,
          returnUrl: configFromDb.returnUrl || undefined,
          cancelUrl: configFromDb.cancelUrl || undefined,
          supportedCurrencies: (configFromDb.supportedCurrencies as Currency[]) || [],
          minAmount: configFromDb.minAmount || undefined,
          maxAmount: configFromDb.maxAmount || undefined,
          metadata: (configFromDb.metadata as Record<string, unknown>) || undefined,
        };
      }
    } catch (error) {
      console.error('Error loading gateway config from database:', error);
    }
    
    // التكوين الافتراضي من متغيرات البيئة
    return this.getDefaultConfig(code);
  }
  
  // التكوين الافتراضي من متغيرات البيئة
  private getDefaultConfig(code: PaymentGatewayCode): GatewayConfig {
    const envPrefix = code.toUpperCase().replace(/[^A-Z]/g, '_');
    
    const defaultConfigs: Record<PaymentGatewayCode, GatewayConfig> = {
      mada: {
        enabled: process.env.MADA_ENABLED === 'true',
        testMode: process.env.MADA_TEST_MODE !== 'false',
        apiKey: process.env.MADA_API_KEY,
        secretKey: process.env.MADA_SECRET_KEY,
        merchantId: process.env.MADA_MERCHANT_ID,
        supportedCurrencies: ['SAR'],
      },
      apple_pay: {
        enabled: process.env.APPLE_PAY_ENABLED === 'true',
        testMode: process.env.APPLE_PAY_TEST_MODE !== 'false',
        apiKey: process.env.APPLE_PAY_MERCHANT_ID,
        secretKey: process.env.APPLE_PAY_CERTIFICATE,
        supportedCurrencies: ['SAR', 'USD', 'EUR', 'GBP', 'AED'],
      },
    };
    
    return defaultConfigs[code] || {
      enabled: false,
      testMode: true,
      supportedCurrencies: [],
    };
  }
  
  // حفظ تكوين البوابة
  async saveGatewayConfig(code: PaymentGatewayCode, config: Partial<GatewayConfig>): Promise<void> {
    const currentConfig = this.configs.get(code) || {};
    const newConfig = { ...currentConfig, ...config };
    
    // حفظ في قاعدة البيانات
    await db.paymentGatewayConfig.upsert({
      where: { code },
      create: {
        code,
        name: code,
        enabled: newConfig.enabled ?? false,
        testMode: newConfig.testMode ?? true,
        apiKey: newConfig.apiKey || null,
        secretKey: newConfig.secretKey || null,
        merchantId: newConfig.merchantId || null,
        webhookSecret: newConfig.webhookSecret || null,
        returnUrl: newConfig.returnUrl || null,
        cancelUrl: newConfig.cancelUrl || null,
        supportedCurrencies: newConfig.supportedCurrencies || [],
        minAmount: newConfig.minAmount || null,
        maxAmount: newConfig.maxAmount || null,
        metadata: newConfig.metadata || {},
      },
      update: {
        enabled: newConfig.enabled ?? false,
        testMode: newConfig.testMode ?? true,
        apiKey: newConfig.apiKey || null,
        secretKey: newConfig.secretKey || null,
        merchantId: newConfig.merchantId || null,
        webhookSecret: newConfig.webhookSecret || null,
        returnUrl: newConfig.returnUrl || null,
        cancelUrl: newConfig.cancelUrl || null,
        supportedCurrencies: newConfig.supportedCurrencies || [],
        minAmount: newConfig.minAmount || null,
        maxAmount: newConfig.maxAmount || null,
        metadata: newConfig.metadata || {},
      },
    });
    
    this.configs.set(code, newConfig);
    
    // إعادة تهيئة البوابة
    const gateway = this.gateways.get(code);
    if (gateway) {
      await gateway.initialize(newConfig);
    }
  }
}

// تصدير المدير
export const paymentManager = PaymentGatewayManager.getInstance();

// ==================== دوال مساعدة ====================

export function formatCurrency(amount: number, currency: Currency): string {
  const formatters: Record<Currency, (n: number) => string> = {
    SAR: (n) => `${n.toFixed(2)} ر.س`,
    USD: (n) => `$${n.toFixed(2)}`,
    EUR: (n) => `€${n.toFixed(2)}`,
    GBP: (n) => `£${n.toFixed(2)}`,
    AED: (n) => `${n.toFixed(2)} د.إ`,
    KWD: (n) => `${n.toFixed(3)} د.ك`,
    QAR: (n) => `${n.toFixed(2)} ر.ق`,
    BHD: (n) => `${n.toFixed(3)} د.ب`,
  };
  return formatters[currency]?.(amount) ?? `${amount.toFixed(2)} ${currency}`;
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    cancelled: 'text-gray-600 bg-gray-50',
    refunded: 'text-purple-600 bg-purple-50',
    partial_refund: 'text-orange-600 bg-orange-50',
  };
  return colors[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): { ar: string; en: string } {
  const labels: Record<PaymentStatus, { ar: string; en: string }> = {
    pending: { ar: 'قيد الانتظار', en: 'Pending' },
    processing: { ar: 'قيد المعالجة', en: 'Processing' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    failed: { ar: 'فشل', en: 'Failed' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' },
    refunded: { ar: 'مسترد', en: 'Refunded' },
    partial_refund: { ar: 'استرداد جزئي', en: 'Partial Refund' },
  };
  return labels[status];
}
