// ==================== قالب الإيصال الأساسي ====================

import { ThermalPrinter, ESC_POS, PrinterConfig, ReceiptTemplate, InvoiceWithRelations } from '../thermal-printer';

// ==================== الأنواع ====================
export interface ReceiptTemplateConfig {
  id: string;
  name: string;
  nameAr: string;
  type: 'invoice' | 'return' | 'order' | 'quote';
  isDefault: boolean;
  isActive: boolean;
  
  // إعدادات الورق
  paperWidth: 58 | 80;
  paperType: 'thermal' | 'normal';
  
  // الخط
  fontFamily: string;
  fontSizeSmall: number;
  fontSizeNormal: number;
  fontSizeLarge: number;
  fontSizeTitle: number;
  fontSizeTotal: number;
  fontBold: boolean;
  
  // الهيدر
  showLogo: boolean;
  logoAlignment: 'left' | 'center' | 'right';
  logoMaxWidth: number;
  logoMaxHeight: number;
  showCompanyName: boolean;
  companyNameStyle: 'normal' | 'bold' | 'large' | 'bold_large';
  showBranchName: boolean;
  showBranchAddress: boolean;
  showBranchPhone: boolean;
  showTaxNumber: boolean;
  headerAlignment: 'left' | 'center' | 'right';
  
  // معلومات الفاتورة
  showInvoiceNumber: boolean;
  showDateTime: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  invoiceInfoAlignment: 'left' | 'center' | 'right';
  
  // العناصر
  showSku: boolean;
  showProductName: boolean;
  showVariant: boolean;
  showQuantity: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showLineTotal: boolean;
  itemsAlignment: 'left' | 'center' | 'right';
  showItemSeparator: boolean;
  
  // الإجماليات
  showSubtotal: boolean;
  showDiscountTotal: boolean;
  showTaxTotal: boolean;
  showTotal: boolean;
  showPaid: boolean;
  showChange: boolean;
  totalsAlignment: 'left' | 'center' | 'right';
  totalStyle: 'normal' | 'bold' | 'large' | 'bold_large';
  
  // الدفع
  showPaymentMethod: boolean;
  showPaymentDetails: boolean;
  
  // الفوتر
  showThankYou: boolean;
  thankYouMessage: string;
  showReturnPolicy: boolean;
  returnPolicyText: string;
  showQRCode: boolean;
  qrCodeData: 'invoice_number' | 'invoice_details' | 'zatca';
  showInvoiceBarcode: boolean;
  invoiceBarcodeFormat: 'CODE128' | 'EAN13' | 'CODE39';
  showFooterText: boolean;
  footerText: string;
  footerAlignment: 'left' | 'center' | 'right';
  
  // إضافي
  showSeparator: boolean;
  separatorChar: string;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number;
  
  // متقدم
  customCss?: string;
  customHeader?: string;
  customFooter?: string;
}

// ==================== القالب الافتراضي ====================
export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplateConfig = {
  id: 'default-receipt',
  name: 'Default Receipt',
  nameAr: 'قالب الإيصال الافتراضي',
  type: 'invoice',
  isDefault: true,
  isActive: true,
  
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
  logoMaxWidth: 200,
  logoMaxHeight: 80,
  showCompanyName: true,
  companyNameStyle: 'bold_large',
  showBranchName: true,
  showBranchAddress: true,
  showBranchPhone: true,
  showTaxNumber: true,
  headerAlignment: 'center',
  
  showInvoiceNumber: true,
  showDateTime: true,
  showCashier: true,
  showCustomer: true,
  invoiceInfoAlignment: 'right',
  
  showSku: false,
  showProductName: true,
  showVariant: true,
  showQuantity: true,
  showUnitPrice: true,
  showDiscount: true,
  showTax: true,
  showLineTotal: true,
  itemsAlignment: 'right',
  showItemSeparator: true,
  
  showSubtotal: true,
  showDiscountTotal: true,
  showTaxTotal: true,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  totalStyle: 'bold_large',
  
  showPaymentMethod: true,
  showPaymentDetails: true,
  
  showThankYou: true,
  thankYouMessage: 'شكراً لزيارتكم - نتمنى لكم يوماً سعيداً',
  showReturnPolicy: false,
  returnPolicyText: 'يمكن استرجاع المنتج خلال 14 يوماً مع الإيصال',
  showQRCode: false,
  qrCodeData: 'invoice_number',
  showInvoiceBarcode: true,
  invoiceBarcodeFormat: 'CODE128',
  showFooterText: true,
  footerText: 'نظام نقاط البيع المتقدم',
  footerAlignment: 'center',
  
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
};

// ==================== قالب مختصر ====================
export const COMPACT_RECEIPT_TEMPLATE: ReceiptTemplateConfig = {
  id: 'compact-receipt',
  name: 'Compact Receipt',
  nameAr: 'قالب مختصر',
  type: 'invoice',
  isDefault: false,
  isActive: true,
  
  paperWidth: 58,
  paperType: 'thermal',
  
  fontFamily: 'monospace',
  fontSizeSmall: 9,
  fontSizeNormal: 10,
  fontSizeLarge: 12,
  fontSizeTitle: 14,
  fontSizeTotal: 14,
  fontBold: true,
  
  showLogo: false,
  logoAlignment: 'center',
  logoMaxWidth: 150,
  logoMaxHeight: 50,
  showCompanyName: true,
  companyNameStyle: 'bold',
  showBranchName: true,
  showBranchAddress: false,
  showBranchPhone: false,
  showTaxNumber: false,
  headerAlignment: 'center',
  
  showInvoiceNumber: true,
  showDateTime: true,
  showCashier: false,
  showCustomer: false,
  invoiceInfoAlignment: 'right',
  
  showSku: false,
  showProductName: true,
  showVariant: false,
  showQuantity: true,
  showUnitPrice: false,
  showDiscount: false,
  showTax: false,
  showLineTotal: true,
  itemsAlignment: 'right',
  showItemSeparator: false,
  
  showSubtotal: false,
  showDiscountTotal: false,
  showTaxTotal: false,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  totalStyle: 'bold',
  
  showPaymentMethod: true,
  showPaymentDetails: false,
  
  showThankYou: true,
  thankYouMessage: 'شكراً لزيارتكم',
  showReturnPolicy: false,
  returnPolicyText: '',
  showQRCode: false,
  qrCodeData: 'invoice_number',
  showInvoiceBarcode: false,
  invoiceBarcodeFormat: 'CODE128',
  showFooterText: false,
  footerText: '',
  footerAlignment: 'center',
  
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
};

// ==================== قالب مفصل ====================
export const DETAILED_RECEIPT_TEMPLATE: ReceiptTemplateConfig = {
  id: 'detailed-receipt',
  name: 'Detailed Receipt',
  nameAr: 'قالب مفصل',
  type: 'invoice',
  isDefault: false,
  isActive: true,
  
  paperWidth: 80,
  paperType: 'thermal',
  
  fontFamily: 'monospace',
  fontSizeSmall: 10,
  fontSizeNormal: 12,
  fontSizeLarge: 14,
  fontSizeTitle: 18,
  fontSizeTotal: 18,
  fontBold: true,
  
  showLogo: true,
  logoAlignment: 'center',
  logoMaxWidth: 250,
  logoMaxHeight: 100,
  showCompanyName: true,
  companyNameStyle: 'bold_large',
  showBranchName: true,
  showBranchAddress: true,
  showBranchPhone: true,
  showTaxNumber: true,
  headerAlignment: 'center',
  
  showInvoiceNumber: true,
  showDateTime: true,
  showCashier: true,
  showCustomer: true,
  invoiceInfoAlignment: 'right',
  
  showSku: true,
  showProductName: true,
  showVariant: true,
  showQuantity: true,
  showUnitPrice: true,
  showDiscount: true,
  showTax: true,
  showLineTotal: true,
  itemsAlignment: 'right',
  showItemSeparator: true,
  
  showSubtotal: true,
  showDiscountTotal: true,
  showTaxTotal: true,
  showTotal: true,
  showPaid: true,
  showChange: true,
  totalsAlignment: 'right',
  totalStyle: 'bold_large',
  
  showPaymentMethod: true,
  showPaymentDetails: true,
  
  showThankYou: true,
  thankYouMessage: 'شكراً جزيلاً لزيارتكم - نتمنى لكم يوماً سعيداً',
  showReturnPolicy: true,
  returnPolicyText: 'يمكن استرجاع المنتج خلال 14 يوماً مع الفاتورة الأصلية',
  showQRCode: true,
  qrCodeData: 'invoice_details',
  showInvoiceBarcode: true,
  invoiceBarcodeFormat: 'CODE128',
  showFooterText: true,
  footerText: 'نظام نقاط البيع المتقدم - www.example.com',
  footerAlignment: 'center',
  
  showSeparator: true,
  separatorChar: '-',
  marginTop: 0,
  marginBottom: 0,
  lineSpacing: 1,
};

// ==================== ReceiptTemplateBuilder Class ====================
export class ReceiptTemplateBuilder {
  private printer: ThermalPrinter;
  private template: ReceiptTemplateConfig;
  private commands: string[];

  constructor(printerConfig: PrinterConfig, templateConfig?: Partial<ReceiptTemplateConfig>) {
    this.printer = new ThermalPrinter(printerConfig);
    this.template = { ...DEFAULT_RECEIPT_TEMPLATE, ...templateConfig };
    this.commands = [];
  }

  // ==================== بناء الإيصال ====================
  build(invoice: InvoiceWithRelations): string {
    this.commands = [];
    
    // تهيئة
    this.commands.push(ESC_POS.INIT);
    this.commands.push(ESC_POS.ENCODING_WPC1256);
    this.commands.push(ESC_POS.UTF_8_ON);
    this.commands.push(ESC_POS.UTF_8_MODE);
    
    // الهيدر
    this.buildHeader(invoice);
    
    // معلومات الفاتورة
    this.buildInvoiceInfo(invoice);
    
    // العناصر
    this.buildItems(invoice);
    
    // الإجماليات
    this.buildTotals(invoice);
    
    // المدفوعات
    this.buildPayments(invoice);
    
    // الفوتر
    this.buildFooter(invoice);
    
    // القص
    this.commands.push(ESC_POS.LINE_FEED.repeat(3));
    this.commands.push(ESC_POS.CUT_PAPER);
    
    return this.commands.join('');
  }

  // ==================== بناء الهيدر ====================
  private buildHeader(invoice: InvoiceWithRelations): void {
    this.setAlignment(this.template.headerAlignment);
    
    // الشعار
    if (this.template.showLogo && invoice.branch.logoUrl) {
      // سيتم معالجة الشعار لاحقاً
      this.commands.push('\n');
    }
    
    // اسم الشركة
    if (this.template.showCompanyName) {
      this.applyStyle(this.template.companyNameStyle);
      this.commands.push('نظام نقاط البيع\n');
      this.resetStyle();
    }
    
    // اسم الفرع
    if (this.template.showBranchName && invoice.branch.name) {
      this.commands.push(ESC_POS.BOLD_ON);
      this.commands.push(invoice.branch.name + '\n');
      this.commands.push(ESC_POS.BOLD_OFF);
    }
    
    // العنوان
    if (this.template.showBranchAddress && invoice.branch.address) {
      this.commands.push(invoice.branch.address + '\n');
    }
    
    // الهاتف
    if (this.template.showBranchPhone && invoice.branch.phone) {
      this.commands.push('هاتف: ' + invoice.branch.phone + '\n');
    }
    
    // الرقم الضريبي
    if (this.template.showTaxNumber && invoice.branch.taxNumber) {
      this.commands.push('الرقم الضريبي: ' + invoice.branch.taxNumber + '\n');
    }
    
    this.addSeparator();
  }

  // ==================== بناء معلومات الفاتورة ====================
  private buildInvoiceInfo(invoice: InvoiceWithRelations): void {
    this.setAlignment(this.template.invoiceInfoAlignment);
    
    const invoiceType = invoice.isReturn ? 'إيصال مرتجع' : 'إيصال بيع';
    this.commands.push(ESC_POS.BOLD_ON);
    this.commands.push(`*** ${invoiceType} ***\n`);
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showInvoiceNumber) {
      this.commands.push(`رقم: ${invoice.invoiceNumber}\n`);
    }
    
    if (this.template.showDateTime) {
      this.commands.push(`التاريخ: ${this.formatDate(invoice.createdAt)}\n`);
      this.commands.push(`الوقت: ${this.formatTime(invoice.createdAt)}\n`);
    }
    
    if (this.template.showCashier) {
      this.commands.push(`الكاشير: ${invoice.user.name}\n`);
    }
    
    if (this.template.showCustomer && invoice.customer) {
      this.commands.push(`العميل: ${invoice.customer.name}\n`);
    }
    
    this.addSeparator();
  }

  // ==================== بناء العناصر ====================
  private buildItems(invoice: InvoiceWithRelations): void {
    this.setAlignment(this.template.itemsAlignment);
    
    // العنوان
    this.commands.push(ESC_POS.BOLD_ON);
    const header = this.formatLine(
      this.template.showSku ? 'الرمز' : '',
      'الصنف',
      this.template.showQuantity ? 'الكمية' : '',
      this.template.showUnitPrice ? 'السعر' : '',
      this.template.showLineTotal ? 'الإجمالي' : ''
    );
    this.commands.push(header + '\n');
    this.commands.push(ESC_POS.BOLD_OFF);
    
    if (this.template.showItemSeparator) {
      this.addSeparator();
    }
    
    // العناصر
    for (const item of invoice.items) {
      const name = item.product?.name || item.productName;
      
      // اسم المنتج
      if (this.template.showProductName) {
        this.commands.push(name.substring(0, 25) + '\n');
      }
      
      // تفاصيل السطر
      const line = this.formatLine(
        this.template.showSku && item.product?.sku ? item.product.sku.substring(0, 8) : '',
        this.template.showVariant && item.variant?.name ? item.variant.name.substring(0, 15) : '',
        this.template.showQuantity ? item.quantity.toString() : '',
        this.template.showUnitPrice ? this.formatCurrency(item.unitPrice) : '',
        this.template.showLineTotal ? this.formatCurrency(item.totalAmount) : ''
      );
      this.commands.push(line + '\n');
      
      // الخصم
      if (this.template.showDiscount && item.discountAmount > 0) {
        this.commands.push(`  خصم: ${this.formatCurrency(item.discountAmount)}\n`);
      }
      
      // الضريبة
      if (this.template.showTax && item.taxAmount > 0) {
        this.commands.push(`  ضريبة: ${this.formatCurrency(item.taxAmount)}\n`);
      }
    }
    
    this.addSeparator();
  }

  // ==================== بناء الإجماليات ====================
  private buildTotals(invoice: InvoiceWithRelations): void {
    this.setAlignment(this.template.totalsAlignment);
    
    if (this.template.showSubtotal) {
      this.printTwoColumns('المجموع الفرعي:', this.formatCurrency(invoice.subtotal));
    }
    
    if (this.template.showDiscountTotal && invoice.discountAmount > 0) {
      this.printTwoColumns('الخصم:', this.formatCurrency(invoice.discountAmount));
    }
    
    if (this.template.showTaxTotal && invoice.taxAmount > 0) {
      this.printTwoColumns('الضريبة:', this.formatCurrency(invoice.taxAmount));
    }
    
    if (this.template.showTotal) {
      this.addSeparator();
      this.applyStyle(this.template.totalStyle);
      this.printTwoColumns('الإجمالي:', this.formatCurrency(invoice.totalAmount));
      this.resetStyle();
    }
    
    if (this.template.showPaid) {
      this.printTwoColumns('المدفوع:', this.formatCurrency(invoice.paidAmount));
    }
    
    if (this.template.showChange && invoice.changeAmount > 0) {
      this.printTwoColumns('الباقي:', this.formatCurrency(invoice.changeAmount));
    }
    
    this.addSeparator();
  }

  // ==================== بناء المدفوعات ====================
  private buildPayments(invoice: InvoiceWithRelations): void {
    if (!this.template.showPaymentMethod) return;
    
    this.setAlignment(this.template.totalsAlignment);
    
    for (const payment of invoice.payments) {
      this.printTwoColumns(
        payment.paymentMethod.nameAr + ':',
        this.formatCurrency(payment.amount)
      );
    }
  }

  // ==================== بناء الفوتر ====================
  private buildFooter(invoice: InvoiceWithRelations): void {
    this.setAlignment(this.template.footerAlignment);
    
    if (this.template.showThankYou) {
      this.commands.push(ESC_POS.BOLD_ON);
      this.commands.push(this.template.thankYouMessage + '\n');
      this.commands.push(ESC_POS.BOLD_OFF);
    }
    
    if (this.template.showReturnPolicy && this.template.returnPolicyText) {
      this.commands.push(this.template.returnPolicyText + '\n');
    }
    
    // الباركود
    if (this.template.showInvoiceBarcode) {
      this.commands.push('\n');
      this.setAlignment('center');
      this.commands.push(ESC_POS.BARCODE_HEIGHT(60));
      this.commands.push(ESC_POS.BARCODE_WIDTH(3));
      this.commands.push(ESC_POS.BARCODE_TEXT_POSITION_BELOW);
      
      switch (this.template.invoiceBarcodeFormat) {
        case 'CODE128':
          this.commands.push(ESC_POS.BARCODE_CODE128(invoice.invoiceNumber));
          break;
        case 'EAN13':
          this.commands.push(ESC_POS.BARCODE_EAN13(invoice.invoiceNumber));
          break;
        case 'CODE39':
          this.commands.push(ESC_POS.BARCODE_CODE39(invoice.invoiceNumber));
          break;
      }
    }
    
    // QR Code
    if (this.template.showQRCode) {
      this.commands.push('\n');
      this.setAlignment('center');
      
      let qrData = '';
      switch (this.template.qrCodeData) {
        case 'invoice_number':
          qrData = invoice.invoiceNumber;
          break;
        case 'invoice_details':
          qrData = JSON.stringify({
            invoice: invoice.invoiceNumber,
            total: invoice.totalAmount,
            date: invoice.createdAt,
          });
          break;
        case 'zatca':
          // ZATCA compliant QR
          qrData = `Invoice:${invoice.invoiceNumber}|Total:${invoice.totalAmount}|Tax:${invoice.taxAmount}|Date:${invoice.createdAt}`;
          break;
      }
      
      this.commands.push(ESC_POS.QR_MODEL(2));
      this.commands.push(ESC_POS.QR_SIZE(6));
      this.commands.push(ESC_POS.QR_ERROR_CORRECTION('M'));
      this.commands.push(ESC_POS.QR_DATA(qrData));
      this.commands.push(ESC_POS.QR_PRINT);
    }
    
    // نص الفوتر
    if (this.template.showFooterText && this.template.footerText) {
      this.commands.push('\n');
      this.commands.push(this.template.footerText + '\n');
    }
  }

  // ==================== دوال مساعدة ====================
  
  private setAlignment(align: 'left' | 'center' | 'right'): void {
    switch (align) {
      case 'left':
        this.commands.push(ESC_POS.ALIGN_LEFT);
        break;
      case 'center':
        this.commands.push(ESC_POS.ALIGN_CENTER);
        break;
      case 'right':
        this.commands.push(ESC_POS.ALIGN_RIGHT);
        break;
    }
  }

  private applyStyle(style: string): void {
    switch (style) {
      case 'bold':
        this.commands.push(ESC_POS.BOLD_ON);
        break;
      case 'large':
        this.commands.push(ESC_POS.SIZE_DOUBLE_WIDTH);
        break;
      case 'bold_large':
        this.commands.push(ESC_POS.BOLD_ON);
        this.commands.push(ESC_POS.SIZE_DOUBLE);
        break;
    }
  }

  private resetStyle(): void {
    this.commands.push(ESC_POS.BOLD_OFF);
    this.commands.push(ESC_POS.SIZE_NORMAL);
  }

  private addSeparator(): void {
    if (this.template.showSeparator) {
      this.commands.push(this.template.separatorChar.repeat(this.template.paperWidth === 80 ? 48 : 32) + '\n');
    }
  }

  private formatLine(...cols: string[]): string {
    const width = this.template.paperWidth === 80 ? 48 : 32;
    const validCols = cols.filter(c => c);
    const colWidth = Math.floor(width / Math.max(1, validCols.length));
    return validCols.map(c => c.padStart(colWidth)).join('');
  }

  private printTwoColumns(label: string, value: string): void {
    const width = this.template.paperWidth === 80 ? 48 : 32;
    const labelWidth = Math.floor(width * 0.5);
    const valueWidth = width - labelWidth;
    this.commands.push(label.padStart(labelWidth) + value.padStart(valueWidth) + '\n');
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ر.س';
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ==================== الحصول على القوالب المتاحة ====================
  static getAvailableTemplates(): ReceiptTemplateConfig[] {
    return [
      DEFAULT_RECEIPT_TEMPLATE,
      COMPACT_RECEIPT_TEMPLATE,
      DETAILED_RECEIPT_TEMPLATE,
    ];
  }
}

// ==================== Export ====================
export const receiptTemplates = {
  default: DEFAULT_RECEIPT_TEMPLATE,
  compact: COMPACT_RECEIPT_TEMPLATE,
  detailed: DETAILED_RECEIPT_TEMPLATE,
};
