// ============================================
// Printing Types - أنواع الطباعة
// ============================================

// ==================== Enums ====================
export type PaperType = 'thermal' | 'a4' | 'pdf';
export type PrintMethod = 'thermal' | 'pdf' | 'browser';

// ==================== Receipt Template ====================
export interface ReceiptTemplate {
  id: string;
  name: string;
  nameAr?: string;
  type: 'invoice' | 'return' | 'shift_close' | 'expense' | 'report';
  branchId?: string;
  
  // Paper dimensions
  paperWidth: number;  // mm: 58, 80
  paperType: PaperType;
  
  // Font settings
  fontFamily: string;
  fontSizeSmall: number;
  fontSizeNormal: number;
  fontSizeLarge: number;
  fontSizeTitle: number;
  fontSizeTotal: number;
  fontBold: boolean;
  
  // Header settings
  showLogo: boolean;
  logoAlignment: 'left' | 'center' | 'right';
  showCompanyName: boolean;
  companyNameStyle: 'normal' | 'bold' | 'bold_large';
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  headerAlignment: 'left' | 'center' | 'right';
  
  // Body settings
  showSku: boolean;
  showProductName: boolean;
  showVariant: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showLineTotal: boolean;
  showBarcode: boolean;
  
  // Totals settings
  showSubtotal: boolean;
  showDiscountTotal: boolean;
  showTaxTotal: boolean;
  showTotal: boolean;
  showPaid: boolean;
  showChange: boolean;
  totalsAlignment: 'left' | 'center' | 'right';
  
  // Footer settings
  showThankYou: boolean;
  thankYouMessage: string;
  showReturnPolicy: boolean;
  returnPolicyText?: string;
  showQRCode: boolean;
  showInvoiceBarcode: boolean;
  showDateTime: boolean;
  showCashier: boolean;
  showInvoiceNumber: boolean;
  
  // Advanced settings
  showSeparator: boolean;
  separatorChar: string;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number;
  
  // Status
  isDefault: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Branch Print Config ====================
export interface BranchPrintConfig {
  id: string;
  branchId: string;
  
  // Default templates
  invoiceTemplateId?: string;
  returnTemplateId?: string;
  shiftCloseTemplateId?: string;
  expenseTemplateId?: string;
  
  // Printer settings
  printerName?: string;
  printerType: 'thermal' | 'laser' | 'inkjet';
  connectionType: 'usb' | 'network' | 'bluetooth';
  printerIp?: string;
  printerPort?: number;
  
  // Print options
  autoPrintInvoice: boolean;
  autoPrintReturn: boolean;
  printCopies: number;
  openCashDrawer: boolean;
  cutPaper: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Print Log ====================
export interface PrintLog {
  id: string;
  templateId?: string;
  branchId: string;
  userId: string;
  type: 'invoice' | 'return' | 'shift_close' | 'expense';
  referenceId?: string;
  referenceNumber?: string;
  printMethod: PrintMethod;
  copies: number;
  success: boolean;
  errorMessage?: string;
  printedAt: Date;
}

// ==================== Invoice Data for Printing ====================
export interface InvoicePrintData {
  // Company info
  companyName: string;
  companyLogo?: string;
  companyTaxNumber?: string;
  
  // Branch info
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
  
  // Invoice info
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: 'sale' | 'return';
  
  // Customer info
  customerName?: string;
  customerPhone?: string;
  customerTaxNumber?: string;
  
  // Items
  items: InvoicePrintItem[];
  
  // Totals
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  
  // Payment
  paymentMethod: string;
  
  // Additional
  cashierName: string;
  notes?: string;
  
  // QR Code data
  qrData?: string;
}

export interface InvoicePrintItem {
  productName: string;
  barcode?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  variant?: string;
}

// ==================== Form Data ====================
export interface ReceiptTemplateFormData {
  name: string;
  nameAr?: string;
  type: 'invoice' | 'return' | 'shift_close' | 'expense' | 'report';
  branchId?: string;
  paperWidth: number;
  paperType: PaperType;
  
  fontFamily: string;
  fontSizeSmall: number;
  fontSizeNormal: number;
  fontSizeLarge: number;
  fontSizeTitle: number;
  fontSizeTotal: number;
  fontBold: boolean;
  
  showLogo: boolean;
  logoAlignment: 'left' | 'center' | 'right';
  showCompanyName: boolean;
  companyNameStyle: 'normal' | 'bold' | 'bold_large';
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  headerAlignment: 'left' | 'center' | 'right';
  
  showSku: boolean;
  showProductName: boolean;
  showVariant: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showLineTotal: boolean;
  showBarcode: boolean;
  
  showSubtotal: boolean;
  showDiscountTotal: boolean;
  showTaxTotal: boolean;
  showTotal: boolean;
  showPaid: boolean;
  showChange: boolean;
  totalsAlignment: 'left' | 'center' | 'right';
  
  showThankYou: boolean;
  thankYouMessage: string;
  showReturnPolicy: boolean;
  returnPolicyText?: string;
  showQRCode: boolean;
  showInvoiceBarcode: boolean;
  showDateTime: boolean;
  showCashier: boolean;
  showInvoiceNumber: boolean;
  
  showSeparator: boolean;
  separatorChar: string;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number;
  
  isDefault: boolean;
  isActive: boolean;
}

// ==================== Default Template ====================
export const DEFAULT_RECEIPT_TEMPLATE: Partial<ReceiptTemplate> = {
  paperWidth: 80,
  paperType: 'thermal',
  fontFamily: 'monospace',
  fontSizeSmall: 10,
  fontSizeNormal: 12,
  fontSizeLarge: 14,
  fontSizeTitle: 18,
  fontSizeTotal: 16,
  fontBold: true,
  
  showLogo: true,
  logoAlignment: 'center',
  showCompanyName: true,
  companyNameStyle: 'bold_large',
  showBranchName: true,
  showBranchAddress: true,
  showBranchPhone: true,
  showTaxNumber: true,
  headerAlignment: 'center',
  
  showSku: false,
  showProductName: true,
  showVariant: true,
  showQuantity: true,
  showUnitPrice: true,
  showDiscount: true,
  showTax: true,
  showLineTotal: true,
  showBarcode: false,
  
  showSubtotal: true,
  showDiscountTotal: true,
  showTaxTotal: true,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  
  showThankYou: true,
  thankYouMessage: 'شكراً لزيارتكم',
  showReturnPolicy: false,
  showQRCode: false,
  showInvoiceBarcode: true,
  showDateTime: true,
  showCashier: true,
  showInvoiceNumber: true,
  
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
  
  isDefault: false,
  isActive: true,
};

// ==================== Labels ====================
export const PAPER_TYPE_LABELS: Record<PaperType, { label: string; labelAr: string }> = {
  thermal: { label: 'Thermal', labelAr: 'حراري' },
  a4: { label: 'A4 Paper', labelAr: 'ورق A4' },
  pdf: { label: 'PDF', labelAr: 'PDF' },
};

export const TEMPLATE_TYPE_LABELS: Record<string, { label: string; labelAr: string }> = {
  invoice: { label: 'Invoice', labelAr: 'فاتورة' },
  return: { label: 'Return', labelAr: 'مرتجع' },
  shift_close: { label: 'Shift Close', labelAr: 'إغلاق وردية' },
  expense: { label: 'Expense', labelAr: 'مصروف' },
  report: { label: 'Report', labelAr: 'تقرير' },
};
