// ==================== قوالب الطباعة - ملف التصدير الرئيسي ====================

// تصدير القوالب
export * from './receipt-template';
export * from './z-report-template';
export * from './shift-close-template';

// تصدير الأنواع
export type {
  ReceiptTemplateConfig,
  ZReportTemplateConfig,
  ShiftCloseTemplateConfig,
} from './receipt-template';

// إعادة تصدير القوالب الافتراضية
export {
  DEFAULT_RECEIPT_TEMPLATE,
  COMPACT_RECEIPT_TEMPLATE,
  DETAILED_RECEIPT_TEMPLATE,
  ReceiptTemplateBuilder,
  receiptTemplates,
} from './receipt-template';

export {
  DEFAULT_Z_REPORT_TEMPLATE,
  COMPACT_Z_REPORT_TEMPLATE,
  ZReportTemplateBuilder,
  zReportTemplates,
} from './z-report-template';

export {
  DEFAULT_SHIFT_CLOSE_TEMPLATE,
  COMPACT_SHIFT_CLOSE_TEMPLATE,
  ShiftCloseTemplateBuilder,
  shiftCloseTemplates,
} from './shift-close-template';

// قاموس القوالب
import { ReceiptTemplateConfig, DEFAULT_RECEIPT_TEMPLATE, COMPACT_RECEIPT_TEMPLATE, DETAILED_RECEIPT_TEMPLATE } from './receipt-template';
import { ZReportTemplateConfig, DEFAULT_Z_REPORT_TEMPLATE, COMPACT_Z_REPORT_TEMPLATE } from './z-report-template';
import { ShiftCloseTemplateConfig, DEFAULT_SHIFT_CLOSE_TEMPLATE, COMPACT_SHIFT_CLOSE_TEMPLATE } from './shift-close-template';

// جميع القوالب المتاحة
export const allTemplates = {
  receipt: {
    default: DEFAULT_RECEIPT_TEMPLATE,
    compact: COMPACT_RECEIPT_TEMPLATE,
    detailed: DETAILED_RECEIPT_TEMPLATE,
  },
  zReport: {
    default: DEFAULT_Z_REPORT_TEMPLATE,
    compact: COMPACT_Z_REPORT_TEMPLATE,
  },
  shiftClose: {
    default: DEFAULT_SHIFT_CLOSE_TEMPLATE,
    compact: COMPACT_SHIFT_CLOSE_TEMPLATE,
  },
};

// نوع القالب
export type TemplateType = 'receipt' | 'zReport' | 'shiftClose';
export type TemplateId = 'default' | 'compact' | 'detailed';

// الحصول على قالب حسب النوع والمعرف
export function getTemplate(
  type: 'receipt',
  id: TemplateId
): ReceiptTemplateConfig;
export function getTemplate(
  type: 'zReport',
  id: 'default' | 'compact'
): ZReportTemplateConfig;
export function getTemplate(
  type: 'shiftClose',
  id: 'default' | 'compact'
): ShiftCloseTemplateConfig;
export function getTemplate(type: TemplateType, id: TemplateId): unknown {
  return allTemplates[type]?.[id as keyof typeof allTemplates[typeof type]] || allTemplates[type].default;
}

// الحصول على جميع قوالب نوع معين
export function getTemplatesByType(type: 'receipt'): ReceiptTemplateConfig[];
export function getTemplatesByType(type: 'zReport'): ZReportTemplateConfig[];
export function getTemplatesByType(type: 'shiftClose'): ShiftCloseTemplateConfig[];
export function getTemplatesByType(type: TemplateType): unknown[] {
  return Object.values(allTemplates[type]);
}
