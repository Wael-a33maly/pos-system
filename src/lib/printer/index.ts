// ==================== نظام الطباعة - ملف التصدير الرئيسي ====================

// الطابعة الحرارية
export * from './thermal-printer';

// اكتشاف الطابعات
export * from './printer-discovery';

// طابور الطباعة
export * from './print-queue';

// القوالب
export * from './templates';

// إعادة تصدير الأنواع
export type {
  PrinterConfig,
  ReceiptTemplate,
  PrintResult,
  InvoiceWithRelations,
  ShiftWithRelations,
  BarcodeOptions,
  QRCodeOptions,
  FontOptions,
  TableOptions,
} from './thermal-printer';

export type {
  DiscoveredPrinter,
  PrinterCapabilities,
  PrinterStatus,
  PrinterTestResult,
} from './printer-discovery';

export type {
  PrintJob,
  PrintJobStatus,
  PrintJobPriority,
  PrintJobType,
  PrintQueueConfig,
  PrintQueueStats,
  PrintLogEntry,
} from './print-queue';

// إعادة تصدير المثيلات
export { ThermalPrinter, thermalPrinter, ESC_POS } from './thermal-printer';
export { PrinterDiscovery, printerDiscovery } from './printer-discovery';
export { PrintQueue, printQueue } from './print-queue';
