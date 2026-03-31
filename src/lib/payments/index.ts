// ============================================
// تصدير نظام بوابات الدفع
// Payment Gateways Export
// ============================================

// النظام الأساسي
export * from './payment-gateway';

// البوابات
export * from './gateways/paypal';
export * from './gateways/stripe';
export * from './gateways/local';

// تهيئة مدير البوابات
import { paymentManager } from './payment-gateway';
import { paypalGateway } from './gateways/paypal';
import { stripeGateway } from './gateways/stripe';
import { madaGateway, applePayGateway, stcPayGateway, tamaraGateway } from './gateways/local';

// تسجيل البوابات
export function initializeGateways(): void {
  paymentManager.registerGateway(paypalGateway);
  paymentManager.registerGateway(stripeGateway);
  paymentManager.registerGateway(madaGateway);
  paymentManager.registerGateway(applePayGateway);
  paymentManager.registerGateway(stcPayGateway);
  paymentManager.registerGateway(tamaraGateway);
}

// تهيئة مدير البوابات تلقائياً
initializeGateways();

export { paymentManager };
