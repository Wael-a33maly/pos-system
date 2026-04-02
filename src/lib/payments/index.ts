// ============================================
// تصدير نظام بوابات الدفع
// Payment Gateways Export
// ============================================

// النظام الأساسي
export * from './payment-gateway';

// البوابات المحلية (مدى و Apple Pay فقط)
export * from './gateways/local';

// تهيئة مدير البوابات
import { paymentManager } from './payment-gateway';
import { madaGateway, applePayGateway } from './gateways/local';

// تسجيل البوابات
export function initializeGateways(): void {
  paymentManager.registerGateway(madaGateway);
  paymentManager.registerGateway(applePayGateway);
}

// تهيئة مدير البوابات تلقائياً
initializeGateways();

export { paymentManager };
